import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import * as chalk from 'chalk';
import { execSync } from 'child_process';
import pLimit from 'p-limit';
import cliProgress from 'cli-progress';

// 动态导入 ffmpeg-static
let ffmpegPath: string = 'ffmpeg';
try {
	ffmpegPath = require('ffmpeg-static') as string;
} catch (error) {
	// 如果没有安装 ffmpeg-static，使用系统的 ffmpeg
	ffmpegPath = 'ffmpeg';
}

interface VideoInfo {
	title: string;
	author: string;
	description: string;
	uploadDate: string;
	bvid: string;
}

interface AudioStream {
	baseUrl?: string;
	base_url?: string;
	backupUrl?: string[];
	backup_url?: string[];
	bandwidth: number;
}

interface VideoData {
	audioArr: AudioStream[];
	videoArr: any[];
	dolby: any[];
	videoInfo: VideoInfo;
}

interface SeasonArchive {
	aid: number;
	bvid: string;
	ctime: number;
	duration: number;
	title: string;
	pic: string;
	pubdate: number;
	stat: {
		view: number;
		vt: number;
		danmaku: number;
	};
	state: number;
	ugc_pay: number;
	vt_display: string;
	is_lesson_video: number;
}

interface SeasonMeta {
	category: number;
	cover: string;
	description: string;
	mid: number;
	name: string;
	ptime: number;
	season_id: number;
	total: number;
	title: string;
}

interface SeasonResponse {
	code: number;
	message: string;
	ttl: number;
	data: {
		aids: number[];
		archives: SeasonArchive[];
		meta: SeasonMeta;
		page: {
			page_num: number;
			page_size: number;
			total: number;
		};
	};
}

interface Config {
	downloadDir: string;
	cookieFile: string;
	headers: {
		[key: string]: string;
	};
	audioFormat: 'flac' | 'mp3' | 'wav' | 'm4a'; // 目标音频格式
	audioBitrate: string; // 音频比特率 (仅用于有损格式如mp3)
	ffmpegPath: string; // FFmpeg 可执行文件路径
	concurrency: number; // 并发下载数量
}

const log = console.log;
log('Downloader module loaded');

// ==================== Config (只保留配置相关的全局变量) ====================
const config: Config = {
	downloadDir: path.join(__dirname, "downloads"),
	cookieFile: path.join(__dirname, 'cookies.txt'),
	audioFormat: 'mp3', // 默认转换为 FLAC 音乐格式
	audioBitrate: '320k', // MP3 比特率
	ffmpegPath: ffmpegPath || 'ffmpeg', // 使用打包的 ffmpeg，如果没有则使用系统的
	concurrency: 3, // 同时下载 3 首歌
	headers: {
		'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
		'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
		'cache-control': 'no-cache',
		'pragma': 'no-cache',
		'priority': 'u=0, i',
		'referer': 'https://www.bilibili.com',
		'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
		'sec-ch-ua-mobile': '?0',
		'sec-ch-ua-platform': '"Windows"',
		'sec-fetch-dest': 'document',
		'sec-fetch-mode': 'navigate',
		'sec-fetch-site': 'same-origin',
		'sec-fetch-user': '?1',
		'upgrade-insecure-requests': '1',
		'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
		'cookie': ''
	}
};

// 确保下载目录存在
if (!fs.existsSync(config.downloadDir)) {
	fs.mkdirSync(config.downloadDir);
}

// ==================== Cookie 管理 ====================
function loadCookies(): boolean {
	try {
		if (fs.existsSync(config.cookieFile)) {
			const cookie = fs.readFileSync(config.cookieFile, 'utf-8').trim();
			if (cookie) {
				log(chalk.green('Cookies loaded from file.'));
				config.headers.cookie = cookie;
				return true;
			}
		}
	} catch (error: any) {
		log(chalk.red('No cookies file found, proceeding without cookies.'));
	}
	return false;
}

