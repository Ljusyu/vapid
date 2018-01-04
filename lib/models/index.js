const Waterline = require('waterline')
const User = require('./user')
const Group = require('./group')
const sailsDisk = require('sails-disk')

const orm = new Waterline()
const config = {
  adapters: {
    'sails-disk': sailsDisk
  },

  connections: {
    vapid: {
      adapter: 'sails-disk',
      filePath: '/Users/srobbin/Desktop/'
    },
  }
}

orm.loadCollection(User)
orm.loadCollection(Group)

module.exports = {
  waterline: orm,
  dbConfig: config
}
