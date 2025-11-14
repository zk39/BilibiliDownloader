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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
var fs = require("fs");
var path = require("path");
var readline = require("readline");
var chalk = require("chalk");
// Initialize videoInfo with empty strings
var videoInfo = {
    title: '',
    author: '',
    description: '',
    uploadDate: '',
    bvid: ''
};
var log = console.log;
log('Downloader module loaded');
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
// ==================== Config ====================
var config = {
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
};
var audioArr = [];
var videoArr = [];
var dolby = [];
if (!fs.existsSync(config.downloadDir)) {
    {
        fs.mkdirSync(config.downloadDir);
    }
}
// ==================== Functions ====================
function cli() {
    var _this = this;
    try {
        rl.question('Enter the video/collection URL (or q/quit to exit): ', function (url) { return __awaiter(_this, void 0, void 0, function () {
            var trimmed, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        trimmed = url.trim().toLowerCase();
                        if (trimmed === 'q' || trimmed === 'quit') {
                            log(chalk.green('Bye!'));
                            cleanup();
                            process.exit(0);
                            return [2 /*return*/];
                        }
                        if (!(url.includes('bilibili') || url.includes('bv'))) return [3 /*break*/, 5];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        videoInfo.bvid = extractBVID(url);
                        log(chalk.blue("Extracted BVID: ".concat(videoInfo.bvid)));
                        return [4 /*yield*/, getBVHtml(url)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, downloadAudio()];
                    case 3:
                        _a.sent();
                        console.log('Done! Enter another URL or q to quit.\n');
                        cleanup();
                        return [2 /*return*/, cli()];
                    case 4:
                        error_1 = _a.sent();
                        console.error(' Error during processing:', error_1);
                        log('Please try again.\n');
                        return [2 /*return*/, cli()];
                    case 5:
                        cleanup();
                        console.log('Invalid input, please re-enter.');
                        return [2 /*return*/, cli()];
                }
            });
        }); });
    }
    catch (error) {
        console.error('⚠️ Error:', error);
        log('Please try again.\n');
        return cli();
    }
}
//==================== Manage cookies ====================
function loadCookies() {
    try {
        // if yes, load cookies from file
        if (fs.existsSync(config.cookieFile)) {
            var cookie = fs.readFileSync(config.cookieFile, 'utf-8').trim();
            if (cookie) {
                log(chalk.green('Cookies loaded from file.'));
                config.headers.cookie = cookie;
                return true;
            }
        }
    }
    catch (error) {
        log(chalk.red('No cookies file found, proceeding without cookies.'));
        return false;
    }
}
function setupCookie() {
    log(chalk.yellow('No cookies found. Please enter your Bilibili cookies to proceed.'));
    log(chalk.gray('(You can get it from browser DevTools -> Application -> Cookies)\n'));
    rl.question('Enter your cookies: ', function (inputCookie) {
        if (!inputCookie.trim()) {
            log(chalk.red('Cookie cannot be empty!'));
            promptRetry();
            return;
        }
        if (inputCookie.trim()) {
            if (!validateCookie(inputCookie)) {
                promptRetry();
                return;
            }
            config.headers.cookie = inputCookie.trim();
            //save cookies to file
            fs.writeFileSync(config.cookieFile, inputCookie.trim(), 'utf-8');
            log(chalk.green('Cookies saved successfully.\n'));
            cli();
        }
    });
}
function validateCookie(cookie) {
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
function promptRetry() {
    rl.question('Do you want to re-enter cookies? (y/n): ', function (answer) {
        var trimmed = answer.trim().toLowerCase();
        if (trimmed === 'y' || trimmed === 'yes') {
            setupCookie();
        }
        else {
            log(chalk.red('Cannot proceed without valid cookies. Exiting.'));
            cleanup();
            process.exit(1);
        }
    });
}
//==================== Download Module ====================
function getBVHtml(url) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, axios_1.default.get(url, {
                        headers: config.headers
                    })];
                case 1:
                    response = _a.sent();
                    //console.log(response.data);
                    extractJsonFromHtml(response.data);
                    return [2 /*return*/];
            }
        });
    });
}
function getSeasonHtml(url) {
    return __awaiter(this, void 0, void 0, function () {
        var seasonBaseUrl, fetchUrl, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    seasonBaseUrl = ' https://api.bilibili.com/x/polymer/web-space/seasons_archives_list?';
                    fetchUrl = "".concat(seasonBaseUrl, "season_id=SEASON_ID&page_num=PAGE_NUM&page_size=PAGE_SIZE");
                    return [4 /*yield*/, axios_1.default.get(url, {
                            headers: config.headers
                        })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function extractBVID(url) {
    var bvidMatch = url.match(/BV[0-9A-Za-z]+/);
    if (bvidMatch) {
        return bvidMatch[0];
    }
}
function extractJsonFromHtml(html) {
    var regrex = /window\.__playinfo__\s*=\s*(\{.*?\})\s*<\/script>/;
    var match = html.match(regrex);
    if (match && match[1]) {
        var playinfoJson = JSON.parse(match[1]);
        //using filter for audioarr and videoarr
        var filePath = path.join(config.downloadDir, 'playinfo.json');
        audioArr = playinfoJson.data.dash.audio;
        videoArr = playinfoJson.data.dash.video;
        dolby = playinfoJson.data.dash.dolby;
        videoInfo.title = html.match(/<title[^>]*>([^<]+)<\/title>/)[1].trim();
        videoInfo.author = html.match(/<meta[^>]*name="author"[^>]*content="([^"]*)"/)[1];
        videoInfo.description = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/)[1].replace(/\s*[，,]\s*相关视频[:：]?\s*.*$/, '').trim();
        log(chalk.green("Video Title: ".concat(videoInfo.title)));
        log(chalk.green("Author: ".concat(videoInfo.author)));
        log(chalk.green("BVID: ".concat(videoInfo.bvid)));
        log(chalk.green("Description: ".concat(videoInfo.description)));
        fs.writeFileSync('./playinfo.json', JSON.stringify({
            audioArr: audioArr,
            videoArr: videoArr,
            dolby: dolby
        }, null, 4), 'utf-8');
    }
}
function downloadAudio() {
    return __awaiter(this, void 0, void 0, function () {
        var len, bestAudio, urlsToDownload, _i, urlsToDownload_1, url, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    len = audioArr.length;
                    if (audioArr.length === 0) {
                        log(chalk.red('No audio streams found to download.'));
                        return [2 /*return*/];
                    }
                    if (!(audioArr.length >= 1)) return [3 /*break*/, 4];
                    log(chalk.yellow("Multiple audio streams found (".concat(len, "). Downloading the highest quality one.")));
                    // use sort to get the highest quality audio at this time
                    audioArr.sort(function (a, b) { return b.bandwidth - a.bandwidth; });
                    bestAudio = audioArr[0];
                    urlsToDownload = __spreadArray(__spreadArray([bestAudio.baseUrl, bestAudio.base_url], bestAudio.backupUrl, true), bestAudio.backup_url, true);
                    _i = 0, urlsToDownload_1 = urlsToDownload;
                    _a.label = 1;
                case 1:
                    if (!(_i < urlsToDownload_1.length)) return [3 /*break*/, 4];
                    url = urlsToDownload_1[_i];
                    if (!url)
                        return [3 /*break*/, 3];
                    log(chalk.blue("Downloading audio from URL: ".concat(url)));
                    return [4 /*yield*/, axios_1.default.get(url, {
                            headers: config.headers,
                            responseType: 'arraybuffer',
                        })];
                case 2:
                    res = _a.sent();
                    if (res.status != 200) {
                        log(chalk.yellow("Warning: Received status code ".concat(res.status, " when trying to download audio.\nTries next URL...")));
                        return [3 /*break*/, 3];
                    }
                    if (!res.data || res.data.byteLength === 0) {
                        log(chalk.yellow('Warning: Empty response data. Trying next URL...'));
                        return [3 /*break*/, 3];
                    }
                    fs.writeFileSync(path.join(config.downloadDir, "".concat(videoInfo.title, ".flac")), Buffer.from(res.data));
                    console.log('✅ finished');
                    return [2 /*return*/];
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function cleanup() {
    if (!rl.close) {
        rl.close();
    }
}
// welcome message
var welcomeMessage = function () { return console.log("\n\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557\n\u2551 \u2661  Welcome to Bilibili Downloader \u2661  \u2551\n\u2551          ~ Let's start!              \u2551\n\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D\n"); };
// Bilibili downloader
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var hasCookie;
        return __generator(this, function (_a) {
            hasCookie = loadCookies();
            if (!hasCookie) {
                setupCookie();
            }
            else {
                cli();
            }
            return [2 /*return*/];
        });
    });
}
main();
extractBVID('https://www.bilibili.com/video/BV18nxfzPESy/');
