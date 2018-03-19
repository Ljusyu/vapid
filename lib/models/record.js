module.exports = (sequelize, DataType) => {
  let Record = sequelize.define('Record', {
    content: DataType.JSON
  }, {
    underscored: true
  })

  Record.prototype.contentFor = function(fieldsQuery) {
    let content = {}

    for (let [token, attrs] of Object.entries(fieldsQuery)) {
      // TODO: Manipulate content with options
      content[token] = this.content[attrs.name]
    }

    // TODO: Deserialize
    return content
  }

  return Record
}