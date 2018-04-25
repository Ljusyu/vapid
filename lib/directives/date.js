const strftime = require('strftime');
const Utils = require('../utils');

const DEFAULTS = {
  options: {
    format: '%B %e, %Y',
    time: false,
  },
};

module.exports = (vapid, Directive) => {
  class DateDirective extends Directive {
    static get DEFAULTS() {
      return DEFAULTS;
    }

    input(name, value) {
      const type = this.options.time ? 'datetime-local' : 'date';
      return `<input type="${type}" name="${name}" value="${value}" ${this.htmlAttrs}>`;
    }

    render(value) {
      const date = new Date(value);
      const utc = new Date((date.getTime() + date.getTimezoneOffset()) * 60000);
      let { format } = this.options;

      if (this.options.time && this.options.format === this.constructor.DEFAULTS.options.format) {
        format += ' %l:%M %p';
      }

      // TODO: Not super excited that I'll have to remember to _escape anytime this is overridden
      //       Maybe don't override, and instead universally apply a set of defined "filters"?
      return Utils.isNaN(date.getTime()) ? this._escape(value) : strftime(format, utc);
    }
  }

  return vapid.registerDirective('date', DateDirective);
};
