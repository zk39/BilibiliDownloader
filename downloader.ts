
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as stream from 'stream';
import { promisify } from 'util';
import * as readline from 'readline';

console.log('Downloader module loaded');
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
})

// curl 'https://www.bilibili.com/video/BV1yyN1eMEgj/?spm_id_from=333.337.search-card.all.click&vd_source=020f49bde169054c895cbefa73c9d6ca' \
//   -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7' \
//   -H 'accept-language: zh-CN,zh;q=0.9,en;q=0.8' \
//   -H 'cache-control: no-cache' \
//   -b $'testcookie=1; buvid4=C423C8AD-EF49-BC28-6A6E-33372674F50709892-024062613-SR8SF7x5RpCnI6TCDNls8g%3D%3D; buvid_fp_plain=undefined; enable_web_push=DISABLE; DedeUserID=11261913; DedeUserID__ckMd5=4c0a6ef27f979261; PVID=4; enable_feed_channel=ENABLE; _uuid=51B103782-4595-196A-510CC-FC339D99EE3228201infoc; header_theme_version=OPEN; theme-tip-show=SHOWED; theme-avatar-tip-show=SHOWED; theme-switch-show=SHOWED; go-old-space=1; buvid3=27BA2B4D-61FB-A14B-128E-F1014127D897546748infoc; b_nut=1753994746; rpdid=|(u)|mYlJR)~0J\'u~lRl)kk~J; CURRENT_QUALITY=80; fingerprint=20377a6f592a25efc50b26acf0ec1fdd; buvid_fp=20377a6f592a25efc50b26acf0ec1fdd; bmg_af_switch=1; bmg_src_def_domain=i0.hdslb.com; SESSDATA=229771db%2C1774705383%2C7b3fb%2A91CjASvd8LYSu-NZONuGHK1twrzgJfD-P1450C7HL-qbp3zPrZPwJEhOYRlvKBc-FwOJ4SVmpUSDJlYXdXclh0MmZmWHFLX0tvRXpXZHUxNHBIenVOZWFXUTBzQzNRVlpzdlFGTENyZENmR2dKNFpMbmt1bTZIYllacTZZV3RyQV84WWFXb0txWFVRIIEC; bili_jct=c1e81537b356e50a51976abd3e9f9e02; sid=8fvslthu; home_feed_column=5; browser_resolution=1592-732; CURRENT_FNVAL=4048; bsource=search_google; bili_ticket=eyJhbGciOiJIUzI1NiIsImtpZCI6InMwMyIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTk0MjMzNDUsImlhdCI6MTc1OTE2NDA4NSwicGx0IjotMX0.H7pDUhOuEPxQEvcI2KsVRwCjs_haCzDaeH_lgUu5bg4; bili_ticket_expires=1759423285; bp_t_offset_11261913=1118091235391700992; b_lsid=7717C5A8_19996AFA49B' \
//   -H 'pragma: no-cache' \
//   -H 'priority: u=0, i' \
//   -H 'referer: https://search.bilibili.com/video?keyword=%E9%80%86%E5%90%91b%E7%AB%99%E8%A7%86%E9%A2%91playurl&from_source=webtop_search&spm_id_from=333.1007&search_source=5' \
//   -H 'sec-ch-ua: "Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"' \
//   -H 'sec-ch-ua-mobile: ?0' \
//   -H 'sec-ch-ua-platform: "Windows"' \
//   -H 'sec-fetch-dest: document' \
//   -H 'sec-fetch-mode: navigate' \
//   -H 'sec-fetch-site: same-origin' \
//   -H 'sec-fetch-user: ?1' \
//   -H 'upgrade-insecure-requests: 1' \
//   -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'

function askUrl() {
	rl.question('Enter the video URL (or q/quit to exit): ', async (url) => {
		//trim user input

		const trimmed = url.trim().toLowerCase();
		if (trimmed === 'q' || trimmed === 'quit') {
			console.log('Bye!');
			rl.close();
			return;
		}
		if (url.includes('bilibili') || url.includes('b23.tv')) {
			console.log('Bilibili downloader is not implemented yet.');
			rl.close();
			return;
		}
		console.log('Invalid plz reEnter');
		askUrl();
	});
}


//askUrl();
async function getVideo() {

	const response = await axios.get('https://www.bilibili.com/video/BV1yyN1eMEgj/', {
		params: {
			'spm_id_from': '333.337.search-card.all.click',
			'vd_source': '020f49bde169054c895cbefa73c9d6ca'
		},
		headers: {
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
			'cookie': "testcookie=1; buvid4=C423C8AD-EF49-BC28-6A6E-33372674F50709892-024062613-SR8SF7x5RpCnI6TCDNls8g%3D%3D; buvid_fp_plain=undefined; enable_web_push=DISABLE; DedeUserID=11261913; DedeUserID__ckMd5=4c0a6ef27f979261; PVID=4; enable_feed_channel=ENABLE; _uuid=51B103782-4595-196A-510CC-FC339D99EE3228201infoc; header_theme_version=OPEN; theme-tip-show=SHOWED; theme-avatar-tip-show=SHOWED; theme-switch-show=SHOWED; go-old-space=1; buvid3=27BA2B4D-61FB-A14B-128E-F1014127D897546748infoc; b_nut=1753994746; rpdid=|(u)|mYlJR)~0J'u~lRl)kk~J; CURRENT_QUALITY=80; fingerprint=20377a6f592a25efc50b26acf0ec1fdd; buvid_fp=20377a6f592a25efc50b26acf0ec1fdd; bmg_af_switch=1; bmg_src_def_domain=i0.hdslb.com; SESSDATA=229771db%2C1774705383%2C7b3fb%2A91CjASvd8LYSu-NZONuGHK1twrzgJfD-P1450C7HL-qbp3zPrZPwJEhOYRlvKBc-FwOJ4SVmpUSDJlYXdXclh0MmZmWHFLX0tvRXpXZHUxNHBIenVOZWFXUTBzQzNRVlpzdlFGTENyZENmR2dKNFpMbmt1bTZIYllacTZZV3RyQV84WWFXb0txWFVRIIEC; bili_jct=c1e81537b356e50a51976abd3e9f9e02; sid=8fvslthu; home_feed_column=5; browser_resolution=1592-732; CURRENT_FNVAL=4048; bsource=search_google; bili_ticket=eyJhbGciOiJIUzI1NiIsImtpZCI6InMwMyIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTk0MjMzNDUsImlhdCI6MTc1OTE2NDA4NSwicGx0IjotMX0.H7pDUhOuEPxQEvcI2KsVRwCjs_haCzDaeH_lgUu5bg4; bili_ticket_expires=1759423285; bp_t_offset_11261913=1118091235391700992; b_lsid=7717C5A8_19996AFA49B"
		}
	});

	console.log(response.data);
	fs.writeFileSync('./test.html', response.data, 'utf-8');
	console.log('HTML 已保存到 test.html');
}
// Bilibili downloader
await getVideo()