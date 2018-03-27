const bcrypt = require('bcrypt')

module.exports = (sequelize, DataType) => {
  let User =  sequelize.define('User', {
    email: {
      type: DataType.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
        notEmpty: true,
        len: [3,255]
      }
    },
    password_digest: {
      type: DataType.STRING,
      validate: {
        notEmpty: true
      }
    },
    password: {
      type: DataType.VIRTUAL,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [6,255]
      }
    }
  }, {
    hooks: {
      beforeCreate: (user, options) => {
        user.email = user.email.toLowerCase()
        user.password_digest = bcrypt.hashSync(user.password, 10)
      }
    },
    underscored: true,
    indexes: [{ unique: true , fields: ['email'] }],
  })

  /*********************
   * INSTANCE METHODS
   *********************/

  User.prototype.authenticate = function(password) {
    if (bcrypt.compareSync(password, this.password_digest)) {
      return this
    } else {
      return false
    }
  }

  return User
}