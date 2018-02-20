module.exports = (sequelize, DataType) => {
  return sequelize.define('User', {
    email: DataType.STRING,
    password_digest: DataType.STRING
  }, {
    underscored: true
  })
}