const Waterline = require('Waterline')

const Record = Waterline.Collection.extend({
  identity: 'record',
  connection: 'vapid',

  attributes: {
    content: {
      type: 'json'
    },

    group: {
      model: 'group'
    }
  }
})

module.exports = Record
