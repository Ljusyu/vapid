const Waterline = require('Waterline')

const Record = Waterline.Collection.extend({
  identity: 'record',
  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      autoMigrations: {
        autoIncrement: true
      }
    },

    content: {
      type: 'json'
    },

    group: {
      model: 'group'
    }
  }
})

module.exports = Record
