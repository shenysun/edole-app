const { createWindowsInstaller } = require('electron-winstaller');
const createDMG = require('electron-installer-dmg');
const { remove } = require('fs-extra');
const path = require('path');
const { zip } = require('compressing');
const package = require('../package.json');

// 获取windows是多少位
const getWindowsArch = () => {
    const arch = process.env.npm_config_arch || process.arch;
    return arch === 'ia32' ? 'x86' : arch;
};

// 获取 platform
const getPlatform = () => {
    const platform = process.env.npm_config_platform || process.platform;
    return platform;
};

async function main() {
    const rootPath = path.join('./');
    const platform = getPlatform();
    const outPath = path.join(rootPath, 'dist/electron/Installer', platform);
    remove(outPath);
    const exeDirname = `${package.name}-${platform}-${getWindowsArch()}`;
    const appDirectory = path.join(rootPath, 'dist/electron/Packaged/' + exeDirname)
    console.log('安装包目录：', appDirectory);
    if (platform === 'win32') {
        console.log('开始生成 windows 安装包...');
        await createWindowsInstaller({
            appDirectory,
            noMsi: true,
            outputDirectory: outPath,
            usePackageJson: true,
            loadingGift: path.join(rootPath, 'build/loading.gif'),
        });
    } else if (platform === 'darwin') {
        console.log('开始生成 MAC 安装包...');
        await createDMG({
            appPath: path.join(appDirectory, package.name + '.app'),
            name: package.name,
            out: outPath,
        });
    }
    console.log('生成安装包完毕');
    console.log('开始生成zip文件...');
    await zip.compressDir(appDirectory, path.join(outPath, exeDirname + '.zip'));
    console.log('生成zip文件完成');
}

main();
