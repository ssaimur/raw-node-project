// dependencies
const data = require('../../lib/data');
const { hash } = require('../../helpers/utils');
const { randomString } = require('../../helpers/utils');
const { parseJSON } = require('../../helpers/utils');

// module scaffolding
const handler = {};

handler.tokenHandler = (requestProperties, callback) => {
  const acceptedMethods = ['get', 'post', 'put', 'delete'];
  if (acceptedMethods.indexOf(requestProperties.method) > -1) {
    handler._token[requestProperties.method](requestProperties, callback);
  } else {
    callback(405);
  }
};

handler._token = {};

// handle post method
handler._token.post = (requestProperties, callback) => {
  const phone =
    typeof requestProperties.body.phone === 'string' &&
    requestProperties.body.phone.trim().length === 11
      ? requestProperties.body.phone
      : null;

  const password =
    typeof requestProperties.body.password === 'string' &&
    requestProperties.body.password.trim().length > 0
      ? requestProperties.body.password
      : null;

  if (phone && password) {
    data.read('users', phone, (err, userData) => {
      const hashedPassword = hash(password);
      if (hashedPassword === parseJSON(userData).password) {
        const tokenId = randomString(20);
        const expiresIn = Date.now() + 3 * 24 * 60 * 60 * 1000;
        const tokenObj = {
          id: tokenId,
          expiresIn,
          phone,
        };
        data.create('tokens', tokenId, tokenObj, (err) => {
          if (!err) {
            callback(200, tokenObj);
          } else {
            callback(500, { error: 'Internal server error' });
          }
        });
      } else {
        callback(400, { error: 'Password is invalid' });
      }
    });
  } else {
    callback(400, { error: 'Bad request' });
  }
};

// handle get method
handler._token.get = (requestProperties, callback) => {
  // check if the token number is a valid bangladeshi number
  const token =
    typeof requestProperties.queryStringObj.id === 'string' &&
    requestProperties.queryStringObj.id.trim().length === 20
      ? requestProperties.queryStringObj.id
      : null;

  // run the fucntion when phone number is valid
  if (token) {
    data.read('tokens', token, (err, tokenData) => {
      if (!err) {
        const token = parseJSON(tokenData);
        callback(200, token);
      } else {
        callback(404, { error: 'token does not exist' });
      }
    });
  } else {
    callback(403, { error: 'token number is not valid' });
  }
};

// handle update method
handler._token.put = (requestProperties, callback) => {
  const id =
    typeof requestProperties.body.id === 'string' &&
    requestProperties.body.id.trim().length === 20
      ? requestProperties.body.id
      : null;

  const extend =
    typeof requestProperties.body.extend === 'boolean' &&
    requestProperties.body.extend
      ? requestProperties.body.extend
      : null;

  if (id && extend) {
    data.read('tokens', id, (err, tokenData) => {
      if (!err) {
        const tokenObj = parseJSON(tokenData);
        if (tokenObj.expiresIn > Date.now()) {
          tokenObj.expiresIn = Date.now() + 3 * 24 * 60 * 60 * 1000;
          data.update('tokens', id, tokenObj, (err) => {
            if (!err) {
              callback(200, { message: 'Token was successfully updated' });
            } else {
              callback(500, { error: 'Internal server error' });
            }
          });
        } else {
          callback(400, { error: 'token expired' });
        }
      } else {
        callback(404, { error: 'Token not found' });
      }
    });
  } else {
    callback(400, { error: 'Bad request' });
  }
};

// handle delete method
handler._token.delete = (requestProperties, callback) => {
  // check if the token is valid
  const id =
    typeof requestProperties.queryStringObj.id === 'string' &&
    requestProperties.queryStringObj.id.trim().length === 20
      ? requestProperties.queryStringObj.id
      : null;

  // run the fucntion when phone number is valid
  if (id) {
    data.read('tokens', id, (err) => {
      if (!err) {
        data.delete('tokens', id, (err) => {
          if (!err) {
            callback(200, { message: 'Token was successfully deleted' });
          } else {
            callback(500, { error: 'Internal server error' });
          }
        });
      } else {
        callback(404, { error: 'Token does not exist' });
      }
    });
  } else {
    callback(403, { error: 'Token is not valid' });
  }
};

// verify token
handler._token.verify = (id, phone, callback) => {
  // check if the token is valid\
  data.read('tokens', id, (err, tokenData) => {
    if (!err) {
      if (
        parseJSON(tokenData).phone === phone &&
        parseJSON(tokenData).expiresIn > Date.now()
      ) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

module.exports = handler;
