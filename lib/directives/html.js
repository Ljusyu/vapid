module.exports = (vapid, Directive) => {
  return vapid.registerDirective('html', {
    input(name, value) {
      return `<textarea name="content[${name}]">${value}</textarea>`
    }
  })
}