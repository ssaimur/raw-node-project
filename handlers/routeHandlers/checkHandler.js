// dependencies
const data = require('../../lib/data');
const { randomString } = require('../../helpers/utils');
const { parseJSON } = require('../../helpers/utils');
const { _token } = require('./tokenHandler');
const { maxChecks } = require('../../helpers/environments');

// module scaffolding
const handler = {};

handler.checkHandler = (requestProperties, callback) => {
  const acceptedMethods = ['get', 'post', 'put', 'delete'];
  if (acceptedMethods.indexOf(requestProperties.method) > -1) {
    handler._check[requestProperties.method](requestProperties, callback);
  } else {
    callback(405);
  }
};

handler._check = {};

// handle post method
handler._check.post = (requestProperties, callback) => {
  // validate inputs
  const protocol =
    typeof requestProperties.body.protocol === 'string' &&
    ['http', 'https'].indexOf(requestProperties.body.protocol) > -1
      ? requestProperties.body.protocol
      : null;

  const url =
    typeof requestProperties.body.url === 'string' &&
    requestProperties.body.url.trim().length > 0
      ? requestProperties.body.url
      : null;

  const method =
    typeof requestProperties.body.method === 'string' &&
    ['GET', 'POST', 'PUT', 'DELETE'].indexOf(requestProperties.body.method) > -1
      ? requestProperties.body.method
      : null;

  const successCodes =
    typeof requestProperties.body.successCodes === 'object' &&
    requestProperties.body.successCodes instanceof Array
      ? requestProperties.body.successCodes
      : null;

  const timeoutSeconds =
    typeof requestProperties.body.timeoutSeconds === 'number' &&
    requestProperties.body.timeoutSeconds % 1 === 0 &&
    requestProperties.body.timeoutSeconds >= 1 &&
    requestProperties.body.timeoutSeconds <= 5
      ? requestProperties.body.timeoutSeconds
      : null;

  if (protocol && url && method && successCodes && timeoutSeconds) {
    // check the token if it is valid
    const token =
      typeof requestProperties.headersObj.token === 'string'
        ? requestProperties.headersObj.token
        : null;

    data.read('tokens', token, (err, tokenData) => {
      if (!err && tokenData) {
        const userPhone = parseJSON(tokenData).phone;
        //  lookup the user data
        data.read('users', userPhone, (err, userData) => {
          if (!err && userData) {
            _token.verify(token, userPhone, (isTokenValid) => {
              if (isTokenValid) {
                const userObj = parseJSON(userData);
                const userChecks =
                  typeof userObj.checks === 'object' &&
                  userObj.checks instanceof Array
                    ? userObj.checks
                    : [];
                if (userChecks.length < maxChecks) {
                  const checkId = randomString(20);
                  const checkObj = {
                    id: checkId,
                    userPhone,
                    protocol,
                    url,
                    method,
                    successCodes,
                    timeoutSeconds,
                  };

                  // save the object
                  data.create('checks', checkId, checkObj, (err) => {
                    if (!err) {
                      // add checkId to the users object
                      userObj.checks = userChecks;
                      userObj.checks.push(checkId);

                      // save the new user data
                      data.update('users', userPhone, userObj, (err) => {
                        if (!err) {
                          // return the obect to the user
                          callback(200, checkObj);
                        } else {
                          callback(500, { error: 'Internal server error' });
                        }
                      });
                    } else {
                      callback(500, { error: 'Internal server error' });
                    }
                  });
                } else {
                  callback();
                }
              } else {
                callback(401, { error: 'Unauthorized' });
              }
            });
          } else {
            callback(404, { error: 'User not found' });
          }
        });
      } else {
        callback(401, { error: 'Invalid token' });
      }
    });
  } else {
    callback(400, { error: 'Bad request' });
  }
};

// handle get method
handler._check.get = (requestProperties, callback) => {
  // validatae id
  const id =
    typeof requestProperties.queryStringObj.id === 'string' &&
    requestProperties.queryStringObj.id.trim().length === 20
      ? requestProperties.queryStringObj.id
      : null;

  if (id) {
    // lookup the check
    data.read('checks', id, (err, checkData) => {
      if (!err && checkData) {
        const token =
          typeof requestProperties.headersObj.token === 'string'
            ? requestProperties.headersObj.token
            : null;

        // verify token
        _token.verify(token, parseJSON(checkData).userPhone, (isTokenValid) => {
          if (isTokenValid) {
            callback(200, parseJSON(checkData));
          } else {
            callback(401, { error: 'Unauthorized' });
          }
        });
      } else {
        callback(404, { error: 'Checks not found' });
      }
    });
  } else {
    callback(400, { error: 'ID is not valid' });
  }
};

