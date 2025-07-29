const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

class DesktopApp {
    constructor() {
        this.mainWindow = null;
        this.server = null;
        this.io = null;
        this.port = 3001;
    }

    async createWindow() {
        this.mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js')
            },
            titleBarStyle: 'hiddenInset',
            show: false
        });

        // Load the web interface
        this.mainWindow.loadFile('index.html');
        
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
        });

        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });
    }

    setupServer() {
        const expressApp = express();
        expressApp.use(express.static(__dirname));
        
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
                
                // Simulate processing and respond
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

    async initialize() {
        await app.whenReady();
        this.setupServer();
        this.createWindow();

        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });

        app.on('activate', async () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                this.createWindow();
            }
        });
    }
}

// Start the desktop application
const desktopApp = new DesktopApp();
desktopApp.initialize();

