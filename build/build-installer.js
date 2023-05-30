const { createWindowsInstaller } = require('electron-winstaller');
const { remove } = require('fs-extra');
const path = require('path');
const package = require('../package.json');

// 获取windows是多少位
const getWindowsArch = () => {
    const arch = process.env.npm_config_arch || process.arch;
    return arch === 'ia32' ? 'x86' : arch;
};

// 获取 platform
const getPlatform = () => {
    const platform = process.env.npm_config_platform || process.platform;
    return platform === 'darwin' ? 'osx' : platform;
};

console.log(getWindowsArch());
async function main() {
    const rootPath = path.join('./');
    const outPath = path.join(rootPath, 'dist/electron/Installer');
    remove(outPath);
    const platform = getPlatform();
    const exeDirname = `${package.name}-${platform}-${getWindowsArch()}`;
    console.log('安装包目录：', exeDirname);

    if (platform === 'win32') {
        console.log('正在生成 windows 安装包...');
        await createWindowsInstaller({
            appDirectory: path.join(rootPath, 'dist/electron/Packaged/' + exeDirname),
            noMsi: true,
            outputDirectory: path.join(outPath, process.platform),
            usePackageJson: true,
            loadingGift: path.join(rootPath, 'build/loading.gif'),
        });
    } else if (platform === 'darwin') {
    }
    console.log('生成完毕');
}

main();
