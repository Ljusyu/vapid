#!/usr/bin/env node

const dotenv = require('dotenv');
const { resolve } = require('path');
const program = require('commander');
const childProcess = require('child_process');

const { version } = require('../package.json');
const Logger = require('../lib/logger');
const Vapid = require('../lib/vapid');

function actionHandler(fn, requirePJSON = true) {
  return (cwd) => {
    let opts;

    try {
      const target = cwd instanceof program.Command ? process.cwd() : cwd;
      /* eslint-disable-next-line global-require, import/no-dynamic-require */
      opts = (requirePJSON && require(resolve(target, 'package.json')).vapid) || {};

      dotenv.config({ path: resolve(target, '.env') });
      global.vapid = new Vapid(target, opts);

      fn(target);
    } catch (err) {
      Logger.error(err.message);
    }
  };
}

/**
 * new - copies the generator files to target directory
 * @param {string} target
 */
program
  .command('new <target>')
  .description('create a new website')
  .action(actionHandler((target) => {
    vapid.initSite();
    Logger.info('Site created.');
    Logger.extra([
      'To start the development server now, run:',
      `  vapid server ${target}`,
    ]);
  }, false));

/**
 * server - runs the web server
 * @param {string} [target='.']
 */
program
  .command('server')
  .description('start the server')
  .action(actionHandler(async () => {
    Logger.info(`Starting the ${vapid.env} server...`);
    await vapid.startServer();
    Logger.extra([
      `View your site at http://localhost:${vapid.config.port}`,
      'Ctrl + C to quit',
    ]);
  }));

/**
 * deploy - publishes the website to the hosting platform
 * @param {string} [target='.']
 */
program
  .command('deploy')
  .description('deploy to Vapid\'s hosting service')
  .action(actionHandler((target) => {
    /* eslint-disable-next-line global-require, import/no-dynamic-require */
    const tjson = require(resolve(target, 'package.json'));
    const { deploy } = tjson.scripts;

    Logger.info('Deploying...');

    if (deploy) {
      childProcess.exec(deploy, (err, stdout, stderr) => {
        if (err) {
          Logger.error(stderr);
          return;
        }

        Logger.extra(stdout);
      });
    } else {
      Logger.extra([
        'Vapid hosting is currently in private beta.',
        'To request access, visit https://www.vapid.com',
      ]);
    }
  }));

/**
 * version - prints the current Vapid version number
 */
program
  .command('version')
  .description('show the version number')
  .action(() => {
    Logger.extra(`Vapid ${version}`);
  });

/**
 * catch all command - shows the help text
 */
program
  .command('*', { noHelp: true })
  .action(() => {
    Logger.error(`Command "${process.argv[2]}" not found.`);
    program.help();
  });

if (process.argv.slice(2).length) {
  program.parse(process.argv);
} else {
  program.help();
}
