module.exports = (sequelize, DataType) => {
  let Record = sequelize.define('Record', {
    content: DataType.JSON
  }, {
    underscored: true
  })

  Record.prototype.contentFor = function(args) {
    let content = {}

    for (let [token, field] of Object.entries(args)) {
      let directive = vapid.directive(field.params)
      content[token] = directive.render(this.content[field.name])
    }

    return content
  }

  return Record
}