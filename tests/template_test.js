const { readFileSync } = require('fs');
const { resolve } = require('path');
const Template = require('../lib/template');

describe('.fromFile', () => {
  test('reads HTML from a file', () => {
    const filePath = resolve(__dirname, 'files/basic.html');
    const template = Template.fromFile(filePath);
    const html = readFileSync(filePath, 'utf-8');

    expect(html).toEqual(template.html);
  });
});

describe('#parse', () => {
});

describe('#render', () => {
});
