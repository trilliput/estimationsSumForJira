const _ = require('lodash');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const VersionFilePlugin = require('webpack-version-file-plugin');

const config = require('./config.js');


module.exports = _.merge({}, config, {
  output: {
    path: path.resolve(__dirname, '../build/dev'),
  },
  mode: 'development',
  devtool: 'source-map',
  plugins: [
    new CopyWebpackPlugin({
      'patterns': [
        {
          from: './src/static',
          to: 'static'
        }
      ]
    }),
    new VersionFilePlugin({
      packageFile: path.resolve(__dirname, '../package.json'),
      template: path.resolve(__dirname, '../src/manifest.json'),
      outputFile: path.resolve(__dirname, '../build/dev/manifest.json'),
    })
  ],
  watch: true
});
