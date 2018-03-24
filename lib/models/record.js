module.exports = (sequelize, DataType) => {
  let Record = sequelize.define('Record', {
    content: DataType.JSON
  }, {
    getterMethods: {
      permalink: function () {
        return "permalink"
      }
    },

    underscored: true
  })

  Record.prototype.contentFor = function(args) {
    let content = {}

    // console.log(this.constructor._timestampAttributes)
    // console.log(this._customGetters)

    for (let [token, field] of Object.entries(args)) {
      let directive = vapid.directive(field.params)
      content[token] = directive.render(this.content[field.name])
    }

    return content
  }

  return Record
}