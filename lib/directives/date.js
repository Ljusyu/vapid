const strftime = require('strftime')

module.exports = (vapid, Directive) => {

  class DateDirective extends Directive {
    static get DEFAULTS() {
      return {
        options: {
          format: "%B %e, %Y"
        }
      }
    }

    get template() {
      return `<input type="date" name="<%- name %>" <%- attrs %> value="<%- value %>">`
    }

    render(value) {
      let date = new Date(value)
      let utc = new Date(date.getTime() + date.getTimezoneOffset() * 60000)

      // TODO: Not super excited that I'll have to remember to _escape anytime this is overridden
      return !isNaN(date.getTime()) ? strftime(this.options.format, utc) : this._escape(value)
    }
  }

  return vapid.registerDirective('date', DateDirective)
}