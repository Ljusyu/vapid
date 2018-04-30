const { readFileSync } = require('fs');
const { resolve } = require('path');
const Template = require('../lib/template');

/*
 * Template.fromFile
 */
describe('.fromFile', () => {
  test('creates new instance from a file path', () => {
    const filePath = resolve(__dirname, 'files/basic.html');
    const template = Template.fromFile(filePath);
    const html = readFileSync(filePath, 'utf-8');

    expect(html).toEqual(template.html);
  });
});

/*
 * template.parse
 */
describe('#parse', () => {
  test('puts fields into separate branches', () => {
    const html = `
      {{name}}
      {{#section about}}
        {{name}}
      {{/section}}`;
    const tree = new Template(html).parse();

    expect(tree.general.fields.name).toEqual(expect.any(Object));
    expect(tree['section about'].fields.name).toEqual(expect.any(Object));
  });

  test('allow sections without keyword', () => {
    const withKeyword = new Template('{{#section about}}{{/section}}').parse();
    const withoutKeyword = new Template('{{#about}}{{/about}}').parse();

    expect(withKeyword['section about'].name).toEqual(withoutKeyword.about.name);
  });
});

/*
 * template.render
 */
describe('#render', () => {
  test('replaces tags with content', () => {
    const template = new Template('Hello, {{name}}.');
    const rendered = template.render({ general: { name: 'World' } });

    expect(rendered).toEqual('Hello, World.');
  });
});