function validateCookie(cookie: string): boolean {
	if (!cookie || cookie.length < 100) {
		log(chalk.yellow('⚠️  Cookie seems too short (less than 100 characters)'));
		return false;
	}
	if (!cookie.includes(';')) {
		log(chalk.yellow('⚠️  Cookie should contain semicolons (;)'));
		return false;
	}
	if (!cookie.includes('buvid4')) {
		log(chalk.yellow('⚠️  Cookie seems to be missing key fields'));
		return false;
	}
	return true;
}

function setupCookie(rl: readline.Interface): Promise<void> {
	return new Promise((resolve) => {
		log(chalk.yellow('No cookies found. Please enter your Bilibili cookies to proceed.'));
		log(chalk.gray('(You can get it from browser DevTools -> Application -> Cookies)\n'));

		const askForCookie = () => {
			rl.question('Enter your cookies: ', (inputCookie) => {
				if (!inputCookie.trim()) {
					log(chalk.red('Cookie cannot be empty!'));
					promptRetry();
					return;
				}

				if (!validateCookie(inputCookie)) {
					promptRetry();
					return;
				}

				config.headers.cookie = inputCookie.trim();
				fs.writeFileSync(config.cookieFile, inputCookie.trim(), 'utf-8');
				log(chalk.green('Cookies saved successfully.\n'));
				resolve();
			});
		};

		const promptRetry = () => {
			rl.question('Do you want to re-enter cookies? (y/n): ', (answer) => {
				const trimmed = answer.trim().toLowerCase();
				if (trimmed === 'y' || trimmed === 'yes') {
					askForCookie();
				} else {
					log(chalk.red('Cannot proceed without valid cookies. Exiting.'));
					rl.close();
					process.exit(1);
				}
			});
		};

		askForCookie();
	});
}

// ==================== URL 解析 ====================
function isSeasonUrl(url: string): boolean {
	return url.includes('seasons_archives_list');
}

function extractBVID(url: string): string | null {
	const bvidMatch = url.match(/BV[0-9A-Za-z]+/);
	return bvidMatch ? bvidMatch[0] : null;
}

function extractSeasonId(url: string): string | null {
	// 方式1: 从API URL中提取 (原有方式)
	// https://api.bilibili.com/x/polymer/web-space/seasons_archives_list?season_id=2209693&...
	let seasonIdMatch = url.match(/season_id=(\d+)/);
	if (seasonIdMatch) {
		return seasonIdMatch[1];
	}

	// 方式2: 从用户空间合集URL中提取
	// https://space.bilibili.com/1060544882/lists/1049571?type=season
	// https://space.bilibili.com/xxx/lists/SEASON_ID
	seasonIdMatch = url.match(/\/lists\/(\d+)/);
	if (seasonIdMatch) {
		return seasonIdMatch[1];
	}

	return null;
}

