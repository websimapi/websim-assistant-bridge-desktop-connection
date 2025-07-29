import io from 'socket.io-client';

class BridgeConnection {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkConnection();
        this.setupDownloadButton();
    }

    setupDownloadButton() {
        const downloadBtn = document.getElementById('downloadBtn');
        downloadBtn.addEventListener('click', () => this.downloadZip());
    }

    async downloadZip() {
        try {
            // Create a zip file with the desktop application
            const zip = new JSZip();
            
            // Add all necessary files to the zip
            zip.file("package.json", JSON.stringify({
                "name": "assistant-bridge-desktop",
                "version": "1.0.0",
                "description": "Desktop assistant with web bridge connection",
                "main": "main.js",
                "scripts": {
                    "start": "electron .",
                    "dev": "electron . --dev",
                    "build": "electron-builder",
                    "pack": "electron-builder --dir",
                    "dist": "electron-builder --publish=never"
                },
                "keywords": ["assistant", "bridge", "desktop", "electron"],
                "author": "Assistant Bridge Team",
                "license": "MIT",
                "devDependencies": {
                    "electron": "^28.0.0",
                    "electron-builder": "^24.9.1"
                },
                "dependencies": {
                    "socket.io": "^4.7.5",
                    "express": "^4.18.2"
                }
            }, null, 2));
            
            zip.file("main.js", `const { app, BrowserWindow, ipcMain } = require('electron');
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
                        message: \`Echo: \${data.message}\`,
                        timestamp: new Date().toISOString()
                    });
                }, 500);
            });

            socket.on('disconnect', () => {
                console.log('Web interface disconnected');
            });
        });

        this.server.listen(this.port, () => {
            console.log(\`Bridge server running on port \${this.port}\`);
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

    bindEvents() {
        document.getElementById('connectBtn').addEventListener('click', () => this.connect());
        document.getElementById('disconnectBtn').addEventListener('click', () => this.disconnect());
        document.getElementById('sendBtn').addEventListener('click', () => this.sendMessage());
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    checkConnection() {
        // Try to connect to the desktop app
        try {
            this.socket = io('http://localhost:3001', {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });

            this.setupSocketEvents();
            document.getElementById('connectBtn').disabled = false;
        } catch (error) {
            console.error('Connection failed:', error);
            this.updateStatus('Desktop app not found', false);
        }
    }

    setupSocketEvents() {
        this.socket.on('connect', () => {
            this.isConnected = true;
            this.updateStatus('Connected to desktop app', true);
            this.toggleControls(true);
            this.addMessage('Connected to desktop assistant', 'remote');
        });

        this.socket.on('disconnect', () => {
            this.isConnected = false;
            this.updateStatus('Disconnected', false);
            this.toggleControls(false);
            this.addMessage('Disconnected from desktop app', 'remote');
        });

        this.socket.on('message', (data) => {
            this.addMessage(data.message, 'remote');
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
            this.updateStatus('Connection error', false);
        });
    }

    connect() {
        if (this.socket && !this.isConnected) {
            this.socket.connect();
        }
    }

    disconnect() {
        if (this.socket && this.isConnected) {
            this.socket.disconnect();
        }
    }

    sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (message && this.isConnected) {
            this.socket.emit('message', { message });
            this.addMessage(message, 'local');
            input.value = '';
        }
    }

    addMessage(text, type) {
        const messages = document.getElementById('messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = text;
        messages.appendChild(messageDiv);
        messages.scrollTop = messages.scrollHeight;
    }

    updateStatus(text, connected) {
        const statusText = document.getElementById('statusText');
        const statusIndicator = document.getElementById('statusIndicator');
        
        statusText.textContent = text;
        statusIndicator.classList.toggle('connected', connected);
    }

    toggleControls(enabled) {
        document.getElementById('connectBtn').disabled = enabled;
        document.getElementById('disconnectBtn').disabled = !enabled;
        document.getElementById('messageInput').disabled = !enabled;
        document.getElementById('sendBtn').disabled = !enabled;
    }
}

// Initialize the bridge connection
new BridgeConnection();