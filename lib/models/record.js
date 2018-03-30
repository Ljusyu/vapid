const _ = require('lodash')

const SPECIAL_FIELDS = {
  _id: null,
  _created_at: { type: 'date', time: true },
  _updated_at: { type: 'date', time: true },
  _permalink: null
}

module.exports = (sequelize, DataType) => {
  let Record = sequelize.define('Record', {
    content: DataType.JSON
  }, {
    getterMethods: {
      permalink: function () {
        let group = this.get('group')

        if (group.repeating) {
          // TODO: Slugify title or name
          return [
            this.get('group').name,
            this.id
          ].join('/')
        } else {
          return null
        }
      }
    },
    hooks: {
      beforeFind: (options, fn) => {
        // Need for permalink getter
        options.include = options.include || [{ all: true }]
      },
      beforeSave: async (record) => {
        // Don't save content if it's not listed as a group field
        let group = record.group || await record.getGroup()
        record.content = _.pick(record.content, _.keys(group.fields))
      }
    },
    underscored: true
  })

  /*********************
  * CLASS METHODS
  *********************/

  Record.removeSpecialFields = function(fields) {
    return _.pickBy(fields, (params, token) => { return !_.startsWith(token, '_') })
  }

  /*********************
   * INSTANCE METHODS
   *********************/

  Record.prototype.contentFor = function(args) {
    let content = {}

    for (let [token, field] of Object.entries(args)) {
      let name = field.name
      let params = field.params
      let value, directive

      if ( _.has(SPECIAL_FIELDS, name)) {
        value = this.get(name.slice(1))
        params = _.assign({}, SPECIAL_FIELDS[name], params)
        
        if (params.type) {
          directive = vapid.directive(params)
          content[token] = directive.render(value)
        } else {
          content[token] = value
        }
      } else {
        value = this.content[name]
        directive = vapid.directive(params)
        content[token] = directive.render(value)
      }
    }

    return content
  }

  /*********************
  * CLASS CONSTANTS
  *********************/

  Record.SPECIAL_FIELDS = SPECIAL_FIELDS

  return Record
}