module.exports = (vapid, Directive) => {
  return vapid.registerDirective('html', {
    template: options => {
      return '<textarea name="<%- name %>" <%- attributes %>><%- value %></textarea>'
    },
    
    attributes: {
      rows: undefined
    },
    
    options: {
      editor: true
    }
  })
}