// ==================== 文件名处理 ====================
function sanitizeFilename(filename: string): string {
	// 移除或替换Windows/Linux文件系统中的非法字符
	return filename
		.replace(/[<>:"/\\|?*]/g, '') // 移除非法字符
		.replace(/\s+/g, ' ') // 多个空格替换为单个
		.trim()
		.substring(0, 200); // 限制长度，避免过长
}

function generateFilename(videoInfo: VideoInfo, extension: string): string {
	const title = sanitizeFilename(videoInfo.title);
	const author = sanitizeFilename(videoInfo.author);
	return `${title} - ${author}.${extension}`;
}

// ==================== 音频格式转换 ====================
function convertAudioFormat(
	inputPath: string,
	outputPath: string,
	format: 'flac' | 'mp3' | 'wav' | 'm4a',
	bitrate?: string
): boolean {
	try {
		log(chalk.blue(`Converting to ${format.toUpperCase()}...`));

		// 如果是 m4a，直接复制不转换
		if (format === 'm4a') {
			fs.copyFileSync(inputPath, outputPath);
			log(chalk.green(`✅ Saved as M4A`));
			return true;
		}

		// 使用 ffmpeg-static 提供的路径，或回退到配置的路径
		const ffmpegExe = ffmpegPath || config.ffmpegPath || 'ffmpeg';

		let command = '';
		switch (format) {
			case 'flac':
				command = `"${ffmpegExe}" -i "${inputPath}" -c:a flac -compression_level 8 "${outputPath}" -y`;
				break;
			case 'mp3':
				command = `"${ffmpegExe}" -i "${inputPath}" -c:a libmp3lame -b:a ${bitrate || '320k'} "${outputPath}" -y`;
				break;
			case 'wav':
				command = `"${ffmpegExe}" -i "${inputPath}" -c:a pcm_s16le "${outputPath}" -y`;
				break;
		}

		// 同步执行转换（阻塞直到完成）
		execSync(command, { stdio: 'ignore' }); // 隐藏 ffmpeg 输出

		// 删除临时 m4a 文件
		try {
			fs.unlinkSync(inputPath);
		} catch (error: any) {
			log(chalk.yellow(`Warning: Could not delete temp file`));
		}

		log(chalk.green(`✅ Converted to ${format.toUpperCase()}`));
		return true;

	} catch (error: any) {
		log(chalk.red(`❌ Conversion failed: ${error.message || 'Unknown error'}`));
		log(chalk.yellow(`Hint: Install FFmpeg or run: npm install ffmpeg-static`));
		// 转换失败，保留 m4a 文件
		return false;
	}
}

// ==================== HTML/数据获取 ====================
async function fetchVideoHtml(url: string): Promise<string> {
	const response = await axios.get(url, {
		headers: config.headers
	});
	return response.data;
}

async function fetchSeasonData(url: string): Promise<SeasonResponse> {
	const response = await axios.get(url, {
		headers: config.headers
	});
	return response.data;
}

// ==================== 数据提取 ====================
function extractVideoDataFromHtml(html: string, bvid: string): VideoData | null {
	const regex = /window\.__playinfo__\s*=\s*(\{.*?\})\s*<\/script>/;
	const match = html.match(regex);

	if (!match || !match[1]) {
		log(chalk.red('Failed to extract playinfo from HTML'));
		return null;
	}

	try {
		const playinfoJson = JSON.parse(match[1]);

		// 提取视频信息
		const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/);
		const authorMatch = html.match(/<meta[^>]*name="author"[^>]*content="([^"]*)"/);
		const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/);

		// 清理标题：移除 "_哔哩哔哩_bilibili" 等后缀
		let cleanTitle = titleMatch ? titleMatch[1].trim() : 'Unknown';
		cleanTitle = cleanTitle
			.replace(/_哔哩哔哩_bilibili$/i, '')
			.replace(/ - 哔哩哔哩$/i, '')
			.replace(/\s+$/, '')
			.trim();

		const videoInfo: VideoInfo = {
			title: cleanTitle,
			author: authorMatch ? authorMatch[1] : 'Unknown',
			description: descMatch ? descMatch[1].replace(/\s*[，,]\s*相关视频[:：]?\s*.*$/, '').trim() : '',
			uploadDate: '',
			bvid: bvid
		};

		const videoData: VideoData = {
			audioArr: playinfoJson.data.dash.audio || [],
			videoArr: playinfoJson.data.dash.video || [],
			dolby: playinfoJson.data.dash.dolby || [],
			videoInfo: videoInfo
		};

		// 可选：保存调试信息
		fs.writeFileSync(
			path.join(config.downloadDir, 'playinfo.json'),
			JSON.stringify(videoData, null, 4),
			'utf-8'
		);

		return videoData;
	} catch (error) {
		log(chalk.red('Failed to parse playinfo JSON:', error));
		return null;
	}
}

