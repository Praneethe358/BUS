const http = require('http');
const app = require('./src/app');
const { setupSocket } = require('./src/sockets');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

setupSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
