const Waterline = require('Waterline')
const uuid = require('uuid')

const Group = Waterline.Collection.extend({
  identity: 'group',
  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      columnName: '_id',
      autoMigrations: {
        autoIncrement: true
      }
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
  },

  firstOrCreate: async function(criteria, updateValues) {
    let group = await this.findOne(criteria) || await this.create(criteria).fetch()
    
    if (updateValues) {
      group = await this.update({ id: group.id }, updateValues).fetch()
    }

    return group
  }
})

module.exports = Group
