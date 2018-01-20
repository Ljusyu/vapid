const Waterline = require('waterline')
const User = require('./user')
const Group = require('./group')
const Record = require('./record')
const sailsDisk = require('sails-disk')

const waterline = new Waterline()
const config = {
  adapters: {
    'sails-disk': sailsDisk
  },

  datastores: {
    default: {
      adapter: 'sails-disk',
      dir: '/Users/srobbin/Desktop/testing/db'
    },
  }
}

waterline.registerModel(User)
waterline.registerModel(Group)
waterline.registerModel(Record)

module.exports = {
  waterline: waterline,
  dbConfig: config
}
