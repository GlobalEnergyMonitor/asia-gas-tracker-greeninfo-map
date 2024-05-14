const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  // Where webpack looks to start building the bundle
  entry: {
    app: './src/index.js',
  },

  // Where webpack outputs the assets and bundles
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'docs'),
    // publicPath: '',
    clean: true,
  },

  module: {
    rules: [
      {
        // use babel to transpile JavaScript
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      },
      {
        // use webpack default loader to copy image files to build folder
        test: /\.(jpe?g|png|gif|svg)$/,
        type: 'asset',
        parser: { dataUrlCondition: { maxSize: 15000 } },
      },
      // use webpack's built-in asset/resource loader for fonts
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      }
    ]
  },

  // Customize the webpack build process
  plugins: [
    // load index.html and inject sources to it as script tags
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src', 'index.html'),
      filename: 'index.html', // output file name
    })
  ],

}