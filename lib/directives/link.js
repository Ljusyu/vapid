const unfurl = require('unfurl.js');
const Cache = require('../cache');

const cache = new Cache();
const DEFAULTS = {
  options: {
    unfurl: false,
  },
};

module.exports = (vapid, Directive) => {
  class LinkDirective extends Directive {
    static get DEFAULTS() {
      return DEFAULTS;
    }

    /* eslint-disable class-methods-use-this */
    input(name, value = '') {
      return `<input type="url" name="${name}" value="${value}">`;
    }

    preview(value) {
      return value;
    }
    /* eslint-enable class-methods-use-this */

    render(value) {
      if (value != null && this.options.unfurl) {
        return _oembed(value);
      }

      return value;
    }
  }

  async function _oembed(value) {
    let result = cache.get(value);

    if (result) {
      return result;
    }

    try {
      const unfurled = await unfurl(value);
      result = unfurled.oembed.html;
    } catch (err) {
      result = `<a href="${value}">${value}</a>`;
    }

    return cache.put(value, result);
  }

  return vapid.registerDirective('link', LinkDirective);
};
