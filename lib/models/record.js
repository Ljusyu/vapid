const Utils = require('../utils')

const SPECIAL_FIELDS = {
  _id: null,
  _created_at: { type: 'date', time: true },
  _updated_at: { type: 'date', time: true },
  _permalink: null
}

module.exports = (sequelize, DataType) => {
  let Record = sequelize.define('Record', {
    content: {
      type: DataType.JSON,

      defaultValue: {},

      validate: {
        fields(content) {
          let errors = Utils.reduce(this.section.fields, (memo, params, name) => {
            let directive = vapid.directive(params)

            if (directive.attrs.required && !content[name]) {
              memo[name] = 'required field'
            }

            return memo
          }, {})

          if (!Utils.isEmpty(errors)) {
            throw new Error(JSON.stringify(errors))
          }
        }
      }
    }
  }, {
    getterMethods: {
      permalink: function () {
        let section = this.get('section')
        let slug = Utils.kebabCase(this.content.title || this.content.name)

        if (section.multiple) {
          let path =  Utils.compact([
            section.name,
            this.id,
            slug
          ]).join('/')
          return `/${path}`
        } else {
          return null
        }
      }
    },

    hooks: {
      beforeFind: (options, fn) => {
        // Need for permalink getter
        options.include = options.include || [{ all: true }]
      }
    },
    
    underscored: true
  })

  /*********************
  * CLASS METHODS
  *********************/

  Record.removeSpecialFields = function(fields) {
    return Utils.pickBy(fields, (params, token) => { return !Utils.startsWith(token, '_') })
  }

  Record.addHooks = function(hooks, fn) {
    Utils.each(hooks, hook => {
      this.addHook(hook, 'registeredHooks', fn)
    })
  }

  Record.removeHooks = function(hooks) {
    Utils.each(hooks, hook => {
      this.removeHook(hook, 'registeredHooks')
    })
  }

  /*********************
   * INSTANCE METHODS
   *********************/

  Record.prototype.contentFor = async function(args) {
    let content = {}

    for (let [token, field] of Object.entries(args)) {
      let name = field.name
      let params = field.params
      let value, directive

      if ( Utils.has(SPECIAL_FIELDS, name)) {
        value = this.get(name.slice(1))
        params = Utils.assign({}, SPECIAL_FIELDS[name], params)
        
        if (params.type) {
          directive = vapid.directive(params)
          content[token] = directive.render(value)
        } else {
          content[token] = value
        }
      } else {
        value = this.content[name]
        directive = vapid.directive(params)
        content[token] = await directive.render(value)
      }
    }

    return content
  }

  Record.prototype.previewContent = function(fieldName, section) {
    let directive = vapid.directive(section.fields[fieldName])
    let rendered = directive.preview(this.content[fieldName])

    return Utils.truncate(rendered, { length: 140 })
  }

  /*********************
  * CLASS CONSTANTS
  *********************/

  Record.SPECIAL_FIELDS = SPECIAL_FIELDS

  return Record
}