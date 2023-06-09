const { log } = require('console');
const { resolve } = require('path')
const { readdir, statSync } = require('fs')
const git = require('simple-git');
const { exec, execSync } = require('child_process');
const list = [
    'git@git.100tal.com:xes_learningcloud/saas_mainteacher-client_messagebox.git',
    'git@git.100tal.com:xes_learningcloud/saas_mainteacher-client_rtcvideolibrary.git',
    'git@git.100tal.com:xes_learningcloud/saas_mainteacher-client_courselistlibrary.git',
    'git@git.100tal.com:xes_learningcloud/saas_mainteacher-client_dataviewlibrary.git',
    'git@git.100tal.com:xes_learningcloud/saas_mainteacher-client_commonlibrary.git',
    'git@git.100tal.com:xes_learningcloud/saas_mainteacher-client_coursewarelibrary.git',
    'git@git.100tal.com:xes_learningcloud/saas_mainteacher-client_baselibrary.git',
    'git@git.100tal.com:xes_learningcloud/saas_mainteacher-client_interactlibrary.git',
    'git@git.100tal.com:xes_learningcloud/saas_mainteacher-client_baseframe.git'
]

function clone(cwd, url) {
    console.log('clone', url, cwd)
    return git(cwd).clone(url);
}

// function install() {

// }

async function cloneAll(cwd) {
    const p = list.map(url => {
        clone(cwd, url)
    })

    try {
        await Promise.all(p)
        console.log('clone all success')
    } catch (error) {
        console.log('clone all error')
    }

}

function install(cwd) {
    // 判断是否是文件夹
    if (statSync(cwd).isDirectory())
        exec('npm install', { cwd }, (err, stdout, stderr) => {
            if (err) {
                console.log('err', err)
            } else {
                console.log('stdout', stdout)
            }
        })
}

// 遍历目录下的所有项目  并执行 npm install
function installAll(cwd) {
    readdir(cwd, (err, files) => {
        log('files', files)
        files.map(file => {
            const p = resolve(cwd, file)
            console.log('p', p)
            install(p)
        })
    })
}

const p = resolve('/Users/sunyongshen/Documents/WorkSpace/trunk/xes_learningcloud_saas')
installAll(p);