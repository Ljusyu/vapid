const expect = require('chai').expect
const Template = require('../lib/template')

describe('Template', () => {
  it('should parse directives', function () {
    let template = new Template('')

    expect(template.parse()).to.deep.equal({})
  })

  it('should render html', function () {
    let html = 'HTML'
    let template = new Template(html)

    expect(template.render()).to.equal(html)
  })
})
