const Waterline = require('Waterline')

const Group = Waterline.Collection.extend({
  identity: 'group',
  autoPK: false,
  connection: 'vapid',

  attributes: {
    uuid: {
      type: 'string',
      primaryKey: true,
      required: true,
    },

    name: {
      type: 'string',
      required: true,
      unique: true
    },

    fields: {
      type: 'json'
    },

    // Or collection: 'record', via: 'group'?
    // Should records have an ID? Or use an _id in the object? Or a hash of the object?
    records: {
      type: 'array'
    }
  }
})

module.exports = Group
