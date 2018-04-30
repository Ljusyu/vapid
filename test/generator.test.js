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
    _removeTarget();
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

function _removeTarget() {
  fs.readdirSync(target).forEach((file) => {
    const path = join(target, file);
    if (fs.lstatSync(curPath).isDirectory()) {
      removeDir(path);
    } else {
      fs.unlinkSync(path);
    }
  });

  fs.rmdirSync(target);
}
