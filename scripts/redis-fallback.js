#!/usr/bin/env node
import { createServer } from 'net';

const PORT = parseInt(process.env.REDIS_FALLBACK_PORT) || 6380;
const store = new Map();

const server = createServer((socket) => {
  console.log('Client connected');
  
  socket.on('data', (data) => {
    const command = data.toString().trim().split(' ');
    const cmd = command[0].toUpperCase();
    
    let response = '';
    
    switch (cmd) {
      case 'PING':
        response = '+PONG\r\n';
        break;
      case 'SET':
        if (command.length >= 3) {
          store.set(command[1], command[2]);
          response = '+OK\r\n';
        } else {
          response = '-ERR wrong number of arguments\r\n';
        }
        break;
      case 'GET':
        if (command.length >= 2) {
          const value = store.get(command[1]);
          response = value ? `$${value.length}\r\n${value}\r\n` : '$-1\r\n';
        } else {
          response = '-ERR wrong number of arguments\r\n';
        }
        break;
      case 'HSET':
        if (command.length >= 4) {
          const key = command[1];
          const field = command[2];
          const value = command[3];
          if (!store.has(key)) store.set(key, new Map());
          const hash = store.get(key);
          hash.set(field, value);
          response = ':1\r\n';
        } else {
          response = '-ERR wrong number of arguments\r\n';
        }
        break;
      case 'HGETALL':
        if (command.length >= 2) {
          const hash = store.get(command[1]);
          if (hash instanceof Map) {
            const entries = Array.from(hash.entries()).flat();
            response = `*${entries.length}\r\n`;
            entries.forEach(entry => {
              response += `$${entry.length}\r\n${entry}\r\n`;
            });
          } else {
            response = '*0\r\n';
          }
        } else {
          response = '-ERR wrong number of arguments\r\n';
        }
        break;
      default:
        response = '+OK\r\n'; // Simple fallback
    }
    
    socket.write(response);
  });
  
  socket.on('end', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Fallback Redis server listening on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('Shutting down fallback Redis server');
  server.close();
  process.exit(0);
});
