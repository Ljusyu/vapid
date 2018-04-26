const { readFileSync } = require('fs');
const { resolve } = require('path');
const Template = require('../lib/template');

const templates = {};

function createTemplate(name) {
  if (templates[name]) {
    return templates[name];
  }

  const filePath = resolve(__dirname, `files/${name}.html`);
  const template = new Template(filePath);
  templates[name] = template;
  return template;
}

describe('.contructor', () => {
  test('reads HTML from a file', () => {
    const template = createTemplate('basic');
    const html = readFileSync(resolve(__dirname, 'files/basic.html'), 'utf-8');

    expect(html).toEqual(template.html);
  });
});

describe('#parse', () => {
});

describe('#render', () => {
});
