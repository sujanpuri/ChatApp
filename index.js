import express from 'express';
import http from 'http';

const app = express();
const server = http.createServer(app);

app.use(express.static('public'));

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});