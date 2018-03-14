module.exports = (sequelize, DataType) => {
  let Record = sequelize.define('Record', {
    content: DataType.JSON
  }, {
    underscored: true
  })

  Record.prototype.contentFor = function(fieldName) {
    // TODO: Deserialize
    return this.content[fieldName]
  }

  return Record
}