// TODO: Clean this up. Lots of hacky stuff in here
const fs = require('fs');
const Boom = require('boom');
const Goatee = require('./goatee');
const Utils = require('../utils');

const QUOTES = ['"', "'"];

// TODO: Don't need two of these
const BRANCH_REGEX = /^(?:(section|form)\s)?(\w+)(.*)/i;
const LEAF_REGEX = /^(\w+)(.*)/i;

class Template {
  constructor(file) {
    // Worried about this getting too big, so it's being cleared.
    Goatee.clearCache();
    this.html = fs.readFileSync(file, 'utf8');
  }

  render(content = {}) {
    const body = !Utils.isEmpty(content.general) ? _wrapHTML(this.html) : this.html;
    let rendered = Goatee.render(body, content);

    // TODO
    rendered = _bustCache(rendered);

    return rendered;
  }

  parse() {
    let tokens;

    try {
      tokens = Goatee.parse(this.html);
    } catch (err) {
      throw Boom.boomify(err, {
        message: 'Bad template syntax',
      });
    }

    return this.walk({}, tokens);
  }

  /* eslint-disable no-param-reassign */
  walk(tree, branch, branchToken = 'general') {
    tree[branchToken] = tree[branchToken] || _initBranch(branchToken);

    branch.forEach((leaf) => {
      switch (leaf[0]) {
        case 'name': {
          const leafToken = leaf[1];
          /* eslint-disable-next-line max-len */
          const leafValue = Utils.merge(tree[branchToken].fields[leafToken] || {}, _parseLeafToken(leaf[1]));
          tree[branchToken].fields[leafToken] = leafValue;
          break;
        }
        case '#': {
          const [, keyword] = leaf[1].toLowerCase().match(LEAF_REGEX);
          const token = Utils.includes(Goatee.CONDITIONALS, keyword) ? branchToken : leaf[1];
          this.walk(tree, leaf[4], token);
          break;
        }
        default: {
          // Do nothing
        }
      }
    });

    return tree;
  }
  /* eslint-enable no-param-reassign */
}

/*******************
 * PRIVATE METHODS
 *******************/

function _initBranch(branchToken) {
  const [, keyword, name, remainder] = branchToken.match(BRANCH_REGEX);

  return {
    name: name.toLowerCase(),
    keyword,
    params: _parseParams(remainder),
    fields: {},
  };
}

function _parseLeafToken(token) {
  const [, name, remainder] = token.match(LEAF_REGEX);

  return {
    name: name.toLowerCase(),
    params: _parseParams(remainder),
  };
}

function _parseParams(str) {
  const params = {};
  // TODO: Need to improve/fix this to handle all kinds of quotes/escapes
  const args = str.match(/(?:[\w.]+|"[^=]*)\s*=\s*(?:[\w,-]+|"[^"]*")/g) || [];

  args.forEach((a) => {
    const [key, val] = a.split('=');
    params[key.toLowerCase()] = _stripQuotes(val);
  });

  return params;
}

function _stripQuotes(str) {
  const lastIndex = str.length - 1;
  const first = str.charAt(0);
  const last = str.charAt(lastIndex);

  if (first === last && QUOTES.indexOf(first) >= 0) {
    return str.substring(1, lastIndex);
  }
  return str;
}

function _wrapHTML(html) {
  return `{{#general}}${html}{{/general}}`;
}

function _bustCache(html) {
  return html;
}

module.exports = Template;
