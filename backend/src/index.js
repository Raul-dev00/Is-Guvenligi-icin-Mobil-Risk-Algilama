const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { initSocket } = require('./socket');

const server = http.createServer(app);
initSocket(server);

server.listen(env.port, () => {
  console.log(`ISG Risk Backend running on http://localhost:${env.port}`);
});
