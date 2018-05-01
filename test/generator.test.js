const fs = require('fs');
const tmp = require('tmp');
const { join } = require('path');

const Generator = require('../lib/generator');

let target;

describe('.copyTo', () => {
  beforeAll(() => {
    target = tmp.tmpNameSync();
    Generator.copyTo(target);
  });

  afterAll(() => {
    _removeTarget(target);
  });

  test('generates a secret key', () => {
    const env = fs.readFileSync(join(target, '.env'), 'utf-8');
    expect(env).toMatch(/SECRET_KEY=[a-f0-9]{128}/);
  });

  test('shows an error if the target already exists', () => {
    function copyAgain() {
      Generator.copyTo(target);
    }

    expect(copyAgain).toThrowErrorMatchingSnapshot();
  });
});

function _removeTarget(path) {
  fs.readdirSync(path).forEach((file) => {
    const filePath = join(path, file);
    if (fs.lstatSync(filePath).isDirectory()) {
      _removeTarget(filePath);
    } else {
      fs.unlinkSync(path);
    }
  });

  fs.rmdirSync(path);
}
