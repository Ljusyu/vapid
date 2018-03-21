module.exports = (vapid, Directive) => {

  class DateDirective extends Directive {
    get template() {
      return `<input type="date" name="<%- name %>" <%- attrs %> value="<%- value %>">`
    }
  }

  return vapid.registerDirective('date', DateDirective)
}