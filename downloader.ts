
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
let audioArr = []
let videoArr = []

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

// read html file,extract json data and assign to audioArr and videoArr
async function readHtml() {
	const filePath = path.join(__dirname, 'test.html');
	const html = fs.readFileSync(filePath, 'utf-8');
	//console.log(html);
	const regrex = /window\.__playinfo__\s*=\s*(\{.*?\})\s*<\/script>/;
	const match = html.match(regrex);

	// "audio": [{
	// 				"id": 30280,
	// 				"baseUrl": "https://upos-hz-mirrorakam.akamaized.net/upgcxcode/15/84/28290908415/28290908415-1-30280.m4s?e=ig8euxZM2rNcNbdlhoNvNC8BqJIzNbfqXBvEqxTEto8BTrNvN0GvT90W5JZMkX_YN0MvXg8gNEV4NC8xNEV4N03eN0B5tZlqNxTEto8BTrNvNeZVuJ10Kj_g2UB02J0mN0B5tZlqNCNEto8BTrNvNC7MTX502C8f2jmMQJ6mqF2fka1mqx6gqj0eN0B599M=&uipk=5&oi=69686678&platform=pc&trid=71d7d8d0f74d4d55944b5e7619322deu&mid=11261913&og=cos&deadline=1759256786&nbs=1&gen=playurlv3&os=akam&upsig=0e98b88819fb2378a861780355883814&uparams=e,uipk,oi,platform,trid,mid,og,deadline,nbs,gen,os&hdnts=exp=1759256786~hmac=d319e317b1c02e27103e8e78757a219da1a78c0cbb2570b77d65969b5172a4d0&bvc=vod&nettype=0&bw=112202&buvid=27BA2B4D-61FB-A14B-128E-F1014127D897546748infoc&build=0&dl=0&f=u_0_0&agrr=0&orderid=0,2",
	// 				"base_url": "https://upos-hz-mirrorakam.akamaized.net/upgcxcode/15/84/28290908415/28290908415-1-30280.m4s?e=ig8euxZM2rNcNbdlhoNvNC8BqJIzNbfqXBvEqxTEto8BTrNvN0GvT90W5JZMkX_YN0MvXg8gNEV4NC8xNEV4N03eN0B5tZlqNxTEto8BTrNvNeZVuJ10Kj_g2UB02J0mN0B5tZlqNCNEto8BTrNvNC7MTX502C8f2jmMQJ6mqF2fka1mqx6gqj0eN0B599M=&uipk=5&oi=69686678&platform=pc&trid=71d7d8d0f74d4d55944b5e7619322deu&mid=11261913&og=cos&deadline=1759256786&nbs=1&gen=playurlv3&os=akam&upsig=0e98b88819fb2378a861780355883814&uparams=e,uipk,oi,platform,trid,mid,og,deadline,nbs,gen,os&hdnts=exp=1759256786~hmac=d319e317b1c02e27103e8e78757a219da1a78c0cbb2570b77d65969b5172a4d0&bvc=vod&nettype=0&bw=112202&buvid=27BA2B4D-61FB-A14B-128E-F1014127D897546748infoc&build=0&dl=0&f=u_0_0&agrr=0&orderid=0,2",
	// 				"backupUrl": [
	// 					"https://upos-sz-mirrorcosov.bilivideo.com/upgcxcode/15/84/28290908415/28290908415-1-30280.m4s?e=ig8euxZM2rNcNbdlhoNvNC8BqJIzNbfqXBvEqxTEto8BTrNvN0GvT90W5JZMkX_YN0MvXg8gNEV4NC8xNEV4N03eN0B5tZlqNxTEto8BTrNvNeZVuJ10Kj_g2UB02J0mN0B5tZlqNCNEto8BTrNvNC7MTX502C8f2jmMQJ6mqF2fka1mqx6gqj0eN0B599M=&nbs=1&uipk=5&platform=pc&trid=71d7d8d0f74d4d55944b5e7619322deu&mid=11261913&deadline=1759256786&gen=playurlv3&os=cosovbv&oi=69686678&og=cos&upsig=485e94f36baa93069c2967ba5832c6c3&uparams=e,nbs,uipk,platform,trid,mid,deadline,gen,os,oi,og&bvc=vod&nettype=0&bw=112202&agrr=0&buvid=27BA2B4D-61FB-A14B-128E-F1014127D897546748infoc&build=0&dl=0&f=u_0_0&orderid=1,2"
	// 				],
	// 				"backup_url": [
	// 					"https://upos-sz-mirrorcosov.bilivideo.com/upgcxcode/15/84/28290908415/28290908415-1-30280.m4s?e=ig8euxZM2rNcNbdlhoNvNC8BqJIzNbfqXBvEqxTEto8BTrNvN0GvT90W5JZMkX_YN0MvXg8gNEV4NC8xNEV4N03eN0B5tZlqNxTEto8BTrNvNeZVuJ10Kj_g2UB02J0mN0B5tZlqNCNEto8BTrNvNC7MTX502C8f2jmMQJ6mqF2fka1mqx6gqj0eN0B599M=&nbs=1&uipk=5&platform=pc&trid=71d7d8d0f74d4d55944b5e7619322deu&mid=11261913&deadline=1759256786&gen=playurlv3&os=cosovbv&oi=69686678&og=cos&upsig=485e94f36baa93069c2967ba5832c6c3&uparams=e,nbs,uipk,platform,trid,mid,deadline,gen,os,oi,og&bvc=vod&nettype=0&bw=112202&agrr=0&buvid=27BA2B4D-61FB-A14B-128E-F1014127D897546748infoc&build=0&dl=0&f=u_0_0&orderid=1,2"
	// 				],
	// 				"bandwidth": 112166,
	// 				"mimeType": "audio/mp4",
	// 				"mime_type": "audio/mp4",
	// 				"codecs": "mp4a.40.2",
	// 				"width": 0,
	// 				"height": 0,
	// 				"frameRate": "",
	// 				"frame_rate": "",
	// 				"sar": "",
	// 				"startWithSap": 0,
	// 				"start_with_sap": 0,
	// 				"SegmentBase": {
	// 					"Initialization": "0-817",
	// 					"indexRange": "818-4353"
	// 				},
	// 				"segment_base": {
	// 					"initialization": "0-817",
	// 					"index_range": "818-4353"
	// 				},
	// 				"codecid": 0
	// 			}, {
	// 				"id": 30232,
	// 				"baseUrl": "https://upos-hz-mirrorakam.akamaized.net/upgcxcode/15/84/28290908415/28290908415-1-30232.m4s?e=ig8euxZM2rNcNbdlhoNvNC8BqJIzNbfqXBvEqxTEto8BTrNvN0GvT90W5JZMkX_YN0MvXg8gNEV4NC8xNEV4N03eN0B5tZlqNxTEto8BTrNvNeZVuJ10Kj_g2UB02J0mN0B5tZlqNCNEto8BTrNvNC7MTX502C8f2jmMQJ6mqF2fka1mqx6gqj0eN0B599M=&nbs=1&oi=69686678&platform=pc&deadline=1759256786&gen=playurlv3&os=akam&og=hw&uipk=5&trid=71d7d8d0f74d4d55944b5e7619322deu&mid=11261913&upsig=50b9f743f452f3559f4f330cf99a73c1&uparams=e,nbs,oi,platform,deadline,gen,os,og,uipk,trid,mid&hdnts=exp=1759256786~hmac=2b38775bc2d246942c0d8cc0f220aaa35edda6c715b65bd3bd59b0c72f84531b&bvc=vod&nettype=0&bw=63031&agrr=0&buvid=27BA2B4D-61FB-A14B-128E-F1014127D897546748infoc&build=0&dl=0&f=u_0_0&orderid=0,2",
	// 				"base_url": "https://upos-hz-mirrorakam.akamaized.net/upgcxcode/15/84/28290908415/28290908415-1-30232.m4s?e=ig8euxZM2rNcNbdlhoNvNC8BqJIzNbfqXBvEqxTEto8BTrNvN0GvT90W5JZMkX_YN0MvXg8gNEV4NC8xNEV4N03eN0B5tZlqNxTEto8BTrNvNeZVuJ10Kj_g2UB02J0mN0B5tZlqNCNEto8BTrNvNC7MTX502C8f2jmMQJ6mqF2fka1mqx6gqj0eN0B599M=&nbs=1&oi=69686678&platform=pc&deadline=1759256786&gen=playurlv3&os=akam&og=hw&uipk=5&trid=71d7d8d0f74d4d55944b5e7619322deu&mid=11261913&upsig=50b9f743f452f3559f4f330cf99a73c1&uparams=e,nbs,oi,platform,deadline,gen,os,og,uipk,trid,mid&hdnts=exp=1759256786~hmac=2b38775bc2d246942c0d8cc0f220aaa35edda6c715b65bd3bd59b0c72f84531b&bvc=vod&nettype=0&bw=63031&agrr=0&buvid=27BA2B4D-61FB-A14B-128E-F1014127D897546748infoc&build=0&dl=0&f=u_0_0&orderid=0,2",
	// 				"backupUrl": [
	// 					"https://upos-sz-mirrorcosov.bilivideo.com/upgcxcode/15/84/28290908415/28290908415-1-30232.m4s?e=ig8euxZM2rNcNbdlhoNvNC8BqJIzNbfqXBvEqxTEto8BTrNvN0GvT90W5JZMkX_YN0MvXg8gNEV4NC8xNEV4N03eN0B5tZlqNxTEto8BTrNvNeZVuJ10Kj_g2UB02J0mN0B5tZlqNCNEto8BTrNvNC7MTX502C8f2jmMQJ6mqF2fka1mqx6gqj0eN0B599M=&platform=pc&mid=11261913&nbs=1&oi=69686678&gen=playurlv3&og=hw&trid=71d7d8d0f74d4d55944b5e7619322deu&deadline=1759256786&uipk=5&os=cosovbv&upsig=42aa18d672e94805d8aa813b7c4a40dd&uparams=e,platform,mid,nbs,oi,gen,og,trid,deadline,uipk,os&bvc=vod&nettype=0&bw=63031&dl=0&f=u_0_0&agrr=0&buvid=27BA2B4D-61FB-A14B-128E-F1014127D897546748infoc&build=0&orderid=1,2"
	// 				],
	// 				"backup_url": [
	// 					"https://upos-sz-mirrorcosov.bilivideo.com/upgcxcode/15/84/28290908415/28290908415-1-30232.m4s?e=ig8euxZM2rNcNbdlhoNvNC8BqJIzNbfqXBvEqxTEto8BTrNvN0GvT90W5JZMkX_YN0MvXg8gNEV4NC8xNEV4N03eN0B5tZlqNxTEto8BTrNvNeZVuJ10Kj_g2UB02J0mN0B5tZlqNCNEto8BTrNvNC7MTX502C8f2jmMQJ6mqF2fka1mqx6gqj0eN0B599M=&platform=pc&mid=11261913&nbs=1&oi=69686678&gen=playurlv3&og=hw&trid=71d7d8d0f74d4d55944b5e7619322deu&deadline=1759256786&uipk=5&os=cosovbv&upsig=42aa18d672e94805d8aa813b7c4a40dd&uparams=e,platform,mid,nbs,oi,gen,og,trid,deadline,uipk,os&bvc=vod&nettype=0&bw=63031&dl=0&f=u_0_0&agrr=0&buvid=27BA2B4D-61FB-A14B-128E-F1014127D897546748infoc&build=0&orderid=1,2"
	// 				],
	// 				"bandwidth": 63000,
	// 				"mimeType": "audio/mp4",
	// 				"mime_type": "audio/mp4",
	// 				"codecs": "mp4a.40.2",
	// 				"width": 0,
	// 				"height": 0,
	// 				"frameRate": "",
	// 				"frame_rate": "",
	// 				"sar": "",
	// 				"startWithSap": 0,
	// 				"start_with_sap": 0,
	// 				"SegmentBase": {
	// 					"Initialization": "0-817",
	// 					"indexRange": "818-4353"
	// 				},
	// 				"segment_base": {
	// 					"initialization": "0-817",
	// 					"index_range": "818-4353"
	// 				},
	// 				"codecid": 0
	// 			}, {
	// 				"id": 30216,
	// 				"baseUrl": "https://upos-hz-mirrorakam.akamaized.net/upgcxcode/15/84/28290908415/28290908415-1-30216.m4s?e=ig8euxZM2rNcNbdlhoNvNC8BqJIzNbfqXBvEqxTEto8BTrNvN0GvT90W5JZMkX_YN0MvXg8gNEV4NC8xNEV4N03eN0B5tZlqNxTEto8BTrNvNeZVuJ10Kj_g2UB02J0mN0B5tZlqNCNEto8BTrNvNC7MTX502C8f2jmMQJ6mqF2fka1mqx6gqj0eN0B599M=&platform=pc&trid=71d7d8d0f74d4d55944b5e7619322deu&gen=playurlv3&og=hw&nbs=1&mid=11261913&deadline=1759256786&os=akam&uipk=5&oi=69686678&upsig=fdf8c7f1a6aa5fdcd21d70d24917da31&uparams=e,platform,trid,gen,og,nbs,mid,deadline,os,uipk,oi&hdnts=exp=1759256786~hmac=e44db015acce4df42326014a27d02426bef4a7feaaf24a0316a1f72cc7e3a478&bvc=vod&nettype=0&bw=30526&build=0&dl=0&f=u_0_0&agrr=0&buvid=27BA2B4D-61FB-A14B-128E-F1014127D897546748infoc&orderid=0,2",
	// 				"base_url": "https://upos-hz-mirrorakam.akamaized.net/upgcxcode/15/84/28290908415/28290908415-1-30216.m4s?e=ig8euxZM2rNcNbdlhoNvNC8BqJIzNbfqXBvEqxTEto8BTrNvN0GvT90W5JZMkX_YN0MvXg8gNEV4NC8xNEV4N03eN0B5tZlqNxTEto8BTrNvNeZVuJ10Kj_g2UB02J0mN0B5tZlqNCNEto8BTrNvNC7MTX502C8f2jmMQJ6mqF2fka1mqx6gqj0eN0B599M=&platform=pc&trid=71d7d8d0f74d4d55944b5e7619322deu&gen=playurlv3&og=hw&nbs=1&mid=11261913&deadline=1759256786&os=akam&uipk=5&oi=69686678&upsig=fdf8c7f1a6aa5fdcd21d70d24917da31&uparams=e,platform,trid,gen,og,nbs,mid,deadline,os,uipk,oi&hdnts=exp=1759256786~hmac=e44db015acce4df42326014a27d02426bef4a7feaaf24a0316a1f72cc7e3a478&bvc=vod&nettype=0&bw=30526&build=0&dl=0&f=u_0_0&agrr=0&buvid=27BA2B4D-61FB-A14B-128E-F1014127D897546748infoc&orderid=0,2",
	// 				"backupUrl": [
	// 					"https://upos-sz-mirrorcosov.bilivideo.com/upgcxcode/15/84/28290908415/28290908415-1-30216.m4s?e=ig8euxZM2rNcNbdlhoNvNC8BqJIzNbfqXBvEqxTEto8BTrNvN0GvT90W5JZMkX_YN0MvXg8gNEV4NC8xNEV4N03eN0B5tZlqNxTEto8BTrNvNeZVuJ10Kj_g2UB02J0mN0B5tZlqNCNEto8BTrNvNC7MTX502C8f2jmMQJ6mqF2fka1mqx6gqj0eN0B599M=&nbs=1&uipk=5&oi=69686678&platform=pc&mid=11261913&gen=playurlv3&os=cosovbv&og=hw&trid=71d7d8d0f74d4d55944b5e7619322deu&deadline=1759256786&upsig=d16b68ed73fc1da8186544c739b4f4f0&uparams=e,nbs,uipk,oi,platform,mid,gen,os,og,trid,deadline&bvc=vod&nettype=0&bw=30526&agrr=0&buvid=27BA2B4D-61FB-A14B-128E-F1014127D897546748infoc&build=0&dl=0&f=u_0_0&orderid=1,2"
	// 				],
	// 				"backup_url": [
	// 					"https://upos-sz-mirrorcosov.bilivideo.com/upgcxcode/15/84/28290908415/28290908415-1-30216.m4s?e=ig8euxZM2rNcNbdlhoNvNC8BqJIzNbfqXBvEqxTEto8BTrNvN0GvT90W5JZMkX_YN0MvXg8gNEV4NC8xNEV4N03eN0B5tZlqNxTEto8BTrNvNeZVuJ10Kj_g2UB02J0mN0B5tZlqNCNEto8BTrNvNC7MTX502C8f2jmMQJ6mqF2fka1mqx6gqj0eN0B599M=&nbs=1&uipk=5&oi=69686678&platform=pc&mid=11261913&gen=playurlv3&os=cosovbv&og=hw&trid=71d7d8d0f74d4d55944b5e7619322deu&deadline=1759256786&upsig=d16b68ed73fc1da8186544c739b4f4f0&uparams=e,nbs,uipk,oi,platform,mid,gen,os,og,trid,deadline&bvc=vod&nettype=0&bw=30526&agrr=0&buvid=27BA2B4D-61FB-A14B-128E-F1014127D897546748infoc&build=0&dl=0&f=u_0_0&orderid=1,2"
	// 				],
	// 				"bandwidth": 30498,
	// 				"mimeType": "audio/mp4",
	// 				"mime_type": "audio/mp4",
	// 				"codecs": "mp4a.40.5",
	// 				"width": 0,
	// 				"height": 0,
	// 				"frameRate": "",
	// 				"frame_rate": "",
	// 				"sar": "",
	// 				"startWithSap": 0,
	// 				"start_with_sap": 0,
	// 				"SegmentBase": {
	// 					"Initialization": "0-826",
	// 					"indexRange": "827-4362"
	// 				},
	// 				"segment_base": {
	// 					"initialization": "0-826",
	// 					"index_range": "827-4362"
	// 				},
	// 				"codecid": 0
	// 			}]

	if (match && match[1]) {
		const playinfoJson = JSON.parse(match[1]);




		audioArr = playinfoJson.data.dash.audio;
		videoArr = playinfoJson.data.dash.video;
		console.log('Extracted JSON:', audioArr);
	}
}

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

	//console.log(response.data);
	fs.writeFileSync('./test.html', response.data, 'utf-8');
	console.log('HTML 已保存到 test.html');
}
// Bilibili downloader
async function main() {
	await getVideo();
	await readHtml();
}

main();