const Waterline = require('Waterline')
const bcrypt = require('bcrypt')

const User = Waterline.Collection.extend({
  identity: 'user',
  connection: 'vapid',

  attributes: {
    email: {
      type: 'string',
      required: true,
      unique: true
    },

    password: {
      type: 'string',
      minLength": 6,
      required: true
    }
  },

  authenticate: (email, password) => {
    // Find the user
    // Compare the password to the saved hash
    // Return the user if found
  },

  beforeCreate: (values, next) => {
    if (err) return next(err)

    // TODO: Compare password and password_confirmation, a la Devise?
    values.password = bcrypt.hashSync(values.password, 10)
    next()
  }
})

module.exports = User
