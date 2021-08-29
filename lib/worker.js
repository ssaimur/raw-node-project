// dependencies
const url = require('url');
// const { parse } = require('path');
const http = require('http');
const https = require('https');
const { parseJSON } = require('../helpers/utils');
const data = require('../lib/data');
const { sendTwilioSms } = require('../helpers/notification');
// module-scaffolding
const worker = {};

// lookup all the checks
worker.gatherAllChecks = () => {
  //get all the checks
  data.list('checks', (err, checkFiles) => {
    if (!err && checkFiles && checkFiles.length > 0) {
      checkFiles.forEach((file) => {
        // read the check data
        data.read('checks', file, (err, checkData) => {
          if (!err && checkData) {
            worker.validateCheckData(parseJSON(checkData));
          } else {
            console.log({ error: 'Cannot read check files' });
          }
        });
      });
    } else {
      console.log({ error: err });
    }
  });
};

// validata check data
worker.validateCheckData = (checkData) => {
  const originalData = checkData;
  if (originalData && originalData.id) {
    // validate the check state
    originalData.state =
      typeof checkData.state === 'string' &&
      ['up', 'down'].indexOf(checkData.state) > -1
        ? checkData.state
        : 'down';

    // validtate the last checked
    originalData.lastChecked =
      typeof checkData.lastChecked === 'number' && checkData.lastChecked > 0
        ? checkData.lastChecked
        : null;

    // pass to the next proccess
    worker.performCheck(originalData);
  } else {
    console.log({ error: 'checkdata not avaiable' });
  }
};

// perfor the checks
worker.performCheck = (checkData) => {
  // prepare the initial check outcome
  const chekcOutcome = {
    error: false,
    resposeCode: null,
  };

  // check if it is already sent
  let outcomeSent = false;

  // parse the host name and the url from the checkdata
  const parsedUrl = url.parse(`${checkData.protocol}://${checkData.url}`, true);
  const { hostname } = parsedUrl;
  const { path } = parsedUrl;

  // construct the request
  const requestDetails = {
    protocol: `${checkData.protocol}:`,
    hostname,
    path,
    method: checkData.method.toUpperCase(),
    timeout: checkData.timeoutSeconds * 1000,
  };

  // protocol to send
  const protocolToSend = checkData.protocol === 'http' ? http : https;

  // make the request
  let req = protocolToSend.request(requestDetails, (res) => {
    // grab the status code
    const status = res.statusCode;

    // set the response code
    chekcOutcome.resposeCode = status;

    // check the out outcome if not sent then pass checkData to the next fuction
    if (!outcomeSent) {
      worker.proccessCheckOutcom(checkData, chekcOutcome);

      // set the outcome to true
      outcomeSent = true;
    }
  });

  // error event
  req.on('error', (e) => {
    // set the checkOutcome
    (chekcOutcome.error = true), (chekcOutcome.value = e);

    // check the out outcome if not sent then pass checkData to the next fuction
    if (!outcomeSent) {
      worker.proccessCheckOutcom(checkData, chekcOutcome);

      // set the outcome to true
      outcomeSent = true;
    }
  });

  // timeout event
  req.on('timeout', () => {
    // set the checkOutcome
    (chekcOutcome.error = true), (chekcOutcome.value = 'timeout');

    // check the out outcome if not sent then pass checkData to the next fuction
    if (!outcomeSent) {
      worker.proccessCheckOutcom(checkData, chekcOutcome);

      // set the outcome to true
      outcomeSent = true;
    }
  });

  // send the request
  req.end();
};

// proccess check outcome
worker.proccessCheckOutcom = (checkData, chekcOutcome) => {
  // check if the outcome is up or down
  const state =
    !chekcOutcome.error &&
    chekcOutcome.resposeCode &&
    checkData.successCodes.indexOf(chekcOutcome.resposeCode) > -1
      ? 'up'
      : 'down';

  // decide whether alert the user or not
  const alertWanted = !!(checkData.lastChecked && checkData.state !== state);

  // update the ckeck data
  const newCheckData = checkData;

  newCheckData.state = state;
  newCheckData.lastChecked = Date.now();

  // update the checkdata
  data.update('checks', newCheckData.id, newCheckData, (err) => {
    if (!err) {
      if (alertWanted) {
        // send the check data to the next proccess
        worker.alertUserToStatusChange(newCheckData);
      } else {
        console.log({ alert: 'alert not needed' });
      }
    } else {
      console.log({ error: `the error is ${{ err }}` });
    }
  });
};

// send notificatio to user as the state changes
worker.alertUserToStatusChange = (newCheckData) => {
  const msg = `Alert: your check for ${newCheckData.method.toUpperCase()} ${
    newCheckData.protocol
  }://${newCheckData.url} is currently ${newCheckData.state}`;

  sendTwilioSms(newCheckData, msg, (err) => {
    if (!err) {
      console.log(`message sent successfully ${{ msg }}`);
    } else {
      console.log({ error: `error sending messsage ${{ err }}` });
    }
  });
};

// set a timer to execute the loop per one mimute
worker.loop = () => {
  setInterval(() => {
    worker.gatherAllChecks();
  }, 1000 * 60);
};

// create worker and start
worker.init = () => {
  // gather all the checks
  worker.gatherAllChecks();

  // loop the worker to continue the check
  worker.loop();
};

module.exports = worker;
