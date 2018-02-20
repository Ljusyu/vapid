module.exports = (sequelize, DataType) => {
  return sequelize.define('Record', {
    content: DataType.JSON
  }, {
    underscored: true
  })
}