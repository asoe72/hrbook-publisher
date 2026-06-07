taskkill /f /im node.exe
rmdir /s /q node_modules package-lock.json
set PUPPETEER_SKIP_DOWNLOAD=true

call npm install
call npm install -D concurrently
pushd frontend
call npm install
popd
