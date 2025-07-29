const { app, BrowserWindow } = require('electron');
const path = require('path');
const BridgeServer = require('./src/bridge-server.js');

class DesktopApp {
    constructor() {
        this.mainWindow = null;
        this.bridgeServer = new BridgeServer();
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

        this.mainWindow.loadFile('index.html');
        
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
        });

        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
            this.bridgeServer.stop();
        });
    }

    async initialize() {
        await app.whenReady();
        this.bridgeServer.start();
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

const desktopApp = new DesktopApp();
desktopApp.initialize();

