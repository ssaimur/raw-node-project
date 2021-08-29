// module scaffolding
const environments = {};

environments.staging = {
  port: 3000,
  envName: 'staging',
  secrecKey: 'lksdljasdfjsadlfjlsd',
  maxChecks: 5,
  twilio: {
    fromPhone: '+17278885414',
    accountSid: 'AC8dd24832e41980e874426933711d2c79',
    authToken: '917d19985e42eb49744f8a3350baec54',
  },
};

environments.production = {
  port: 6000,
  envName: 'production',
  secrecKey: 'akjsdlfkjasdkajshdkj',
  maxChecks: 5,
  twilio: {
    fromPhone: '+17278885414',
    accountSid: 'AC8dd24832e41980e874426933711d2c79',
    authToken: '917d19985e42eb49744f8a3350baec54',
  },
};

currentEnvironment =
  typeof process.env.NODE_ENV === 'string' ? process.env.NODE_ENV : 'staging';

const environmentToExport =
  typeof environments[currentEnvironment] === 'object'
    ? environments[currentEnvironment]
    : environments.staging;

module.exports = environmentToExport;
