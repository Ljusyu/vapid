#!/usr/bin/env node

const program = require('commander')

const pjson = require('../package.json')
const Site = require('../lib/site')
const Logger = require('../lib/logger')

// NEW
program
  .command('new <target>')
  .description('create a new project')
  .action((target) => {
    let site = new Site(target)

    try {
      site.localInitialize()
      Logger.info(`Project created.`)
      Logger.extra([
        'To start the development server now, run:',
        `  ${pjson.name} server ${target}`
      ])
    } catch (err) {
      Logger.error(err)
    }
  })

// SERVER
program
  .command('server')
  .description('start the development server')
  .action((target) => {
    // let server = new Server(target)
    
    Logger.info(`Starting the development server...`)
    Logger.extra([
      'View your site at http://localhost:4567',
      'Ctrl + C to quit'
    ])
  })

// DEPLOY
program
  .command('deploy')
  .description('deploy to Vapid\'s hosting service')
  .action((target) => {
    Logger.info(`DEPLOY`)
  })

// VERSION
program
  .command('version')
  .description('shows the version number')
  .action((target) => {
    Logger.extra(`Vapid ${program.version()}`)
  })

if (process.argv.slice(2).length) {
  program
    .version(pjson.version)
    .parse(process.argv)
} else {
  program.help()
}
