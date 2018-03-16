module.exports = (vapid, Directive) => {
  return vapid.registerDirective('date', {
    template: '<input type="date" name="<%- name %>" <%- attributes %> value="<%- value %>">',
  })
}