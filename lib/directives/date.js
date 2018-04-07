const strftime = require('strftime')

module.exports = (vapid, Directive) => {
  class DateDirective extends Directive {
    static get DEFAULTS() {
      return {
        options: {
          format: "%B %e, %Y",
          time: false
        }
      }
    }

    get template() {
      let type = this.options.time ? 'datetime-local' : 'date'
      return `<input type="${type}" name="<%- name %>" <%- attrs %> value="<%- value %>">`
    }

    render(value) {
      let date = new Date(value)
      let utc = new Date(date.getTime() + date.getTimezoneOffset() * 60000)
      let format = this.options.format

      if (this.options.time && this.options.format == this.constructor.DEFAULTS.options.format) {
        format += " %l:%M %p"
      }

      // TODO: Not super excited that I'll have to remember to _escape anytime this is overridden
      //       Maybe don't override, and instead universally apply a set of defined "filters"?
      return !isNaN(date.getTime()) ? strftime(format, utc) : this._escape(value)
    }
  }

  return vapid.registerDirective('date', DateDirective)
}