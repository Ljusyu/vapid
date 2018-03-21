module.exports = (sequelize, DataType) => {
  let Record = sequelize.define('Record', {
    content: DataType.JSON
  }, {
    underscored: true
  })

  Record.prototype.contentFor = function(tree) {
    let content = {}

    for (let [token, branch] of Object.entries(tree)) {
      let directive = vapid.directive(branch.params)
      content[token] = directive.render(this.content[branch.name])
    }

    return content
  }

  return Record
}