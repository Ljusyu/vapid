const DEFAULTS = {
  options: {
    unfurl: false
  }
}

module.exports = (vapid, Directive) => {
  class LinkDirective extends Directive {
    static get DEFAULTS() {
      return DEFAULTS
    }

    get template() {
      return `<input type="url" name="<%- name %>" value="<%- value %>">`
    }

    render(value) {
      if (value != null && this.options.unfurl) {
        return _oembed(value)
      } else {
        return value
      }
    }
  }

  async function _oembed(value) {
    try {
      let result = await require('unfurl.js')(value)
      return result.oembed.html
    } catch (err) {
      return `<a href="${value}">${value}</a>`
    }
  }

  return vapid.registerDirective('link', LinkDirective)
}
