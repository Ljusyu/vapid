const Waterline = require('Waterline')
const bcrypt = require('bcrypt')

const User = Waterline.Collection.extend({
  identity: 'user',
  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      autoMigrations: {
        autoIncrement: true,
        unique: true
      }
    },

    email: {
      type: 'string',
      required: true,
      autoMigrations: {
        unique: true
      }
    },

    password: {
      type: 'string',
      required: true,
      validations: {
        minLength: 6
      }
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