// ==================== 下载功能 ====================
async function downloadAudioToFolder(
	audioStreams: AudioStream[],
	videoInfo: VideoInfo,
	targetFolder: string
): Promise<boolean> {
	if (audioStreams.length === 0) {
		log(chalk.red('No audio streams found to download.'));
		return false;
	}

	log(chalk.yellow(`Found ${audioStreams.length} audio stream(s). Downloading the highest quality one.`));

	// 按带宽排序,选择最高质量
	const sortedStreams = [...audioStreams].sort((a, b) => b.bandwidth - a.bandwidth);
	const bestAudio = sortedStreams[0];

	// 收集所有可能的URL (过滤掉 undefined/null)
	const urlsToDownload = [
		bestAudio.baseUrl,
		bestAudio.base_url,
		...(bestAudio.backupUrl || []),
		...(bestAudio.backup_url || [])
	].filter((url): url is string => !!url); // 类型守卫：确保过滤后都是 string

	// 尝试每个URL直到成功
	for (const url of urlsToDownload) {
		try {
			log(chalk.blue(`Downloading audio from URL: ${url.substring(0, 80)}...`));

			const res = await axios.get(url, {
				headers: config.headers,
				responseType: 'arraybuffer',
			});

			if (res.status !== 200) {
				log(chalk.yellow(`Warning: Received status code ${res.status}. Trying next URL...`));
				continue;
			}

			if (!res.data || res.data.byteLength === 0) {
				log(chalk.yellow('Warning: Empty response data. Trying next URL...'));
				continue;
			}

			// 下载成功,保存为临时 m4a 文件
			const tempFilename = generateFilename(videoInfo, 'm4a');
			const tempFilepath = path.join(targetFolder, tempFilename);
			fs.writeFileSync(tempFilepath, Buffer.from(res.data));

			// 如果目标格式不是 m4a，则转换
			if (config.audioFormat !== 'm4a') {
				const finalFilename = generateFilename(videoInfo, config.audioFormat);
				const finalFilepath = path.join(targetFolder, finalFilename);

				const success = convertAudioFormat(
					tempFilepath,
					finalFilepath,
					config.audioFormat,
					config.audioBitrate
				);

				if (success) {
					log(chalk.green(`✅ Download finished: ${finalFilename}`));
				} else {
					log(chalk.red(`❌ Conversion failed, keeping original m4a file`));
					log(chalk.yellow(`Saved as: ${tempFilename}`));
				}
			} else {
				log(chalk.green(`✅ Download finished: ${tempFilename}`));
			}

			return true;
		} catch (error: any) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			log(chalk.yellow(`Error downloading from ${url.substring(0, 50)}...: ${errorMsg}`));
			log(chalk.yellow('Trying next URL...'));
			continue;
		}
	}

	log(chalk.red('❌ Failed to download audio from all available URLs.'));
	return false;
}

async function downloadAudioStream(audioStreams: AudioStream[], videoInfo: VideoInfo): Promise<boolean> {
	return downloadAudioToFolder(audioStreams, videoInfo, config.downloadDir);
}

// ==================== 合集列表获取 ====================
async function fetchAllSeasonArchives(seasonId: string): Promise<{ archives: SeasonArchive[], meta: SeasonMeta } | null> {
	try {
		const allArchives: SeasonArchive[] = [];
		let pageNum = 1;
		const pageSize = 100; // 每页获取100个
		let meta: SeasonMeta | null = null;

		log(chalk.blue('Fetching season data...'));

		while (true) {
			const url = `https://api.bilibili.com/x/polymer/web-space/seasons_archives_list?season_id=${seasonId}&page_size=${pageSize}&page_num=${pageNum}`;
			const response = await fetchSeasonData(url);

			if (response.code !== 0) {
				log(chalk.red(`API Error: ${response.message}`));
				return null;
			}

			// 保存 meta 信息
			if (!meta) {
				meta = response.data.meta;
			}

			// 如果没有数据了，退出循环
			if (response.data.archives.length === 0) {
				break;
			}

			allArchives.push(...response.data.archives);
			log(chalk.gray(`Fetched page ${pageNum}, total: ${allArchives.length}/${meta.total}`));

			// 如果已经获取了所有视频，退出
			if (allArchives.length >= meta.total) {
				break;
			}

			pageNum++;

			// 稍微延迟，避免请求过快
			await new Promise(resolve => setTimeout(resolve, 300));
		}

		log(chalk.green(`✅ Fetched ${allArchives.length} videos from season\n`));
		return { archives: allArchives, meta: meta! };

	} catch (error: any) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		log(chalk.red('Error fetching season archives:', errorMsg));
		return null;
	}
}

