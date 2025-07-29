const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

class BridgeServer {
    constructor() {
        this.server = null;
        this.io = null;
        this.port = 3001;
    }

    start() {
        const expressApp = express();
        expressApp.use(express.static(path.join(__dirname, '..')));
        
        this.server = http.createServer(expressApp);
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        this.io.on('connection', (socket) => {
            console.log('Web interface connected');
            
            socket.on('message', (data) => {
                console.log('Received from web:', data.message);
                
                setTimeout(() => {
                    socket.emit('message', {
                        message: `Echo: ${data.message}`,
                        timestamp: new Date().toISOString()
                    });
                }, 500);
            });

            socket.on('disconnect', () => {
                console.log('Web interface disconnected');
            });
        });

        this.server.listen(this.port, () => {
            console.log(`Bridge server running on port ${this.port}`);
        });
    }

    stop() {
        if (this.server) {
            this.server.close();
            this.server = null;
            this.io = null;
        }
    }
}

module.exports = BridgeServer;

