const { createWindowsInstaller } = require('electron-winstaller');
const createDMG = require('electron-installer-dmg');
const { remove } = require('fs-extra');
const { promises } = require('fs');
const path = require('path');
const { zip } = require('compressing');
const package = require('../package.json');

// 获取系统位数
const getArch = () => {
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
    await remove(outPath);
    await promises.mkdir(outPath, { recursive: true });
    const exeDirname = `${package.name}-${platform}-${getArch()}`;
    const appDirectory = path.join(rootPath, 'dist/electron/Packaged/' + exeDirname);
    // 判断是否存在目录 appDirectory
    const isExists = await promises.stat(appDirectory);
    console.log('安装包目录：', appDirectory, isExists.isDirectory());

    if (platform === 'win32') {
        console.log('开始生成 windows 安装包...');
        await createWindowsInstaller({
            appDirectory,
            noMsi: true,
            outputDirectory: outPath,
            usePackageJson: true,
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
