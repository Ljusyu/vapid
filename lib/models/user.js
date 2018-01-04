const Waterline = require('Waterline')

const User = Waterline.Collection.extend({
  identity: 'user',
  autoPK: false,
  connection: 'vapid',

  attributes: {
    uuid: {
      type: 'string',
      primaryKey: true,
      required: true,
    },

    email: {
      type: 'string',
      required: true,
      unique: true
    },

    password: {
      type: 'string',
      required: true
    }
  },

  // beforeCreate: (values, next) => {
  //   // Encrypt password
  // }
})

module.exports = User
