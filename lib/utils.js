const _ = require('lodash');
const checksum = require('md5-file');
const mkdirp = require('mkdirp');
const pluralize = require('pluralize');

const Utils = _;

/**
 * Helper functions, mostly an extension of Lodash
 */
Object.assign(Utils, {
  /**
   * Checksums a file
   *
   * @param {string} file - path to file
   * @return {string} checksum
   */
  checksum: checksum.sync,

  /**
   * Attempts to cast value to the correct type
   *
   * @param {string} val
   * @return {string|number|boolean}
   */
  coerceType: (val) => {
    try {
      return JSON.parse(val);
    } catch (err) {
      return val;
    }
  },

  /**
   * Tests to see if the string is pluralized
   *
   * @param {string} str
   * @return {boolean}
   */
  isPlural: pluralize.isPlural,

  /**
   * Create new directories recursively
   *
   * @param {string} path
   * @return {string} err - an error if necessary
   */
  mkdirp: mkdirp.sync,

  /**
   * An empty function
   */
  noop: () => {},

  /**
   * Pluralizes a word
   *
   * @param {string} word
   * @param {number} count - helps determine what, if any, plural to return
   * @return {string}
   */
  pluralize,

  /**
   * Singularize a word
   *
   * @param {string} word
   * @return {string}
   */
  singularize: function singularize(word) {
    return this.pluralize(word, 1);
  },
});

module.exports = Utils;
