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


console.log('Downloader module loaded');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
})



let cookies = "buvid4=C423C8AD-EF49-BC28-6A6E-33372674F50709892-024062613-SR8SF7x5RpCnI6TCDNls8g%3D%3D; buvid_fp_plain=undefined; enable_web_push=DISABLE; DedeUserID=11261913; DedeUserID__ckMd5=4c0a6ef27f979261; PVID=4; enable_feed_channel=ENABLE; _uuid=51B103782-4595-196A-510CC-FC339D99EE3228201infoc; header_theme_version=OPEN; theme-tip-show=SHOWED; theme-avatar-tip-show=SHOWED; theme-switch-show=SHOWED; go-old-space=1; buvid3=27BA2B4D-61FB-A14B-128E-F1014127D897546748infoc; b_nut=1753994746; rpdid=|(u)|mYlJR)~0J'u~lRl)kk~J; CURRENT_QUALITY=80; bili_jct=d5255bd10d2e82fb17992ae6edb361a9; bili_ticket=eyJhbGciOiJIUzI1NiIsImtpZCI6InMwMyIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjE0ODg3NzgsImlhdCI6MTc2MTIyOTUxOCwicGx0IjotMX0.EIJrJuS5usIDCOPeuFMpNTVsHN3zaGn7TVedli6aPhY; bili_ticket_expires=1761488718; fingerprint=5d4be25d324a322108018cac394b6c0c; buvid_fp=5d4be25d324a322108018cac394b6c0c; sid=73zjdyl3; CURRENT_FNVAL=4048; bp_t_offset_11261913=1126982251486117888; home_feed_column=5; browser_resolution=1402-727; b_lsid=AA10771F10_19A11C9DA2A"
let headers = {
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
	'cookie': cookies
}

let audioArr = []
let videoArr = []
let dolby = []

//create downloads directory if not exists
const log = console.log;
const downloadDir = path.join(__dirname, "downloads");
if (!fs.existsSync(downloadDir)) {
	{
		fs.mkdirSync(downloadDir);
	}
}

function cli() {
	try {
		rl.question('Enter the video URL (or q/quit to exit): ', async (url) => {
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



async function getBVHtml(url: string) {
	//1. url is a simple video url

	const response = await axios.get(url, {
		headers: headers
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
	const response = await axios.get(url, {
		headers: headers
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
		const filePath = path.join(downloadDir, 'playinfo.json');

		audioArr = playinfoJson.data.dash.audio;
		videoArr = playinfoJson.data.dash.video;
		dolby = playinfoJson.data.dash.dolby;
		videoInfo.title = html.match(/<title[^>]*>([^<]+)<\/title>/)[1].trim();
		videoInfo.author = html.match(/<meta[^>]*name="author"[^>]*content="([^"]*)"/)[1];
		videoInfo.description = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/)[1];

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
				headers: headers,
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

			fs.writeFileSync(path.join(downloadDir, `${videoInfo.title}.flac`), Buffer.from(res.data))
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
	cli();

}

main();
extractBVID('https://www.bilibili.com/video/BV18nxfzPESy/')