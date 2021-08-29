// dependencies
const data = require('../../lib/data');
const { hash } = require('../../helpers/utils');
const { parseJSON } = require('../../helpers/utils');
const { _token } = require('./tokenHandler');

// module scaffolding
const handler = {};

handler.userHandler = (requestProperties, callback) => {
  const acceptedMethods = ['get', 'post', 'put', 'delete'];
  if (acceptedMethods.indexOf(requestProperties.method) > -1) {
    handler._users[requestProperties.method](requestProperties, callback);
  } else {
    callback(405);
  }
};

handler._users = {};

// handle post method
handler._users.post = (requestProperties, callback) => {
  const firstName =
    typeof requestProperties.body.firstName === 'string' &&
    requestProperties.body.firstName.trim().length > 0
      ? requestProperties.body.firstName
      : null;

  const lastName =
    typeof requestProperties.body.lastName === 'string' &&
    requestProperties.body.lastName.trim().length > 0
      ? requestProperties.body.lastName
      : null;

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

  const tosAgreement =
    typeof requestProperties.body.tosAgreement === 'boolean' &&
    requestProperties.body.tosAgreement
      ? requestProperties.body.tosAgreement
      : null;

  if (firstName && lastName && phone && password && tosAgreement) {
    data.read('users', phone, (err) => {
      if (err) {
        let userObj = {
          firstName,
          lastName,
          phone,
          password: hash(password),
          tosAgreement,
        };

        // create the user
        data.create('users', phone, userObj, (err) => {
          if (!err) {
            callback(200, { message: 'user was created successfully' });
          } else {
            callback(500, { error: 'could not create user' });
          }
        });
      } else {
        callback(500, { error: 'Internal server problem' });
      }
    });
  } else {
    callback(403, { error: 'bad request' });
  }
};

// handle get method
handler._users.get = (requestProperties, callback) => {
  // check if the phone number is a valid bangladeshi number
  const phone =
    typeof requestProperties.queryStringObj.phone === 'string' &&
    requestProperties.queryStringObj.phone.trim().length === 11
      ? requestProperties.queryStringObj.phone
      : null;

  // run the fucntion when phone number is valid
  if (phone) {
    // verify token
    const token =
      typeof requestProperties.headersObj.token === 'string'
        ? requestProperties.headersObj.token
        : null;

    _token.verify(token, phone, (bool) => {
      if (bool) {
        data.read('users', phone, (err, userData) => {
          if (!err) {
            const { password, ...rest } = parseJSON(userData);
            callback(200, { user: rest });
          } else {
            callback(404, { error: 'user does not exist' });
          }
        });
      } else {
        callback(401, { error: 'User unauthenticated' });
      }
    });
  } else {
    callback(403, { error: 'Phone number is not valid' });
  }
};

// handle update method
handler._users.put = (requestProperties, callback) => {
  const firstName =
    typeof requestProperties.body.firstName === 'string' &&
    requestProperties.body.firstName.trim().length > 0
      ? requestProperties.body.firstName
      : null;

  const lastName =
    typeof requestProperties.body.lastName === 'string' &&
    requestProperties.body.lastName.trim().length > 0
      ? requestProperties.body.lastName
      : null;

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

  if (phone) {
    if (firstName || lastName || password) {
      const token =
        typeof requestProperties.headersObj.token === 'string'
          ? requestProperties.headersObj.token
          : null;

      _token.verify(token, phone, (bool) => {
        if (bool) {
          data.read('users', phone, (err, user) => {
            const userData = { ...parseJSON(user) };
            if (!err && user) {
              if (firstName) {
                userData.firstName = firstName;
              }
              if (lastName) {
                userData.lastName = lastName;
              }
              if (password) {
                userData.password = hash(password);
              }
              data.update('users', phone, userData, (err) => {
                if (!err) {
                  callback(200, { message: 'User was updated successfully' });
                } else {
                  callback(500, { error: 'Internal server error' });
                }
              });
            } else {
              callback(400, { error: 'Your phone number is not registered' });
            }
          });
        } else {
          callback(401, { error: 'User unauthenticated' });
        }
      });
    }
  } else {
    callback(400, { error: 'Invalid phone number' });
  }
};

// handle delete method
handler._users.delete = (requestProperties, callback) => {
  // check if the phone number is a valid bangladeshi number
  const phone =
    typeof requestProperties.queryStringObj.phone === 'string' &&
    requestProperties.queryStringObj.phone.trim().length === 11
      ? requestProperties.queryStringObj.phone
      : null;

  // run the fucntion when phone number is valid
  if (phone) {
    // verify token
    const token =
      typeof requestProperties.headersObj.token === 'string'
        ? requestProperties.headersObj.token
        : null;

    _token.verify(token, phone, (bool) => {
      if (bool) {
        data.read('users', phone, (err, user) => {
          if (!err) {
            data.delete('users', phone, (err) => {
              if (!err) {
                callback(200, { message: 'User was successfully deleted' });
              } else {
                callback(500, { error: 'Internal server error' });
              }
            });
          } else {
            callback(404, { error: 'user does not exist' });
          }
        });
      } else {
        callback(401, { error: 'User unauthenticated' });
      }
    });
  } else {
    callback(403, { error: 'Phone number is not valid' });
  }
};

module.exports = handler;
