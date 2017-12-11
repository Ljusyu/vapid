#!/usr/bin/env node

const pjson = require('../package.json')
const program = require('commander')

// NEW
program
  .command('new <target_dir>')
  .description('create a new project')
  .action((target) => {
    console.log(`NEW: ${target}`)
  })

// SERVER
program
  .command('server')
  .description('start the development server')
  .action((target) => {
    console.log(`SERVER`)
  })

// DEPLOY
program
  .command('deploy')
  .description('deploy to Vapid\'s hosting service')
  .action((target) => {
    console.log(`DEPLOY`)
  })

// VERSION
program
  .command('version')
  .description('shows the version number')
  .action((target) => {
    console.log(`Vapid ${program.version()}`)
  })

if (!process.argv.slice(2).length) {
  program.help()
}

program
  .version(pjson.version)
  .parse(process.argv)
