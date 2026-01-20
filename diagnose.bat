@echo off
chcp 65001 >nul
echo ========================================
echo  编译诊断工具
echo ========================================
echo.

echo [检查 1] 检查必要文件...
if not exist downloader.ts (
    echo ❌ downloader.ts 不存在！
    pause
    exit /b 1
)
echo ✅ downloader.ts 存在

if not exist tsconfig.json (
    echo ❌ tsconfig.json 不存在！
    pause
    exit /b 1
)
echo ✅ tsconfig.json 存在
echo.

echo [检查 2] TypeScript 配置内容...
type tsconfig.json
echo.

echo [检查 3] 尝试编译...
echo 正在运行: tsc --noEmit
tsc --noEmit
if %errorlevel% neq 0 (
    echo.
    echo ❌ 类型检查失败！上面的错误需要修复。
    echo.
    pause
    exit /b 1
)
echo ✅ 类型检查通过
echo.

echo [检查 4] 执行编译...
echo 正在运行: tsc
tsc
if %errorlevel% neq 0 (
    echo ❌ 编译失败！
    pause
    exit /b 1
)
echo ✅ 编译完成
echo.

echo [检查 5] 验证编译输出...
if not exist dist\downloader.js (
    echo ❌ dist\downloader.js 未生成！
    echo.
    echo 可能的原因:
    echo 1. tsconfig.json 的 outDir 配置错误
    echo 2. 编译器没有输出文件
    echo.
    echo 当前目录内容:
    dir /b
    echo.
    pause
    exit /b 1
)
echo ✅ dist\downloader.js 已生成
for %%A in (dist\downloader.js) do echo    文件大小: %%~zA 字节
echo.

echo [检查 6] 检查 pkg 工具...
where pkg >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  pkg 未全局安装，尝试使用 npx...
    echo 正在运行: npx pkg dist/downloader.js --targets node18-win-x64 --output build/bili-downloader-win.exe
    npx pkg dist/downloader.js --targets node18-win-x64 --output build/bili-downloader-win.exe
) else (
    echo ✅ pkg 已安装
    echo 正在运行: pkg dist/downloader.js --targets node18-win-x64 --output build/bili-downloader-win.exe
    pkg dist/downloader.js --targets node18-win-x64 --output build/bili-downloader-win.exe
)

if %errorlevel% neq 0 (
    echo ❌ 打包失败！
    pause
    exit /b 1
)
echo.

echo [检查 7] 验证打包结果...
if not exist build\bili-downloader-win.exe (
    echo ❌ 可执行文件未生成！
    pause
    exit /b 1
)

echo ✅ 打包成功！
echo.
echo ========================================
echo  结果
echo ========================================
for %%A in (build\bili-downloader-win.exe) do (
    echo 文件: build\bili-downloader-win.exe
    echo 大小: %%~zA 字节 ^(约 %%~zA MB^)
)
echo.
pause