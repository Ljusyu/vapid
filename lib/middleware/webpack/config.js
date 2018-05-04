// TODO: How do is this handled in production? i.e. Hashed names, server routes
const { sync } = require('glob');
const { resolve } = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { RemoveFilesPlugin } = require('./plugins');

const vapidDir = resolve(__dirname, '../../../');
const vapidModules = resolve(vapidDir, 'node_modules');

/**
 * Dynamic config for Webpack
 *
 * @param {string} mode
 * @param {string} siteDir - path to website being served
 * @return {Object} Webpack configuration
 *
 * @todo Allow more than one JS/Sass file? Maybe filename.pack.sass?
 */
module.exports = function config(mode, siteDir) {
  const siteModules = resolve(siteDir, '../node_modules');

  return {
    mode,

    context: vapidModules,

    devtool: 'source-map',

    entry: {
      'javascripts/site': sync(resolve(siteDir, '**/site.js')),
      'stylesheets/site': sync(resolve(siteDir, '**/site.s[ac]ss')),
      'dashboard/javascripts/dashboard': [resolve(vapidDir, 'assets/javascripts/dashboard.js')],
      'dashboard/stylesheets/dashboard': [resolve(vapidDir, 'assets/stylesheets/dashboard.scss')],
    },

    module: {
      rules: [
        {
          test: /\.s[ac]ss$/,
          use: [
            { loader: MiniCssExtractPlugin.loader },
            { loader: 'css-loader', options: { url: false } },
            { loader: 'resolve-url-loader' },
            { loader: 'sass-loader?sourceMap' },
          ],
        },
      ],
    },

    plugins: [
      new MiniCssExtractPlugin({
        filename: '[name].css',
      }),
      new RemoveFilesPlugin({
        files: [
          'stylesheets/site.js',
          'dashboard/stylesheets/dashboard.js',
        ],
      }),
    ],

    resolve: {
      modules: [
        vapidModules,
        siteModules,
      ],
    },
  };
};
