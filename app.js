// dependencies
const server = require('./lib/server');
const worker = require('./lib/worker');
const url = require('url');
// module-scaffolding

const app = {};

app.init = () => {
  // start the server
  server.init();
  // start the worker
  worker.init();
};

app.init();
