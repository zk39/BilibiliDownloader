@echo off
chcp 65001 >nul
echo.
echo ╔═══════════════════════════════════════════╗
echo ║  完全清理并重新安装 - 彻底修复           ║
echo ╚═══════════════════════════════════════════╝
echo.
echo 警告: 这将删除所有依赖并重新安装
echo.
pause

echo [步骤 1/6] 删除所有旧文件...
if exist node_modules (
    echo 删除 node_modules...
    rmdir /s /q node_modules
)
if exist package-lock.json (
    echo 删除 package-lock.json...
    del /f /q package-lock.json
)
if exist dist (
    echo 删除 dist...
    rmdir /s /q dist
)
if exist build (
    echo 删除 build...
    rmdir /s /q build
)
echo ✅ 完成
echo.

echo [步骤 2/6] 清理 npm 缓存...
call npm cache clean --force
echo ✅ 完成
echo.

echo [步骤 3/6] 安装兼容版本的依赖...
echo.
echo 安装 chalk@4.1.2...
call npm install chalk@4.1.2 --save --save-exact
echo.
echo 安装 axios@0.27.2...
call npm install axios@0.27.2 --save --save-exact
echo.
echo 安装其他依赖...
call npm install cli-progress@3.12.0 p-limit@3.1.0 ffmpeg-static@5.2.0 --save
echo.
echo 安装开发依赖...
call npm install --save-dev @types/node@20.10.0 @types/cli-progress@3.11.0 typescript@5.3.0 tsx@4.7.0 pkg@5.8.1
echo ✅ 完成
echo.

echo [步骤 4/6] 验证版本...
call npm list chalk axios
echo.

echo [步骤 5/6] 编译 TypeScript...
call npx tsc
if %errorlevel% neq 0 (
    echo ❌ 编译失败！
    pause
    exit /b 1
)
echo ✅ 完成
echo.

echo [步骤 6/6] 打包可执行文件...
call npx pkg dist/downloader.js --targets node18-win-x64 --output build/bili-downloader-win.exe
if %errorlevel% neq 0 (
    echo ❌ 打包失败！
    pause
    exit /b 1
)
echo ✅ 完成
echo.

echo ╔═══════════════════════════════════════════╗
echo ║  完成！                                   ║
echo ╚═══════════════════════════════════════════╝
echo.
echo 测试运行:
echo   cd build
echo   bili-downloader-win.exe
echo.
pause