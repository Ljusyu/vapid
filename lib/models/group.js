const Waterline = require('Waterline')

const Group = Waterline.Collection.extend({
  identity: 'group',
  connection: 'vapid',

  attributes: {
    name: {
      type: 'string',
      required: true,
      unique: true
    },

    fields: {
      type: 'json'
    },

    records: {
      collection: 'record',
      via: 'group'
    }
  }
})

module.exports = Group
