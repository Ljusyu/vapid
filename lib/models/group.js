const Waterline = require('Waterline')
const uuid = require('uuid')

const Group = Waterline.Collection.extend({
  identity: 'group',
  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      columnName: '_id',
      required: true
    },

    name: {
      type: 'string',
      required: true,
      autoMigrations: {
        unique: true
      }
    },

    fields: {
      type: 'json'
    },

    records: {
      collection: 'record',
      via: 'group'
    }
  },

  beforeValidate: (values, next) => {
    if (err) return next(err)

    values.id = uuid.v4()
    next()
  }
})

module.exports = Group
