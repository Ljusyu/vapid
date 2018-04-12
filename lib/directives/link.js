const cache = require('../cache')

const CACHE_UNFURL_PREFIX = 'unfurl-'

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

    input(name, value = "") {
      return `<input type="url" name="${name}" value="${value}">`
    }

    render(value) {
      if (value != null && this.options.unfurl) {
        return _oembed(value)
      } else {
        return value
      }
    }

    preview(value) {
      return value
    }
  }

  async function _oembed(value) {
    let cacheKey = `${CACHE_UNFURL_PREFIX}${value}`
    let result = cache.get(cacheKey)

    if (result) {
      return result
    } else {
      try {
        let unfurled = await require('unfurl.js')(value)
        result = unfurled.oembed.html
      } catch (err) {
        result = `<a href="${value}">${value}</a>`
      }

      return cache.put(cacheKey, result)
    }
  }

  return vapid.registerDirective('link', LinkDirective)
}
