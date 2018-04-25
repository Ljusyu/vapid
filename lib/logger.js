require('colors');
const Utils = require('./utils');

const arrow = '==>';

/* eslint-disable no-console */
class Logger {
  /**
   * @param {string} str
   */
  static info(str) {
    console.log(`${arrow.blue} ${str}`.bold);
  }

  /**
   * @param {string} str
   */
  static warn(str) {
    console.log(`WARNING: ${str}`.bold.yellow);
  }

  /**
   * @param {string} err
   */
  static error(err) {
    console.log(`ERROR: ${err}`.bold.red);
  }

  /**
   * @param {string|array} lines
   */
  static extra(lines) {
    Utils.castArray(lines).forEach((line) => {
      console.log(line);
    });
  }
}
/* eslint-enable no-console */

module.exports = Logger;
