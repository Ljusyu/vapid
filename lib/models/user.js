module.exports = (sequelize, DataType) => {
  return sequelize.define('User', {
    email: DataType.STRING,
    passwordDigest: DataType.STRING
  }, {
    underscored: true
  })
}