// ==================== 合集预览 ====================
async function previewSeasonArchives(archives: SeasonArchive[], meta: SeasonMeta, rl: readline.Interface): Promise<void> {
	return new Promise((resolve) => {
		const itemsPerPage = 10;
		let currentPage = 0;
		const totalPages = Math.ceil(archives.length / itemsPerPage);

		const displayPage = () => {
			console.clear();
			log(chalk.bold.cyan(`\n=== ${meta.title} ===`));
			log(chalk.gray(`Total: ${meta.total} videos | Page ${currentPage + 1}/${totalPages}\n`));

			const startIdx = currentPage * itemsPerPage;
			const endIdx = Math.min(startIdx + itemsPerPage, archives.length);

			for (let i = startIdx; i < endIdx; i++) {
				const archive = archives[i];
				log(chalk.white(`${i + 1}. `) + chalk.green(archive.title));
				log(chalk.gray(`   BVID: ${archive.bvid} | Duration: ${archive.duration}s | Views: ${archive.stat.view}\n`));
			}

			log(chalk.yellow('\nControls:'));
			log(chalk.gray('  [A] or [←] Previous page'));
			log(chalk.gray('  [D] or [→] Next page'));
			log(chalk.gray('  [ESC] Return to menu\n'));
		};

		displayPage();

		// 暂停 readline，启用 raw mode
		rl.pause();
		if (process.stdin.isTTY) {
			process.stdin.setRawMode(true);
		}
		process.stdin.resume();
		process.stdin.setEncoding('utf8');

		const onKeyPress = (key: string) => {
			// ESC 键 (ASCII 27)
			if (key === '\u001b') {
				cleanup();
				resolve();
				return;
			}

			// Ctrl+C
			if (key === '\u0003') {
				cleanup();
				process.exit(0);
			}

			// 左箭头或 'a'
			if (key === '\u001b[D' || key.toLowerCase() === 'a') {
				if (currentPage > 0) {
					currentPage--;
					displayPage();
				}
			}

			// 右箭头或 'd'
			if (key === '\u001b[C' || key.toLowerCase() === 'd') {
				if (currentPage < totalPages - 1) {
					currentPage++;
					displayPage();
				}
			}
		};

		const cleanup = () => {
			process.stdin.removeListener('data', onKeyPress);
			if (process.stdin.isTTY) {
				process.stdin.setRawMode(false);
			}
			process.stdin.pause();
			// 恢复 readline
			rl.resume();
		};

		process.stdin.on('data', onKeyPress);
	});
}

