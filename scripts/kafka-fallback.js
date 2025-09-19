#!/usr/bin/env node
import { EventEmitter } from 'events';
import { createServer } from 'net';

const PORT = parseInt(process.env.KAFKA_FALLBACK_PORT) || 9093;

class FallbackKafka extends EventEmitter {
  constructor() {
    super();
    this.topics = new Map();
    this.consumers = new Set();
  }

  createTopic(topic) {
    if (!this.topics.has(topic)) {
      this.topics.set(topic, []);
    }
  }

  produce(topic, message) {
    this.createTopic(topic);
    const messages = this.topics.get(topic);
    messages.push({
      timestamp: Date.now(),
      value: message,
      offset: messages.length
    });
    
    // Emit to consumers
    this.emit('message', { topic, message: messages[messages.length - 1] });
  }

  consume(topic, callback) {
    this.createTopic(topic);
    const consumer = { topic, callback };
    this.consumers.add(consumer);
    
    // Send existing messages
    const messages = this.topics.get(topic);
    messages.forEach(msg => callback(msg));
    
    // Listen for new messages
    this.on('message', ({ topic: msgTopic, message }) => {
      if (msgTopic === topic) {
        callback(message);
      }
    });
    
    return consumer;
  }
}

const kafka = new FallbackKafka();

// Create essential topics
kafka.createTopic('raw.detections');
kafka.createTopic('state.transitions');
kafka.createTopic('dwell.updates');
kafka.createTopic('feedback.updates');

const server = createServer((socket) => {
  console.log('Kafka client connected');
  
  socket.on('data', (data) => {
    try {
      const request = JSON.parse(data.toString());
      
      if (request.type === 'produce') {
        kafka.produce(request.topic, request.message);
        socket.write(JSON.stringify({ success: true }));
      } else if (request.type === 'consume') {
        kafka.consume(request.topic, (message) => {
          socket.write(JSON.stringify({ topic: request.topic, message }));
        });
      }
    } catch (error) {
      socket.write(JSON.stringify({ error: error.message }));
    }
  });
  
  socket.on('end', () => {
    console.log('Kafka client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Fallback Kafka server listening on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('Shutting down fallback Kafka server');
  server.close();
  process.exit(0);
});
