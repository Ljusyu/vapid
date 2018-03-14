module.exports = (vapid, Directive) => {
  return vapid.registerDirective('date', {
    input(name, value) {
      return `<input type="date" name="content[${name}]" value="${value}">`
    }
  })
}