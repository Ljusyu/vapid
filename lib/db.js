const Datastore = require('nedb')
const path = require('path')

function loadDatabase(site) {
  const dbPath = path.resolve(site.localPath, 'db/development.db')
  return new Datastore({ filename: dbPath, autoload: true })
}

module.exports = loadDatabase
