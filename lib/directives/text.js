module.exports = (vapid, Directive) => {
  return vapid.registerDirective('text', Directive)
}