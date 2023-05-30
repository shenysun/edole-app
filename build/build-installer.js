const { createWindowsInstaller } = require('electron-winstaller');
const { remove } = require('fs-extra');
const path = require('path');

async function main() {
    const rootPath = path.join('./');
    const outPath = path.join(rootPath, 'dist/electron/Installer');
    remove(outPath);
    console.log('开始打包...');
    await createWindowsInstaller({
        appDirectory: path.join(rootPath, 'dist/electron/Packaged/edole-app-win32-x64'),
        noMsi: true,
        outputDirectory: path.join(outPath, process.platform),
        usePackageJson: true,
    });
    console.log('执行完毕');
}

main();
