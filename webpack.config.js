const {
  resolve
} = require('path')
const autoprefixer = require('autoprefixer')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin').CleanWebpackPlugin;
module.exports = {
  mode: 'development', // production
  devtool: 'source-map',
  optimization: {
    minimize: false
  },
  entry: {
    index: resolve(__dirname, './src/js/main.ts')
  },
  output: {
    publicPath: './',
    path: resolve(__dirname, './dist'),
    filename:'[name].[chunkhash:8].js'
  },
  resolve: {
    extensions: ['.ts', '.js'] 
  },
  module: {
    rules: [{
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: resolve(__dirname, 'node_modules'),
        query: {
          'presets': ['latest']
        }
      },
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: resolve(__dirname, 'node_modules'),
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              plugins: function () {
                return [autoprefixer('last 5 versions')]
              }
            }
          }
        ]
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              plugins: function () {
                return [autoprefixer('last 5 versions')]
              }
            }
          },
          'sass-loader'
        ]
      },
      {
        test: /\.(png|jpg|jpeg|gif|ico|woff|eot|svg|ttf)$/i,
        loaders: 'url-loader?limit=1024&name=img/[name]-[hash:16].[ext]'
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: resolve(__dirname, 'src/index.html'),
      title: 'GAME',
      chunks: ['index'],
      excludeChunks: ['node_modules'],
      hash: true,
      minify: {
        removeComments: true,
        collapseWhitespace: true
      }
    }),
    new CleanWebpackPlugin()
  ],
  devServer: {
    watchOptions: {
      ignored: /node_modules/
    },
    open: true,
    host: 'localhost',
    port: 8080
  }
}