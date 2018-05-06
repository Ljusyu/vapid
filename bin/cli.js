#!/usr/bin/env node

const program = require('commander');
const inquirer = require('inquirer');

const { version } = require('../package.json');
const Deployer = require('../lib/deployer');
const Generator = require('../lib/generator');
const Logger = require('../lib/logger');
const Vapid = require('../lib/vapid');

function withVapid(fn) {
  return (target) => {
    try {
      const cwd = target instanceof program.Command ? process.cwd() : target;
      const vapid = new Vapid(cwd);
      fn(vapid);
    } catch (err) {
      Logger.error(err.message);
    }
  };
}

/**
 * new - copies the generator files to target directory
 *
 * @param {string} target
 */
program
  .command('new <target>')
  .description('create a new website')
  .action((target) => {
    Generator.copyTo(target);

    Logger.info('Site created.');
    Logger.extra([
      'To start the server now, run:',
      `  vapid start ${target}`,
    ]);
  });

/**
 * start - runs the web server
 *
 * @param {string} [target='.']
 */
program
  .command('start')
  .description('start the server')
  .action(withVapid(async (vapid) => {
    Logger.info(`Starting the ${vapid.env} server...`);
    await vapid.start();
    Logger.extra([
      `View your site at http://localhost:${vapid.config.port}`,
      'Ctrl + C to quit',
    ]);
  }));

/**
 * deploy - publishes the website to the hosting platform
 *
 * @param {string} [target='.']
 */
program
  .command('deploy')
  .description('deploy to Vapid\'s hosting service')
  .action(withVapid(async (vapid) => {
    const deployer = new Deployer(vapid.paths.root);

    if (!deployer.loggedIn) {
      Logger.info("Please enter your Vapid credentials, or visit vapid.com to signup.")
      const input = await inquirer.prompt([
        {
          type: 'input',
          name: 'email',
          message: 'Email:'
        },

        {
          type: 'password',
          name: 'password',
          message: 'Password:'
        }
      ]);
      deployer.login(input.email, input.password);
    }

    // Not sure why this isn't exiting naturally
    process.exit(0);
  }));

/**
 * version - prints the current Vapid version number
 */
program
  .version(`Vapid ${version}`, '-v, --version');

/**
 * catch all command - shows the help text
 */
program
  .command('*', { noHelp: true })
  .action(() => {
    Logger.error(`Command "${process.argv[2]}" not found.`);
    program.help();
  });

/**
 * Read args, or show help
 */
if (process.argv.slice(2).length) {
  program.parse(process.argv);
} else {
  program.help();
}
