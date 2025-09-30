"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
var fs = require("fs");
var path = require("path");
var readline = require("readline");
console.log('Downloader module loaded');
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
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
    var _this = this;
    rl.question('Enter the video URL (or q/quit to exit): ', function (url) { return __awaiter(_this, void 0, void 0, function () {
        var trimmed;
        return __generator(this, function (_a) {
            trimmed = url.trim().toLowerCase();
            if (trimmed === 'q' || trimmed === 'quit') {
                console.log('Bye!');
                rl.close();
                return [2 /*return*/];
            }
            if (url.includes('bilibili') || url.includes('b23.tv')) {
                console.log('Bilibili downloader is not implemented yet.');
                rl.close();
                return [2 /*return*/];
            }
            console.log('Invalid plz reEnter');
            askUrl();
            return [2 /*return*/];
        });
    }); });
}
function readHtml() {
    return __awaiter(this, void 0, void 0, function () {
        var filePath, html;
        return __generator(this, function (_a) {
            filePath = path.join(__dirname, 'test.html');
            html = fs.readFileSync(filePath, 'utf-8');
            console.log(html);
            return [2 /*return*/];
        });
    });
}
//askUrl();
function getVideo() {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, axios_1.default.get('https://www.bilibili.com/video/BV1yyN1eMEgj/', {
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
                    })];
                case 1:
                    response = _a.sent();
                    console.log(response.data);
                    fs.writeFileSync('./test.html', response.data, 'utf-8');
                    console.log('HTML 已保存到 test.html');
                    return [2 /*return*/];
            }
        });
    });
}
// Bilibili downloader
await getVideo();