// handle update method
handler._check.put = (requestProperties, callback) => {
  // validate id and all the inputs

  const id =
    typeof requestProperties.body.id === 'string' &&
    requestProperties.body.id.trim().length === 20
      ? requestProperties.body.id
      : null;

  const protocol =
    typeof requestProperties.body.protocol === 'string' &&
    ['http', 'https'].indexOf(requestProperties.body.protocol) > -1
      ? requestProperties.body.protocol
      : null;

  const url =
    typeof requestProperties.body.url === 'string' &&
    requestProperties.body.url.trim().length > 0
      ? requestProperties.body.url
      : null;

  const method =
    typeof requestProperties.body.method === 'string' &&
    ['GET', 'POST', 'PUT', 'DELETE'].indexOf(requestProperties.body.method) > -1
      ? requestProperties.body.method
      : null;

  const successCodes =
    typeof requestProperties.body.successCodes === 'object' &&
    requestProperties.body.successCodes instanceof Array
      ? requestProperties.body.successCodes
      : null;

  const timeoutSeconds =
    typeof requestProperties.body.timeoutSeconds === 'number' &&
    requestProperties.body.timeoutSeconds % 1 === 0 &&
    requestProperties.body.timeoutSeconds >= 1 &&
    requestProperties.body.timeoutSeconds <= 5
      ? requestProperties.body.timeoutSeconds
      : null;

  console.log({ id, protocol, url, method, successCodes, timeoutSeconds });

  if (id) {
    if (protocol || url || method || successCodes || timeoutSeconds) {
      data.read('checks', id, (err, checkData) => {
        if (!err && checkData) {
          const checkObject = parseJSON(checkData);
          const token =
            typeof requestProperties.headersObj.token === 'string'
              ? requestProperties.headersObj.token
              : null;

          _token.verify(token, checkObject.userPhone, (isTokenValid) => {
            if (isTokenValid) {
              if (protocol) {
                checkObject.protocol = protocol;
              }

              if (url) {
                checkObject.url = url;
              }

              if (method) {
                checkObject.method = method;
              }

              if (successCodes) {
                checkObject.successCodes = successCodes;
              }

              if (timeoutSeconds) {
                checkObject.timeoutSeconds = timeoutSeconds;
              }

              data.update('checks', id, checkObject, (err) => {
                if (!err) {
                  callback(200, { message: 'Check successfully updated' });
                } else {
                  callback(500, { error: 'Internal server error' });
                }
              });
            } else {
              callback(401, { error: 'Unauthorized' });
            }
          });
        } else {
          callback(404, { error: 'Check not available' });
        }
      });
    } else {
      callback(400, { error: 'Please provide at least one field to update' });
    }
  } else {
    callback(400, { error: 'Bad request' });
  }
};

// handle delete method
handler._check.delete = (requestProperties, callback) => {
  // validatae id
  const id =
    typeof requestProperties.queryStringObj.id === 'string' &&
    requestProperties.queryStringObj.id.trim().length === 20
      ? requestProperties.queryStringObj.id
      : null;

  if (id) {
    // lookup the check
    data.read('checks', id, (err, checkData) => {
      if (!err && checkData) {
        const token =
          typeof requestProperties.headersObj.token === 'string'
            ? requestProperties.headersObj.token
            : null;

        // verify token
        console.log(token);
        _token.verify(token, parseJSON(checkData).userPhone, (isTokenValid) => {
          if (isTokenValid) {
            // delete check
            data.delete('checks', id, (err) => {
              if (!err) {
                data.read(
                  'users',
                  parseJSON(checkData).userPhone,
                  (err, userData) => {
                    // parse userData
                    const userObject = parseJSON(userData);
                    if (!err && userData) {
                      // check the usercheck
                      const userChecks =
                        typeof userObject.checks === 'object' &&
                        userObject.checks instanceof Array
                          ? userObject.checks
                          : [];

                      // take the position of userChecks
                      const checkPosition = userChecks.indexOf(id);
                      // console.log({ checkPosition, userChecks, id });
                      if (checkPosition > -1) {
                        userChecks.splice(checkPosition, 1);
                        // resave the data
                        userObject.checks = userChecks;
                        // console.log({ userObject, userChecks });
                        data.update(
                          'users',
                          userObject.phone,
                          userObject,
                          (err) => {
                            if (!err) {
                              callback(200, {
                                message: 'Check successfully deleted',
                              });
                            } else {
                              callback(500, { error: 'Internal server error' });
                            }
                          }
                        );
                      } else {
                        callback(500, { error: 'Internal server error 3' });
                      }
                    } else {
                      callback(500, { error: 'Internal server error 2' });
                    }
                  }
                );
              } else {
                callback(500, { error: 'Internal server error 1' });
              }
            });
          } else {
            callback(401, { error: 'Unauthorized' });
          }
        });
      } else {
        callback(404, { error: 'Checks not found' });
      }
    });
  } else {
    callback(400, { error: 'ID is not valid' });
  }
};

module.exports = handler;
