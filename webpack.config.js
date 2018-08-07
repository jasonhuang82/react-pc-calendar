const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
// ExtractTextPlugin 依照 output.path 開始path
const ExtractSCSS = new ExtractTextPlugin({
    filename: function (getPath) {
        // return getPath('../style/[name].css'); // 編譯後擷取出的 css 路徑改成css.css
        // return getPath('./[name]/css.css'); // 編譯後擷取出的 css 路徑改成css.css
        return getPath('./style/[name].min.css');
    },
    allChunks: false
});

const isDev = process.env.NODE_ENV === 'develop';

module.exports = {
    entry: {
        preview: ['babel-polyfill', './src/index.js']
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, './dist'),
    },
    module: {
        rules: [
            {
                test: /\.css$|\.scss$/,
                use: (() => {
                    let defaultLoader = [
                        {
                            loader: 'css-loader',
                            options: {
                                modules: true,
                                localIdentName: '[local]',
                                minimize: isDev ? false : true
                            }
                        }, {
                            loader: 'postcss-loader',
                            options: {
                                plugins: function () {
                                    return [
                                        require('autoprefixer')
                                    ];
                                }
                            }
                        }, {
                            loader: 'sass-loader'
                        }
                    ];
                    let devLoader = [
                        { loader: 'style-loader' },
                        ...defaultLoader
                    ];
                    let prodLoader = ExtractSCSS.extract({
                        use: [...defaultLoader]
                    });
                    return isDev ? devLoader : prodLoader;
                })()
            },
            {
                test: /\.js?$|\.jsx?$/,
                exclude: /(node_modules|bower_components)/,
                use: ['babel-loader']
            },
            {
                test: /\.png$|\.eot$|\.ttf$|\.svg$|\.woff$|\.gif/,
                // use: "file-loader?name=[path][name].[ext]&publicPath=../Files/&outputPath=../Files/"
                // file-loader 會把引用的資源彙整成一包
                use: 'file-loader?name=[path][name].[ext]&publicPath=../Files/&outputPath=./Files/'
            },
        ]
    },
    devServer: {
        contentBase: path.join(__dirname, './'),
        compress: false,
        port: 8000,
        index: 'preview.html',
        overlay: {
            error: true
        }
    },
    devtool: isDev ? 'source-map' : '',
    plugins: ((env = 'develop') => {
        let defaultPlugins = [
            new HtmlWebpackPlugin({
                inject: true,
                template: './src/index.html',
                filename: 'index.html'
            })
        ];
        let envPlugins = {
            'publish': [
                new CleanWebpackPlugin(['dist'], {
                    root: path.resolve('./'),
                }),
                ExtractSCSS
            ],
            'develop': [
                new webpack.HotModuleReplacementPlugin()
            ]
        };
        return defaultPlugins.concat(envPlugins[env]);
    })(process.env.NODE_ENV)
};