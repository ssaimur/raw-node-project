// dependencies

const url = require('url');
const { StringDecoder } = require('string_decoder');
const routes = require('../routes');
const {
  notFoundHandler,
} = require('../handlers/routeHandlers/notFoundHandler');

const { parseJSON } = require('../helpers/utils');

// module scaffolding

const handler = {};

handler.handleReqRes = (req, res) => {
  // response handler
  // get the url and perse it

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');
  const method = req.method.toLowerCase();
  const queryStringObj = parsedUrl.query;
  const headersObj = req.headers;

  const decoder = new StringDecoder('utf-8');

  const requestProperties = {
    parsedUrl,
    path,
    trimmedPath,
    method,
    queryStringObj,
    headersObj,
  };

  const chosenHandler = routes[trimmedPath]
    ? routes[trimmedPath]
    : notFoundHandler;

  let realData = '';

  req.on('data', (buffer) => {
    realData += decoder.write(buffer);
  });

  req.on('end', () => {
    realData += decoder.end();

    requestProperties.body = parseJSON(realData);

    chosenHandler(requestProperties, (statusCode, payload) => {
      statusCode = typeof statusCode === 'number' ? statusCode : 500;
      payload = typeof payload === 'object' ? payload : {};

      const payloadString = JSON.stringify(payload);

      // send the response
      res.setHeader('content-type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);
    });

    // res.end('hello world');
  });
};

module.exports = handler;
