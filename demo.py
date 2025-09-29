import requests
import re
import json
import os


def get_video(url: str):
    headers = {
        'Accept':
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7,zh-CN;q=0.6',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
        'sec-ch-ua':
        '"Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'Referer': 'https://www.bilibili.com',
    }
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        with open("test.mp4", "wb") as f:
            f.write(response.content)
        return 200
    else:
        return response.status_code


def get_audio(url: str):
    headers = {
        'Accept':
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7,zh-CN;q=0.6',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
        'sec-ch-ua':
        '"Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'Referer': 'https://www.bilibili.com',
    }
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        with open("test.m4a", "wb") as f:
            f.write(response.content)
        return 200
    else:
        return response.status_code


cookies ={
    'testcookie': '1',
    'buvid4': 'C423C8AD-EF49-BC28-6A6E-33372674F50709892-024062613-SR8SF7x5RpCnI6TCDNls8g%3D%3D',
    'buvid_fp_plain': 'undefined',
    'enable_web_push': 'DISABLE',
    'DedeUserID': '11261913',
    'DedeUserID__ckMd5': '4c0a6ef27f979261',
    'PVID': '4',
    'enable_feed_channel': 'ENABLE',
    '_uuid': '51B103782-4595-196A-510CC-FC339D99EE3228201infoc',
    'header_theme_version': 'OPEN',
    'theme-tip-show': 'SHOWED',
    'theme-avatar-tip-show': 'SHOWED',
    'theme-switch-show': 'SHOWED',
    'go-old-space': '1',
    'buvid3': '27BA2B4D-61FB-A14B-128E-F1014127D897546748infoc',
    'b_nut': '1753994746',
    'rpdid': "|(u)|mYlJR)~0J'u~lRl)kk~J",
    'CURRENT_QUALITY': '80',
    'fingerprint': '20377a6f592a25efc50b26acf0ec1fdd',
    'buvid_fp': '20377a6f592a25efc50b26acf0ec1fdd',
    'bmg_af_switch': '1',
    'bmg_src_def_domain': 'i0.hdslb.com',
    'SESSDATA': '229771db%2C1774705383%2C7b3fb%2A91CjASvd8LYSu-NZONuGHK1twrzgJfD-P1450C7HL-qbp3zPrZPwJEhOYRlvKBc-FwOJ4SVmpUSDJlYXdXclh0MmZmWHFLX0tvRXpXZHUxNHBIenVOZWFXUTBzQzNRVlpzdlFGTENyZENmR2dKNFpMbmt1bTZIYllacTZZV3RyQV84WWFXb0txWFVRIIEC',
    'bili_jct': 'c1e81537b356e50a51976abd3e9f9e02',
    'sid': '8fvslthu',
    'home_feed_column': '5',
    'browser_resolution': '1592-732',
    'CURRENT_FNVAL': '4048',
    'bsource': 'search_google',
    'bili_ticket': 'eyJhbGciOiJIUzI1NiIsImtpZCI6InMwMyIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTk0MjMzNDUsImlhdCI6MTc1OTE2NDA4NSwicGx0IjotMX0.H7pDUhOuEPxQEvcI2KsVRwCjs_haCzDaeH_lgUu5bg4',
    'bili_ticket_expires': '1759423285',
    'bp_t_offset_11261913': '1118091235391700992',
    'b_lsid': '7717C5A8_19996AFA49B',
}
headers = {
    'accept':
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'accept-language':
    'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7,zh-CN;q=0.6',
    'cache-control':
    'no-cache',
    'pragma':
    'no-cache',
    'priority':
    'u=0, i',
    'sec-ch-ua':
    '"Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"',
    'sec-ch-ua-mobile':
    '?0',
    'sec-ch-ua-platform':
    '"Windows"',
    'sec-fetch-dest':
    'document',
    'sec-fetch-mode':
    'navigate',
    'sec-fetch-site':
    'none',
    'sec-fetch-user':
    '?1',
    'upgrade-insecure-requests':
    '1',
    'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
}

url = input("請輸入B站影片網址: ")
url = url.strip()
url = url.split('/')
id = url[4]
url = f'https://www.bilibili.com/video/{id}/'
response = requests.get(url=url, cookies=cookies, headers=headers)

pattern = r'"video":(.*?),"dolby"'
result = re.search(pattern, response.text)
file = "{" + f'"video":{result.group(1)}' + '}'
file = json.loads(file)
for i in file['video']:
    tmp = get_video(i['baseUrl'])
    if tmp == 200:
        break
    tmp = get_video(i['"base_url"'])
    if tmp == 200:
        break
    tmp = get_video(i["backupUrl"][0])
    if tmp == 200:
        break
    tmp = get_video(i["backup_url"][0])
    if tmp == 200:
        break

for i in file['audio']:
    tmp = get_audio(i['baseUrl'])
    if tmp == 200:
        break
    tmp = get_audio(i['"base_url"'])
    if tmp == 200:
        break
    tmp = get_audio(i["backupUrl"][0])
    if tmp == 200:
        break
    tmp = get_audio(i["backup_url"][0])
    if tmp == 200:
        break

pattern = r'<title data-vue-meta="true">(.*?)</title>'
result = re.search(pattern, response.text)
title = result.group(1)

os.system("ffmpeg -i test.mp4 -i test.m4a -c:v copy -c:a aac file/output.mp4")
os.remove("test.mp4")
os.remove("test.m4a")
os.rename("file/output.mp4", f"file/{title}.mp4")