// ==================== 合集下载菜单 ====================
async function showSeasonMenu(archives: SeasonArchive[], meta: SeasonMeta, rl: readline.Interface): Promise<'preview' | 'download' | 'cancel'> {
	return new Promise((resolve) => {
		console.clear();
		log(chalk.bold.cyan(`\n=== ${meta.title} ===`));
		log(chalk.green(`Total videos: ${meta.total}\n`));
		log(chalk.yellow('What would you like to do?'));
		log(chalk.white('  [1] Preview list'));
		log(chalk.white('  [2] Download all'));
		log(chalk.white('  [ESC] Cancel\n'));

		// 暂停 readline，启用 raw mode
		rl.pause();
		if (process.stdin.isTTY) {
			process.stdin.setRawMode(true);
		}
		process.stdin.resume();
		process.stdin.setEncoding('utf8');

		const onKeyPress = (key: string) => {
			cleanup();

			if (key === '1') {
				resolve('preview');
			} else if (key === '2') {
				resolve('download');
			} else if (key === '\u001b') { // ESC
				resolve('cancel');
			} else if (key === '\u0003') { // Ctrl+C
				process.exit(0);
			}
		};

		const cleanup = () => {
			process.stdin.removeListener('data', onKeyPress);
			if (process.stdin.isTTY) {
				process.stdin.setRawMode(false);
			}
			process.stdin.pause();
			// 恢复 readline
			rl.resume();
		};

		process.stdin.on('data', onKeyPress);
	});
}
async function downloadSingleVideo(url: string): Promise<boolean> {
	try {
		// 1. 提取BVID
		const bvid = extractBVID(url);
		if (!bvid) {
			log(chalk.red('Failed to extract BVID from URL'));
			return false;
		}
		log(chalk.blue(`Extracted BVID: ${bvid}`));

		// 2. 获取HTML
		const html = await fetchVideoHtml(url);

		// 3. 提取视频数据
		const videoData = extractVideoDataFromHtml(html, bvid);
		if (!videoData) {
			return false;
		}

		// 4. 显示视频信息
		log(chalk.green(`Video Title: ${videoData.videoInfo.title}`));
		log(chalk.green(`Author: ${videoData.videoInfo.author}`));
		log(chalk.green(`BVID: ${videoData.videoInfo.bvid}`));
		log(chalk.green(`Description: ${videoData.videoInfo.description}`));

		// 5. 下载音频
		const success = await downloadAudioStream(videoData.audioArr, videoData.videoInfo);
		return success;
	} catch (error: any) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		log(chalk.red('Error during video download:', errorMsg));
		return false;
	}
}

// ==================== 单个视频下载（用于并发） ====================
async function downloadSingleArchive(
	archive: SeasonArchive,
	seasonFolder: string,
	index: number,
	total: number
): Promise<{ success: boolean, title: string }> {
	try {
		// 构建视频URL
		const videoUrl = `https://www.bilibili.com/video/${archive.bvid}`;

		// 获取视频数据
		const html = await fetchVideoHtml(videoUrl);
		const videoData = extractVideoDataFromHtml(html, archive.bvid);

		if (!videoData) {
			return { success: false, title: archive.title };
		}

		// 下载音频到合集文件夹
		const downloaded = await downloadAudioToFolder(
			videoData.audioArr,
			videoData.videoInfo,
			seasonFolder
		);

		return { success: downloaded, title: videoData.videoInfo.title };

	} catch (error: any) {
		return { success: false, title: archive.title };
	}
}

// ==================== 合集下载（并发版本） ====================
async function downloadSeasonArchives(archives: SeasonArchive[], meta: SeasonMeta): Promise<boolean> {
	try {
		log(chalk.green(`\n=== Starting download: ${meta.title} ===`));
		log(chalk.green(`Total videos: ${archives.length}`));
		log(chalk.cyan(`Concurrency: ${config.concurrency} simultaneous downloads\n`));

		// 创建合集文件夹
		const seasonFolderName = sanitizeFilename(meta.title);
		const seasonFolder = path.join(config.downloadDir, seasonFolderName);

		if (!fs.existsSync(seasonFolder)) {
			fs.mkdirSync(seasonFolder, { recursive: true });
			log(chalk.blue(`Created folder: ${seasonFolderName}\n`));
		}

		// 创建进度条
		const progressBar = new cliProgress.SingleBar({
			format: chalk.cyan('{bar}') + ' | {percentage}% | {value}/{total} | Current: {current}',
			barCompleteChar: '\u2588',
			barIncompleteChar: '\u2591',
			hideCursor: true
		});

		progressBar.start(archives.length, 0, {
			current: 'Initializing...'
		});

		// 并发控制
		const limit = pLimit(config.concurrency);
		let completed = 0;
		let successCount = 0;

		// 创建所有下载任务
		const tasks = archives.map((archive, index) =>
			limit(async () => {
				// 更新进度条显示当前下载
				progressBar.update(completed, {
					current: chalk.yellow(archive.title.substring(0, 40) + '...')
				});

				// 下载
				const result = await downloadSingleArchive(archive, seasonFolder, index + 1, archives.length);

				// 更新计数
				completed++;
				if (result.success) {
					successCount++;
				}

				// 更新进度条
				progressBar.update(completed, {
					current: result.success
						? chalk.green(`✓ ${result.title.substring(0, 40)}`)
						: chalk.red(`✗ ${result.title.substring(0, 40)}`)
				});

				return result;
			})
		);

		// 等待所有任务完成
		const results = await Promise.all(tasks);

		// 停止进度条
		progressBar.stop();

		// 显示结果
		log(chalk.green(`\n✅ Download complete: ${successCount}/${archives.length} successful`));

		// 显示失败的
		const failed = results.filter(r => !r.success);
		if (failed.length > 0) {
			log(chalk.red(`\n❌ Failed (${failed.length}):`));
			failed.forEach(f => log(chalk.gray(`  - ${f.title}`)));
		}

		return successCount > 0;

	} catch (error: any) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		log(chalk.red('Error during season download:', errorMsg));
		return false;
	}
}

