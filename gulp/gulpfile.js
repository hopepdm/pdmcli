/**
 * Created by jeff on 2017/4/24.
 */
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var del = require('del');
var browserSync = require('browser-sync').create();
var runSequence = require('run-sequence');
// var proxyMiddleware = require('http-proxy-middleware');
// var fs = require('fs');
// var moment = require('moment');
// var webpack = require('webpack-stream');

// var obfuscateDomainLock = ['localhost', '192.168.11.221'];//混淆代码域名保护 /*,'localhost'*/
var isObfuscate = false;
var isCompress = false;

var PlatformType = { PC: 'PC', PAD: 'pad'};
var environment = {NODE_ENV: 'production', PLATFORM: PlatformType.PC};
//加密参数
var obfuscateOptions = {
    // domainLock:obfuscateDomainLock,
    compact: true,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    debugProtection: false,
    debugProtectionInterval: false,
    disableConsoleOutput: false,
    log: true,
    mangle: true,
    target: 'browser',
    renameGlobals: false,
    rotateStringArray: true,
    selfDefending: true,
    stringArray: true,
    stringArrayEncoding: 'base64',
    stringArrayThreshold: 0.8,
    unicodeEscapeSequence: false
};
//不需要转换成ES6语法的js
var unBabelArr = ["swkj-tool-lib.min.js", "swkj-tool.min.js", "swkj-tool-ui-lib.min.js"];
//不需要加密的js
var unObfuscateArr = ["swkj-tool-lib.min.js", "swkj-tool-ui-lib.min.js"];

gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            baseDir: "./dist",
            index: getIndexFile(),
        },
        port: 5679
    });
});
//由于加密模块自带压缩，所以无需重复压缩
var obfuscatorCondition = function (file) {
    if(!isObfuscate || !file.path.endsWith(".js")) {
        return false;
    }

    for(var i=0; i < unObfuscateArr.length; i++) {
        if(file.path.indexOf(unObfuscateArr[i]) >= 0) {
            return false;
        }
    }
    //console.log("obfuscatorCondition file: ", file.path);
    return true;
}
//非加密模块调用gulp-uglify进行压缩
var uglifyCondition = function (file) {
    if(!isCompress || !file.path.endsWith(".js")) {
        return false;
    }

    for(var i=0; i < unObfuscateArr.length; i++) {
        if(file.path.indexOf(unObfuscateArr[i]) >= 0) {
            //console.log("uglifyCondition file: ", file.path);
            return true;
        }
    }

    return false;
}

//压缩合并非模块化js
gulp.task('min-js', function(){
    return gulp.src(getIndexFile())
        .pipe($.plumber())
        .pipe($.preprocess({context: environment}))
        .pipe($.useref())
        .pipe($.preprocess({context: environment}))
        // Convert ES6 to ES5
        .pipe($.if('*.js', $.babel({
            presets: ['react', 'es2015'],
            ignore: unBabelArr
        })))
        // Uglifies Javascript files
        .pipe($.if(uglifyCondition, $.uglify().on('error', function (err) {
            $.util.log($.util.colors.red('[Error]'), err.toString());
        })))
        // Obfuscate Javascript files
        .pipe($.if(obfuscatorCondition, $.javascriptObfuscator(obfuscateOptions)))
        .pipe($.plumber.stop())
        .pipe(gulp.dest('dist/'));
});

gulp.task('min-ui-js-for-dev', function(){
    var srcPath = (environment.PLATFORM === PlatformType.PC ? ['ui/**/*.js'] : ['ui-pad/**/*.js']),
        outPath = (environment.PLATFORM === PlatformType.PC ? "./dist/ui/" : "./dist/ui-pad/");

    return gulp.src(srcPath)
        .pipe($.preprocess({context: environment}))
        .pipe($.babel({
            presets: ['react', 'es2015']
        }))
        .pipe(gulp.dest(outPath));
});

gulp.task('min-css', function(){
    var padCss = ['res/**/*.css'];

    var srcPath = (environment.PLATFORM === PlatformType.PC ? ['res/**/*.css', '!res/pad/**/*.css'] : padCss),
        outPath = (environment.PLATFORM === PlatformType.PC ? "style.min.css" : "style-pad.min.css");

    return gulp.src(srcPath)
        .pipe($.concat(outPath))
        .pipe($.if(isCompress, $.cleanCss({
            compatibility: 'ie8',//保留ie8及以下兼容写法
        })))
        .pipe(gulp.dest('./dist'));
});

gulp.task('copy-res', function(){
    var ret = gulp.src(['res/**/*', '!res/**/*.css'])
        .pipe(gulp.dest('dist/res'))

    return ret;
});

gulp.task('copy-swkj_debug', function(){
    return gulp.src(['./swkj/**/*'])
        .pipe($.preprocess({context: environment}))
        .pipe(gulp.dest('dist/swkj'));
});

gulp.task('write-version', function() {
    // var timeStamp = moment().format();

    // var filePath = "./dist/res/resource.json";

    // var resourceStr = fs.readFileSync(filePath, 'utf-8');
    // var resourceJson = JSON.parse(resourceStr);

    // resourceJson.version = timeStamp;

    // fs.writeFileSync(filePath, JSON.stringify(resourceJson));
});

//清除dist目录
gulp.task('clean', function () {
    return del(['dist/*']);
});

gulp.task('watch', function () {
    gulp.watch(["lib/**/*.js", 'ui-pad/pad-main.js', getIndexFile()]).on('change', function(){
        if(environment.PLATFORM === PlatformType.PC) {
            runSequence('min-js', browserSync.reload);
        } else {
            runSequence('min-js', 'webpack-js', browserSync.reload);
        }
    });
    gulp.watch(['ui/**/*.js', 'ui-pad/**/*.js', '!ui-pad/pad-main.js']).on('change', function(){
        runSequence('min-ui-js-for-dev', browserSync.reload);
    });
    gulp.watch(["swkj/**/*.js"]).on('change', function(){
        runSequence('copy-swkj_debug', browserSync.reload);
    });
    gulp.watch(['res/**/*', '!res/**/*.css', '!res/**/*.js']).on('change', function(){
        runSequence('copy-res', browserSync.reload);
    });
    gulp.watch(['res/**/*.css']).on('change', function(){
        runSequence('min-css', browserSync.reload);
    });
});

//根据平台获取主页
function getIndexFile() {
    return (environment.PLATFORM === PlatformType.PC ? "index.html" : "index-pad.html");
}

/*===============pc================*/
gulp.task('dev', function (callback) {
    environment.NODE_ENV = "development";
    environment.PLATFORM = PlatformType.PC;
    isCompress = false;
    isObfuscate = false;
    runSequence('clean', ['copy-res'], 'write-version', ['min-js', 'min-css', 'min-ui-js-for-dev', 'copy-swkj_debug'], 'browser-sync', 'watch', callback);
});

gulp.task('prod', function (callback) {
    environment.NODE_ENV = "production";
    environment.PLATFORM = PlatformType.PC;
    isCompress = true;
    isObfuscate = false;
    runSequence('clean', ['copy-res'], 'write-version', ['min-js', 'min-css'], 'browser-sync', callback);
});

gulp.task('prod-obfuscate', function (callback) {
    environment.NODE_ENV = "production";
    environment.PLATFORM = PlatformType.PC;
    isCompress = true;
    isObfuscate = true;
    runSequence('clean', ['copy-res'], 'write-version', ['min-js', 'min-css'], 'browser-sync', callback);
});
