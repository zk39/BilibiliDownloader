
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as stream from 'stream';
import { promisify } from 'util';
import * as readline from 'readline';
import * as chalk from 'chalk';

console.log('Downloader module loaded');
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
})



let cookies = "testcookie=1; buvid4=C423C8AD-EF49-BC28-6A6E-33372674F50709892-024062613-SR8SF7x5RpCnI6TCDNls8g%3D%3D; buvid_fp_plain=undefined; enable_web_push=DISABLE; DedeUserID=11261913; DedeUserID__ckMd5=4c0a6ef27f979261; PVID=4; enable_feed_channel=ENABLE; _uuid=51B103782-4595-196A-510CC-FC339D99EE3228201infoc; header_theme_version=OPEN; theme-tip-show=SHOWED; theme-avatar-tip-show=SHOWED; theme-switch-show=SHOWED; go-old-space=1; buvid3=27BA2B4D-61FB-A14B-128E-F1014127D897546748infoc; b_nut=1753994746; rpdid=|(u)|mYlJR)~0J'u~lRl)kk~J; CURRENT_QUALITY=80; fingerprint=20377a6f592a25efc50b26acf0ec1fdd; buvid_fp=20377a6f592a25efc50b26acf0ec1fdd; bmg_af_switch=1; bmg_src_def_domain=i0.hdslb.com; SESSDATA=229771db%2C1774705383%2C7b3fb%2A91CjASvd8LYSu-NZONuGHK1twrzgJfD-P1450C7HL-qbp3zPrZPwJEhOYRlvKBc-FwOJ4SVmpUSDJlYXdXclh0MmZmWHFLX0tvRXpXZHUxNHBIenVOZWFXUTBzQzNRVlpzdlFGTENyZENmR2dKNFpMbmt1bTZIYllacTZZV3RyQV84WWFXb0txWFVRIIEC; bili_jct=c1e81537b356e50a51976abd3e9f9e02; sid=8fvslthu; home_feed_column=5; browser_resolution=1592-732; CURRENT_FNVAL=4048; bsource=search_google; bili_ticket=eyJhbGciOiJIUzI1NiIsImtpZCI6InMwMyIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTk0MjMzNDUsImlhdCI6MTc1OTE2NDA4NSwicGx0IjotMX0.H7pDUhOuEPxQEvcI2KsVRwCjs_haCzDaeH_lgUu5bg4; bili_ticket_expires=1759423285; bp_t_offset_11261913=1118091235391700992; b_lsid=7717C5A8_19996AFA49B"
let headers = {
	'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
	'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
	'cache-control': 'no-cache',
	'pragma': 'no-cache',
	'priority': 'u=0, i',
	'referer': 'https://search.bilibili.com/video?keyword=%E9%80%86%E5%90%91b%E7%AB%99%E8%A7%86%E9%A2%91playurl&from_source=webtop_search&spm_id_from=333.1007&search_source=5',
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


const log = console.log;
function cli() {

	try {
		rl.question('Enter the video URL (or q/quit to exit): ', async (url) => {
			const trimmed = url.trim().toLowerCase();
			if (trimmed === 'q' || trimmed === 'quit') {
				log(chalk.green('Bye!'));
				rl.close();
				return;
			}
			if (trimmed === '' || trimmed === 'enter') {
				await getHtml();
				await readHtml();
				await downloadAudio();
				console.log('✅ Done! Enter another URL or q to quit.\n');
				return cli();
			}
			if (url.includes('bilibili') || url.includes('b23.tv')) {
				console.log('Bilibili downloader is not implemented yet.');

				return cli();
			}
			console.log('Invalid input, please re-enter.');
			return cli();
		});
	} catch (error) {
		console.error('⚠️ Error:', error);
		log('Please try again.\n');
		return cli();
	}

}
// read html file,extract json data and assign to audioArr and videoArr
async function readHtml() {
	const filePath = path.join(__dirname, 'test.html');
	const html = fs.readFileSync(filePath, 'utf-8');
	//console.log(html);
	extractJsonFromHtml(html);
}


async function getHtml() {
	const response = await axios.get('https://www.bilibili.com/video/BV18nxfzPESy/', {

		headers: headers
	});
	//console.log(response.data);
	fs.writeFileSync('./test.html', response.data, 'utf-8');
}

function extractJsonFromHtml(html: string): any | null {
	const regrex = /window\.__playinfo__\s*=\s*(\{.*?\})\s*<\/script>/;
	const match = html.match(regrex);
	if (match && match[1]) {
		const playinfoJson = JSON.parse(match[1]);
		//using filter for audioarr and videoarr
		const filePath = path.join(__dirname, 'playinfo.json');

		audioArr = playinfoJson.data.dash.audio;
		videoArr = playinfoJson.data.dash.video;
		dolby = playinfoJson.data.dash.dolby;

		fs.writeFileSync('./playinfo.json', JSON.stringify({ audioArr, videoArr, dolby }, null, 4), 'utf-8');

	}

}

async function downloadAudio() {
	const len = audioArr.length;
	if (audioArr.length === 0) {
		log(chalk.red('No audio streams found to download.'));
		return;
	}
	if (audioArr.length > 1) {
		log(chalk.yellow(`Multiple audio streams found (${len}). Downloading the highest quality one.`));
		// log(chalk.blue(`Audio stream details: ${JSON.stringify(audioArr, null, 4)}`));
		// use sort to get the highest quality audio at this time
		audioArr.sort((a, b) => b.bandwidth - a.bandwidth);
		const bestAudio = audioArr[0];
		const urlsToDownload = [bestAudio.baseUrl, bestAudio.base_url, ...bestAudio.backupUrl, ...bestAudio.backup_url];
		for (const url of urlsToDownload) {
			if (url) {
				log(chalk.blue(`Downloading audio from URL: ${url}`));
				const writer = fs.createWriteStream(path.join(__dirname, `audio_test.m4a`));
				const res = await axios.get(url, {

					headers: headers,
					responseType: 'stream'
				});
				await new Promise((resolve, reject) => {
					res.data.pipe(writer);
					writer.on('finish', () => {

						resolve(null);

					});
					writer.on('error', reject);

				})
				console.log('✅ finished');
				break;
			}
		}

	}
}
// welcome message
const welcomeMessage = () => console.log(`
╔══════════════════════════════════════╗
║     ♡  Welcome to B站 Downloader ♡   ║
║          喵~ Let's start! 🐾         ║
╚══════════════════════════════════════╝
`);
// Bilibili downloader
async function main() {
	//welcomeMessage();
	cli();

}

main();

