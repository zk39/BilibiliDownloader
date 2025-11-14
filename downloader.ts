
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';


import * as readline from 'readline';
import * as chalk from 'chalk';


interface VideoInfo {
	title: string;
	author: string;
	description: string;
	uploadDate: string;
	bvid: string;
}
// Initialize videoInfo with empty strings
let videoInfo: VideoInfo = {
	title: '',
	author: '',
	description: '',
	uploadDate: '',
	bvid: ''
};

const log = console.log;
log('Downloader module loaded');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
})



// ==================== Config ====================
const config = {

	//create downloads directory if not exists
	downloadDir: path.join(__dirname, "downloads"),
	cookieFile: path.join(__dirname, 'cookies.txt'),
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
}

let audioArr = []
let videoArr = []
let dolby = []

if (!fs.existsSync(config.downloadDir)) {
	{
		fs.mkdirSync(config.downloadDir);
	}
}
// ==================== Functions ====================
function cli() {
	try {
		rl.question('Enter the video/collection URL (or q/quit to exit): ', async (url) => {
			const trimmed = url.trim().toLowerCase();
			if (trimmed === 'q' || trimmed === 'quit') {
				log(chalk.green('Bye!'));
				cleanup();
				process.exit(0);
				return;
			}

			if (url.includes('bilibili') || url.includes('bv')) {
				try {
					videoInfo.bvid = extractBVID(url);
					log(chalk.blue(`Extracted BVID: ${videoInfo.bvid}`));
					await getBVHtml(url);

					await downloadAudio();
					console.log('Done! Enter another URL or q to quit.\n');
					cleanup();
					return cli();
				} catch (error) {
					console.error(' Error during processing:', error);
					log('Please try again.\n');
					return cli();
				}
			}
			cleanup();
			console.log('Invalid input, please re-enter.');
			return cli();
		});
	} catch (error) {
		console.error('⚠️ Error:', error);
		log('Please try again.\n');
		return cli();
	}

}

//==================== Manage cookies ====================

function loadCookies(): boolean {
	try {
		// if yes, load cookies from file
		if (fs.existsSync(config.cookieFile)) {
			const cookie = fs.readFileSync(config.cookieFile, 'utf-8').trim();
			if (cookie) {
				log(chalk.green('Cookies loaded from file.'));
				config.headers.cookie = cookie;
				return true;
			}
		}
	} catch (error) {
		log(chalk.red('No cookies file found, proceeding without cookies.'));
		return false;
	}
}

function setupCookie() {
	log(chalk.yellow('No cookies found. Please enter your Bilibili cookies to proceed.'));
	log(chalk.gray('(You can get it from browser DevTools -> Application -> Cookies)\n'));
	rl.question('Enter your cookies: ', (inputCookie) => {
		if (!inputCookie.trim()) {
			log(chalk.red('Cookie cannot be empty!'));
			promptRetry();
			return;
		}
		if (inputCookie.trim()) {

			if (!validateCookie(inputCookie)) {
				promptRetry();
				return
			}
			config.headers.cookie = inputCookie.trim();
			//save cookies to file
			fs.writeFileSync(config.cookieFile, inputCookie.trim(), 'utf-8');
			log(chalk.green('Cookies saved successfully.\n'));
			cli();
		}
	})
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

	return true
}

function promptRetry() {
	rl.question('Do you want to re-enter cookies? (y/n): ', (answer) => {
		const trimmed = answer.trim().toLowerCase();
		if (trimmed === 'y' || trimmed === 'yes') {
			setupCookie();
		} else {
			log(chalk.red('Cannot proceed without valid cookies. Exiting.'));
			cleanup();
			process.exit(1);
		}
	})
}

//==================== Download Module ====================
async function getBVHtml(url: string) {
	//1. url is a simple video url

	const response = await axios.get(url, {
		headers: config.headers
	});
	//console.log(response.data);
	extractJsonFromHtml(response.data);
	//fs.writeFileSync(path.join(downloadDir, 'test.html'), response.data, 'utf-8');
}

