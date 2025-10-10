import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));
//if there’s a file at public/index.html, opening http://localhost:3000 will show that HTML page.

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});

io.on('connection', (socket) => {
  console.log('A user connected', socket.id);
  socket.on('User-message', (msg) => {
    console.log('Message received in Backend:', msg);
    io.emit('Server-message', msg); // Broadcast the message to all connected clients, including the sender
    
  });

});