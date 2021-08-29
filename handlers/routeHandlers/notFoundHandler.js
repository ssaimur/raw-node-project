// module scaffolding
const handler = {};

handler.notFoundHandler = (requestProperties, callback) => {
  console.log(requestProperties);

  callback(404, {
    message: 'Did not find the route',
  });
};

module.exports = handler;
