// dependencies
const https = require('https');
const querystring = require('querystring');
const { twilio } = require('./environments');

// module scaffolding
const notification = {};

// send sms to the user using twilio api
notification.sendTwilioSms = (phone, msg, callback) => {
  // input validation

  const userPhone =
    typeof phone === 'string' && phone.trim().length === 11
      ? phone.trim()
      : null;

  const userMsg =
    typeof msg === 'string' &&
    msg.trim().length > 0 &&
    msg.trim().length <= 1600
      ? msg.trim()
      : null;

  console.log({ userMsg, userPhone });

  if (userPhone && userMsg) {
    // configure the request payload
    const payload = {
      From: twilio.fromPhone,
      To: `+88${userPhone}`,
      Body: userMsg,
    };

    // stringify the request payload
    const stringifiedPayload = querystring.stringify(payload);

    // configure the request details
    const requestDetails = {
      hostname: 'api.twilio.com',
      method: 'POST',
      path: `/2010-04-01/Accounts/${twilio.accountSid}/Messages.json`,
      auth: `${twilio.accountSid}:${twilio.authToken}`,
      headers: {
        'Content-type': 'application/x-www-form-urlencoded',
      },
    };

    // instatiate the request object
    const req = https.request(requestDetails, (res) => {
      // get the statuscode
      const statusCode = res.statusCode;
      // check the statuscode
      if (statusCode === (200 || 201)) {
        callback(false);
      } else {
        callback(`The statuscode returned was ${statusCode}`);
      }
    });

    // handle error
    req.on('error', (err) => {
      callback(err);
    });

    req.write(stringifiedPayload);
    req.end();
  } else {
    callback('Given parameter is invalid');
  }
};

module.exports = notification;