async function getSeasonHtml(url: string) {
	//2. url is a season url
	// url example: 
	// https://api.bilibili.com/x/polymer/web-space/seasons_archives_list?season_id=2209693&page_num=2&page_size=100
	// @season_id,page_size,page_num are required parameters
	const seasonBaseUrl = ' https://api.bilibili.com/x/polymer/web-space/seasons_archives_list?'
	const fetchUrl = `${seasonBaseUrl}season_id=SEASON_ID&page_num=PAGE_NUM&page_size=PAGE_SIZE`;
	const response = await axios.get(url, {
		headers: config.headers
	});
	//console.log(response.data);
}

function extractBVID(url: string): string {
	const bvidMatch = url.match(/BV[0-9A-Za-z]+/);
	if (bvidMatch) {
		return bvidMatch[0];
	}
}
function extractJsonFromHtml(html: string): any | null {
	const regrex = /window\.__playinfo__\s*=\s*(\{.*?\})\s*<\/script>/;
	const match = html.match(regrex);
	if (match && match[1]) {
		const playinfoJson = JSON.parse(match[1]);
		//using filter for audioarr and videoarr
		const filePath = path.join(config.downloadDir, 'playinfo.json');

		audioArr = playinfoJson.data.dash.audio;
		videoArr = playinfoJson.data.dash.video;
		dolby = playinfoJson.data.dash.dolby;
		videoInfo.title = html.match(/<title[^>]*>([^<]+)<\/title>/)[1].trim();
		videoInfo.author = html.match(/<meta[^>]*name="author"[^>]*content="([^"]*)"/)[1];
		videoInfo.description = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/)[1].replace(/\s*[，,]\s*相关视频[:：]?\s*.*$/, '').trim();
		log(chalk.green(`Video Title: ${videoInfo.title}`));
		log(chalk.green(`Author: ${videoInfo.author}`));
		log(chalk.green(`BVID: ${videoInfo.bvid}`));
		log(chalk.green(`Description: ${videoInfo.description}`));
		fs.writeFileSync('./playinfo.json', JSON.stringify({
			audioArr,
			videoArr,
			dolby
		}, null, 4), 'utf-8');

	}

}

async function downloadAudio() {

	const len = audioArr.length;
	if (audioArr.length === 0) {
		log(chalk.red('No audio streams found to download.'));
		return;
	}
	if (audioArr.length >= 1) {
		log(chalk.yellow(`Multiple audio streams found (${len}). Downloading the highest quality one.`));

		// use sort to get the highest quality audio at this time
		audioArr.sort((a, b) => b.bandwidth - a.bandwidth);
		const bestAudio = audioArr[0];
		const urlsToDownload = [bestAudio.baseUrl, bestAudio.base_url, ...bestAudio.backupUrl, ...bestAudio.backup_url];
		for (const url of urlsToDownload) {
			if (!url) continue;
			log(chalk.blue(`Downloading audio from URL: ${url}`));

			const res = await axios.get(url, {
				headers: config.headers,
				responseType: 'arraybuffer',

			});

			if (res.status != 200) {
				log(chalk.yellow(`Warning: Received status code ${res.status} when trying to download audio.\nTries next URL...`));
				continue;
			}
			if (!res.data || res.data.byteLength === 0) {
				log(chalk.yellow('Warning: Empty response data. Trying next URL...'));
				continue;
			}

			fs.writeFileSync(path.join(config.downloadDir, `${videoInfo.title}.flac`), Buffer.from(res.data))
			console.log('✅ finished');
			return;
		}




	}
}

function cleanup() {
	if (!rl.close) {
		rl.close();
	}
}
// welcome message
const welcomeMessage = () => console.log(`
╔══════════════════════════════════════╗
║ ♡  Welcome to Bilibili Downloader ♡  ║
║          ~ Let's start!              ║
╚══════════════════════════════════════╝
`);
// Bilibili downloader
async function main() {
	//welcomeMessage();

	//load cookies from file
	const hasCookie = loadCookies();
	if (!hasCookie) {
		setupCookie()
	}
	else {
		cli();
	}


}

main();
extractBVID('https://www.bilibili.com/video/BV18nxfzPESy/')