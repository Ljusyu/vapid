// TODO: How do is this handled in production? i.e. Hashed names, server routes
const { sync } = require('glob')
const { resolve } = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { RemoveFilesPlugin } = require('./plugins')

const mode = vapid.env === 'development' ? 'development' : 'production'
const site_modules = resolve(vapid.site.paths.root, 'node_modules')
const vapid_modules = resolve(__dirname, 'node_modules')

module.exports = {
  mode: mode,

  entry: {
    'javascripts/site': [resolve(vapid.site.paths.www, 'javascripts/site.js')],
    'stylesheets/site': sync(resolve(vapid.site.paths.www, 'stylesheets/site.s[ac]ss')),
    'dashboard/javascripts/dashboard': [resolve(__dirname, '../../assets/javascripts/dashboard.js')],
    'dashboard/stylesheets/dashboard': [resolve(__dirname, '../../assets/stylesheets/dashboard.scss')]
  },

  output: {
    path: resolve(vapid.site.paths.data, '.webpack'),
    publicPath: '/',
    filename: '[name].js'
  },

  module: {
    rules: [
      {
        test:/\.s[ac]ss$/,
        use: [
          { loader: MiniCssExtractPlugin.loader },
          { loader: 'css-loader', options: { url: false } },
          { loader: 'sass-loader' }
        ]
      }
    ]
  },

  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css'
    }),
    new RemoveFilesPlugin({
      files: [
        'stylesheets/site.js',
        'dashboard/stylesheets/dashboard.js'
      ]
    })
  ],

  resolve: {
    modules: [
      vapid_modules,
      site_modules
    ],
  }
}
