const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  // Set the mode to development or production
  // note, webpack sets production as the default value for mode.
  mode: 'production', 
  devtool: 'source-map',
  
  module: {
    rules: [
      {
        // handles .sass, .scss, .css
        test: /\.(sa|sc|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader, 
          {
            loader: 'css-loader',
            options: { 
              sourceMap: true, 
              importLoaders: 1, 
              modules: {
                // https://github.com/webpack-contrib/css-loader#separating-interoperable-css-only-and-css-module-features
                // allow Interoperable CSS features only (such as :import and :export) without using further CSS Module functionality
                compileType: 'icss'
              } 
            },
          },
          { loader: 'postcss-loader', options: { sourceMap: true } }, // see postcss.config.js for options
          { loader: 'sass-loader', options: { sourceMap: true } }
        ],
      },
    ],
  },

  // Customize the webpack build process
  plugins: [
    // Extracts CSS into separate files
    // Note: style-loader is for development, MiniCssExtractPlugin is for production
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[id].[contenthash].css',
    }),

    // copy the listed things from entry to output
    new CopyWebpackPlugin({
      patterns: [
        { from: 'static/', to: 'static/' },
      ]
    })
  ]
});