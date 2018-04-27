const { execSync } = require('child_process');
const { join } = require('path');
const fs = require('fs');
const tmp = require('tmp');
const { version } = require('../package.json');

const bin = join(__dirname, '../bin/cli.js');
let target;

function cmd(args = '') {
  return execSync(`${bin} ${args}`, { encoding: 'utf-8' });
}

/*
 * Before / After
 */
beforeAll(() => {
  // TODO: This may change if Site does the actual target generation
  target = tmp.tmpNameSync();
  cmd(`new ${target}`);
});

afterAll(function removeDir() {
  fs.readdirSync(target).forEach((file) => {
    const path = join(target, file);
    if (fs.lstatSync(curPath).isDirectory()) {
      removeDir(path);
    } else {
      fs.unlinkSync(path);
    }
  });

  fs.rmdirSync(target);
});

/*
 * New
 */
describe('new', () => {
  test('generates a secret key', () => {
    const env = fs.readFileSync(join(target, '.env'), 'utf-8');
    expect(env).toMatch(/SECRET_KEY=[a-f0-9]{128}/);
  });

  test('shows an error if the target already exists', () => {
    expect(cmd(`new ${target}`)).toMatch(/ERROR/);
  });
});

/*
 * Server
 */
describe('server', () => {
  test.skip('starts the web server', () => {
  });
});

/*
 * Deploy
 */
describe('deploy', () => {
  test.skip('deploys to the website host', () => {
  });

  test.skip('allows overriding via package.json', () => {
  });
});

/*
 * Version
 */
describe('version', () => {
  test('prints the version number', () => {
    expect(cmd('-v')).toEqual(`Vapid ${version}\n`);
    expect(cmd('--version')).toEqual(`Vapid ${version}\n`);
  });
});

/*
 * Help
 */
describe('help', () => {
  test('if called explicitly', () => {
    expect(cmd('-h')).toMatch(/Usage: /);
    expect(cmd('--help')).toMatch(/Usage: /);
  });

  test('if no arguments are passed', () => {
    expect(cmd()).toMatch(/Usage: /);
  });

  test('if a non-existent command is issued', () => {
    expect(cmd('foo')).toMatch(/Usage: /);
  });
});
