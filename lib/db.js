const path = require('path');
const Sequelize = require('sequelize');
const Umzug = require('umzug');
const Utils = require('./utils');

class Database {
  constructor(config) {
    this.config = Utils.merge({}, config, { operatorsAliases: Sequelize.Op });
    this.sequelize = _initSequelize.call(this);
    this.models = _defineModels.call(this);
    this.migrations = _initMigrations.call(this);
  }

  async connect() {
    await this.sequelize.sync();
    await this.migrations.up();
  }

  async disconnect() {
    await this.sequelize.close();
  }
}

/*
 * PRIVATE METHODS
 */

function _defineModels() {
  const Section = this.sequelize.import('./models/section');
  const Record = this.sequelize.import('./models/record');
  const User = this.sequelize.import('./models/user');

  Section.hasMany(Record, { as: 'records' });
  Record.belongsTo(Section, { as: 'section' });

  return {
    Section,
    Record,
    User,
  };
}

function _initSequelize() {
  if (process.env.DATABASE_URL) {
    const dbURL = process.env.DATABASE_URL;
    const dialect = dbURL.split(':')[0];
    const config = Utils.merge(this.config, { dialect });

    return new Sequelize(dbURL, config);
  }

  return new Sequelize(this.config);
}

function _initMigrations() {
  return new Umzug({
    storage: 'sequelize',
    storageOptions: {
      sequelize: this.sequelize,
    },
    migrations: {
      params: [this.sequelize.getQueryInterface(), Sequelize],
      path: path.join(__dirname, 'migrations'),
      pattern: /\.js$/,
    },
  });
}

module.exports = Database;
