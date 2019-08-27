var UglifyJsPlugin = require("uglifyjs-webpack-plugin");

module.exports = function(env, outFileName){
    return {
        mode: env,
        //devtool: "source-map",
        //entry: path.join(srcDir, "main.js"),
        output: {
            // path: path.join(__dirname, "dist/"),
            // publicPath: "dist/",
            filename: outFileName
        },
        optimization: {
            //压缩
            minimizer: [
                new UglifyJsPlugin({
                    cache: false,
                    parallel: true,
                    sourceMap: false
                })
            ]
        },
        module: {
            rules: [{
                test: /(\.jsx|\.js)$/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["env", "react"]
                    }
                }
            }]
        }
    }
};