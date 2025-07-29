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

    bindEvents() {
        document.getElementById('connectBtn').addEventListener('click', () => this.connect());
        document.getElementById('disconnectBtn').addEventListener('click', () => this.disconnect());
        document.getElementById('sendBtn').addEventListener('click', () => this.sendMessage());
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    setupDownloadButton() {
        document.getElementById('downloadBtn').addEventListener('click', () => {
            window.location.href = 'assistant-bridge-desktop.zip';
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