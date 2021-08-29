// dependencies
const http = require('http');
const { handleReqRes } = require('../helpers/handleReqRes');

// module-scaffolding

const server = {};

// configuration

server.config = {
  port: 3000,
};

// create server

server.init = () => {
  const createServer = http.createServer(server.handleReqRes);
  createServer.listen(server.config.port, () => {
    console.log(`server listening at port ${server.config.port}...`);
  });
};

// handle request response

server.handleReqRes = handleReqRes;

module.exports = server;
