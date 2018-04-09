const DEFAULTS = {
  attrs: {
    maxlength: undefined
  }
}

module.exports = (vapid, Directive) => {
  class TextDirective extends Directive {
    static get DEFAULTS() {
      return DEFAULTS
    }
  }

  return vapid.registerDirective('text', TextDirective)
}