async function downloadSeason(url: string, rl: readline.Interface): Promise<boolean> {
	try {
		// 提取 season_id
		const seasonId = extractSeasonId(url);
		if (!seasonId) {
			log(chalk.red('Failed to extract season ID from URL'));
			return false;
		}

		// 获取整个合集的所有视频
		const result = await fetchAllSeasonArchives(seasonId);
		if (!result) {
			return false;
		}

		const { archives, meta } = result;

		// 显示菜单让用户选择
		while (true) {
			const choice = await showSeasonMenu(archives, meta, rl);

			if (choice === 'cancel') {
				log(chalk.yellow('\nCancelled.\n'));
				return false;
			}

			if (choice === 'preview') {
				await previewSeasonArchives(archives, meta, rl);
				// 预览完后继续显示菜单
				continue;
			}

			if (choice === 'download') {
				return await downloadSeasonArchives(archives, meta);
			}
		}

	} catch (error: any) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		log(chalk.red('Error during season download:', errorMsg));
		return false;
	}
}

// ==================== CLI ====================
async function cli(rl: readline.Interface): Promise<void> {
	return new Promise((resolve) => {
		rl.question('Enter the video/collection URL (or q/quit to exit): ', async (url) => {
			const trimmed = url.trim().toLowerCase();

			if (trimmed === 'q' || trimmed === 'quit') {
				log(chalk.green('Bye!'));
				rl.close();
				process.exit(0);
				return;
			}

			if (!url.includes('bilibili') && !url.includes('bv')) {
				log(chalk.yellow('Invalid URL, please try again.\n'));
				resolve();
				return;
			}

			try {
				let success = false;
				// 判断是否为合集URL
				if (url.includes('seasons_archives_list') || url.includes('/lists/')) {
					// 合集URL (API格式或用户空间格式)
					success = await downloadSeason(url, rl);
				} else if (url.includes('bilibili.com/video/') || url.includes('BV')) {
					// 单个视频URL
					success = await downloadSingleVideo(url);
				} else {
					log(chalk.yellow('Unknown URL format. Please provide a valid Bilibili video or season URL.\n'));
					resolve();
					return;
				}

				if (success) {
					log(chalk.green('\n✅ Done! Enter another URL or q to quit.\n'));
				} else {
					log(chalk.yellow('\n⚠️ Download failed. Please try again.\n'));
				}
			} catch (error: any) {
				const errorMsg = error instanceof Error ? error.message : String(error);
				log(chalk.red('Error during processing:', errorMsg));
				log(chalk.yellow('Please try again.\n'));
			}

			resolve();
		});
	});
}

// ==================== 主程序 ====================
const welcomeMessage = () => console.log(`
╔══════════════════════════════════════╗
║ ♡  Welcome to BiliAudio Downloader ♡ ║
║          ~ Let's start!              ║
╚══════════════════════════════════════╝
`);

async function main() {
	welcomeMessage();

	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	// 加载或设置 cookies
	const hasCookie = loadCookies();
	if (!hasCookie) {
		await setupCookie(rl);
	}

	// 主循环
	while (true) {
		await cli(rl);
	}
}

main().catch((error: any) => {
	log(chalk.red('Fatal error:', error));
	process.exit(1);
});