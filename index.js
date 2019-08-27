#! node
// 第一行注释"#! node"很重要，表示用node来执行这个文件。
//如果没有这句声明，就会在记事本中打开index.js文件。补充：linux/unix 下应该是#!/usr/bin/env node

const fs = require('fs');
const p = require('path');

const config = {};

//识别指令
process.argv.slice(2).forEach( ( item ) => {
    switch( item ) {
        case "-rollup":
        case "-r":
            config.cmd = 'rollup';
            break;
		case "-gulp":
		case "-g":
			config.cmd = "gulp";
			break;
        default:
            console.log(item)
            break;
    }
} );

var copy=function(src,dst){
    let paths = fs.readdirSync(src); //同步读取当前目录

    paths.forEach(function(path){
        var _src=src+'/'+path;
        var _dst=dst+'/'+path;

        fs.stat(_src,function(err,stats){  //stats  该对象 包含文件属性
            if(err)throw err;

            if(stats.isFile()){ //如果是个文件则拷贝 
                let  readable=fs.createReadStream(_src);//创建读取流
                let  writable=fs.createWriteStream(_dst);//创建写入流
                readable.pipe(writable);
            }else if(stats.isDirectory()){ //是目录则 递归 
                checkDirectory(_src,_dst,copy);
            }
        });
    });
}

var checkDirectory=function(src,dst,callback){
    fs.access(dst, fs.constants.F_OK, (err) => {
        if(err){
            fs.mkdirSync(dst);
            callback(src,dst);
        }else{
            callback(src,dst);
        }
      });
};

if ( config.cmd != undefined ) {
    fs.mkdir(config.cmd,function(error){
        if(error){
            console.log(error);
            return false;
        }

        const SOURCES_DIRECTORY = p.join(__dirname, config.cmd);  //源目录
        checkDirectory(p.resolve(SOURCES_DIRECTORY),p.join(process.cwd(),config.cmd),copy);
        console.log('创建目录成功');
    })
} else {
    console.log('This is pdm-cli');
}
