#!/usr/bin/env node

const dotenv = require('dotenv')
const { resolve } = require('path')
const program = require('commander')

const { version } = require('../package.json')
const Logger = require('../lib/logger')
const Vapid = require('../lib/vapid')

function actionHandler(fn, requirePJSON = true) {
  return (target) => {
    let opts

    try {
      target = target instanceof program.Command ? process.cwd() : target
      opts = requirePJSON && require(resolve(target, 'package.json')).vapid || {}

      dotenv.config({ path: resolve(target, '.env') })
      global.vapid = new Vapid(target, opts)

      fn(target)
    } catch (err) {
      Logger.error(err)
    }
  }
}

// NEW
program
  .command('new <target>')
  .description('create a new site')
  .action(actionHandler(target => {
    vapid.initSite()
    vapid.log.info('Site created.')
    vapid.log.extra([
      'To start the development server now, run:',
      `  vapid-cli server ${target}`
    ])
  }, false))

// SERVER
program
  .command('server')
  .description('start the server')
  .action(actionHandler(async target => {
    vapid.log.info(`Starting the ${vapid.env} server...`)
    await vapid.startServer()
    vapid.log.extra([
      `View your site at http://localhost:${vapid.config.port}`,
      'Ctrl + C to quit'
    ]);
  }))

// DEPLOY
program
  .command('deploy')
  .description('deploy to Vapid\'s hosting service')
  .action(actionHandler(target => {
    let tjson = require(resolve(target, 'package.json'))
    let deploy = tjson.scripts.deploy

    vapid.log.info("Deploying...")
    
    if (deploy) {
      require('child_process').exec(deploy, (err, stdout, stderr) => {
        if (err) {
          vapid.log.error(stderr)
          return
        }

        vapid.log.extra(stdout)
      })
    } else {
      vapid.log.extra([
        `Vapid hosting is currently in private beta.`,
        'To request access, visit https://www.vapid.com'
      ]);
    }
  }))

// VERSION
program
  .command('version')
  .description('shows the version number')
  .action(() => {
    Logger.extra(`Vapid ${program.version()}`)
  })

// CATCH-ALL
program
  .command('*', { noHelp: true })
  .action(() => {
    Logger.error(`Command "${process.argv[2]}" not found.`)
    program.help()
  })

if (process.argv.slice(2).length) {
  program
    .version(version)
    .parse(process.argv)
} else {
  program.help()
}
