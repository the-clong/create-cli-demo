#!/usr/bin/env node

// 交互式命令行
const inquirer = require("inquirer");
const path = require('path');
// nodejs读写package.json
const fs = require("fs");
//loading模块
const ora = require('ora');
// 可以指定两个参数，项目名和templateName( lbg-project --tpl)
const argv = require('minimist')(process.argv.slice(2), { string: ['_'] });
const cwd = process.cwd(); // 当前index.js所在目录
const {
    yellow,
    green,
    cyan,
    blue,
    red,
    lightRed,
    lightBlue
} = require("kolorist");

let targetDir = argv._[0];
const templateArg = argv.tpl || argv.t;
const defaultProjectName = targetDir || 'lbg-fe-project';
process.on('SIGINT', function() {
    console.log(red('✖') + ' Operation cancelled');
    process.exit();
});
// 模板配置
const FRAMEWORKS = [
    {
        value: 'pc',
        color: green
    },
    {
        value: 'h5',
        color: yellow
    },
];
let isMPA = true; // 默认是多页
const frameWorkArr = FRAMEWORKS.map((ite) => (ite.value));
try {
    const TEMPLATES = [
        // 确认项目名称
        {
            type: "input",
            name: "projectName",
            message: "项目名称",
            validate(value) {
                targetDir = value || defaultProjectName;
                return true;
            },
            default() {
                return defaultProjectName;
            },
        },
        {
            type: 'confirm',
            name: 'overwrite',
            when: () => {
               return fs.existsSync(targetDir);
            },
            message: (answers) => {
                const { projectName } = answers;
                return projectName !== '.' ? `使用${projectName}作为项目路径，将替换目录下所有文件，是否继续？` : '当前文件夹创建？'
            },
        },
        {
            name: "template",
            type: "list",
            when: (answers) => {
                if(answers.hasOwnProperty('overwrite')) {
                    if(!answers.overwrite) {
                        console.log(red('✖') + ' Operation cancelled');
                        process.exit();
                    }
                }
                // 没有tpl参数让用户选择，如果有但是用户写的不对，也需要让他自己选
                if(!templateArg) {
                    return true;
                } else {
                    console.log(blue('info') + ' 当前模板不存在，请重新选择');
                    return !frameWorkArr.includes(templateArg);
                }         
            },
            message: "选择模板",
            choices: FRAMEWORKS.map((item) => {
                return {
                    name: item.color(item.value),
                    value: item.value,
                };
            }),
        },
        {
            name: "entryType",
            type: "list",
            message: "选择入口",
            choices: [
                {
                    value: 'spa',
                    name: cyan("✔ 单页"),
                },
                {
                    value: 'mpa',
                    name: blue("✔ 多页"),
                },
            ],
        },
    ];
    inquirer.prompt(TEMPLATES).then((answers) => {
        const { projectName, template, entryType, overwrite } = answers;
        let templateDir = path.join(__dirname, `template-${template}`);
        switch(entryType) {
            case 'spa':
                isMPA = false;
                break;
            case 'mpa':
                isMPA = true;
                break;
        }
        const spinner = ora({spinner: {
            interval: 80, // Optional
            frames: ["🕛 ",
			"🕐 ",
			"🕑 ",
			"🕒 ",
			"🕓 ",
			"🕔 ",
			"🕕 ",
			"🕖 ",
			"🕗 ",
			"🕘 ",
			"🕙 ",
			"🕚 "],
        },text: lightBlue('下载中模板中')});
        spinner.start();
        // 用户选择覆盖将文件夹清空，没有覆盖创建新文件夹准备写入文件
        const root = path.join(cwd, projectName); // 取当前文件夹拼接
        if (overwrite) {
            delDir(root);
        } else if (!fs.existsSync(root)) {
            fs.mkdirSync(root);
        }
        // 写模板文件
        const files = templateDir ? fs.readdirSync(templateDir) : [];
        const writeByContent = (root, file, content) => {
            const targetPath = path.join(root, file);
            // 有content代表写入内容
            if(content) {
                fs.writeFileSync(targetPath, content);
            } else {
            // 没有直接copyfile
                copyFile(path.join(templateDir, file), targetPath);
            }
        };
        if(files.length > 0) {
            for (const file of files.filter((f) => f !== 'package.json')) {
                writeByContent(root, file);
            }
            // 将project-name写入package.json
            try {
               const packageObj = JSON.parse(fs.readFileSync(`${templateDir}/package.json`, 'utf8'));
               packageObj.name = projectName || targetDir;
               writeByContent(root, 'package.json', JSON.stringify(packageObj, null, 2));
            } catch(e) {
               console.log(lightRed('package name解析有误 !!!'));
            }
            spinner.succeed('Done，运行以下命令开发!');
            if (root !== cwd) {
                console.log(`\n cd ${path.relative(cwd, root)}`);
            }
            const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
            const pkgName = (pkgInfo && pkgInfo.name) || 'npm';
            switch(pkgName) {
                case 'yarn':
                    console.log(` ${pkgName} `);
                    console.log(` ${pkgName} start `);
                    break;
                default:
                    console.log(` ${pkgName} install `);
                    console.log(` ${pkgName} run dev `);
                    break;
            }
        }
    }).catch((err) => {
        if (err.isTtyError) {
            // Prompt couldn't be rendered in the current environment
        } else {
            // Something else went wrong
        }
    });

} catch (cancelled) {
    console.log(cancelled.message);
    return;
}

function pkgFromUserAgent(userAgent) {
    if (!userAgent) return undefined;
    const pkgSpec = userAgent.split(' ')[0]
    const pkgSpecArr = pkgSpec.split('/')
    return {
      name: pkgSpecArr[0],
      version: pkgSpecArr[1]
    };
  }

function copyDir(srcDir, destDir) {
    fs.mkdirSync(destDir, { recursive: true });
    for (const file of fs.readdirSync(srcDir)) {
        const srcFile = path.resolve(srcDir, file);
        const destFile = path.resolve(destDir, file);
        copyFile(srcFile, destFile);
    }
}

function copyFile(src, dest) {
    // 如果文件信息存在
   const stat = fs.statSync(src);
   let destPath = dest;
   // 多页添加pages路径
   if(isTargetEnd(dest, 'src') && isMPA) {
      destPath = dest + '/pages';
   }
   if(stat.isDirectory()) {
      copyDir(src, destPath);
   } else {
       fs.copyFileSync(src, dest);
   }
}


function isEmpty(curPath) {
    if(!curPath) {
        return true;
    }
    if(fs.existsSync(targetDir)) {
        // 获取是否有子目录
        return fs.readdirSync(curPath).length === 0;
    } else {
        return false;
    }
}

// 删除所有文件
function delDir(dir) {
    let files = [];
    if(!fs.existsSync(dir)) {
       return;
    } else {
       files = fs.readdirSync(dir);
       // 层层删除
       files.forEach((file, index) => {
           let curPath = dir + "/" + file;
           if(fs.statSync(curPath).isDirectory()) { // 读取文件信息判断是否是文件夹
               delDir(curPath); // 递归删除
               fs.rmdirSync(curPath);
           } else {
               fs.unlinkSync(curPath); // 删除文件
           }
       });
    }
}

// 判断字符串是否以target结尾
function isTargetEnd(str, target) {
     const start = str.length - target.length;
     const endTarget = str.substr(start, target.length);
     return target === endTarget;
}
