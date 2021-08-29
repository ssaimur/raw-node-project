// dependencies
const crypto = require('crypto');
const environments = require('./environments');

// module scaffolding
const utils = {};

// parse JSON string into object

utils.parseJSON = (jsonString) => {
  let output;
  try {
    output = JSON.parse(jsonString);
  } catch (err) {
    output = {};
  }
  return output;
};

// hashing string
utils.hash = (str) => {
  if (typeof str === 'string' && str.length > 0) {
    const hash = crypto
      .createHmac('sha256', environments.secrecKey)
      .update(str)
      .digest('hex');
    return hash;
  } else {
    return null;
  }
};

// generating random string
utils.randomString = (strLength) => {
  const length =
    typeof strLength === 'number' && strLength > 0 ? strLength : null;

  if (length) {
    const possibleCharacters =
      'abcdefghijklmnopqustuvqxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let output = '';
    for (let i = 1; i <= strLength; i++) {
      const randomCharacter = possibleCharacters.charAt(
        Math.floor(Math.random() * possibleCharacters.length)
      );

      output += randomCharacter;
    }
    return output;
  }

  return null;
};

module.exports = utils;
