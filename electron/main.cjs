const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const windowStateKeeper = require('electron-window-state');

function createWindow() {
    let mainWindowState = windowStateKeeper({
        defaultWidth: 1200,
        defaultHeight: 800
    });

    const win = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        frame: false, // Hide default title bar
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    mainWindowState.manage(win);

    const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist/index.html')}`;

    win.loadURL(startUrl);

    // Open the DevTools only in development mode
    if (process.env.ELECTRON_START_URL) {
        win.webContents.openDevTools();
    }

    // Window Control Handlers
    ipcMain.on('minimize-window', () => win.minimize());
    ipcMain.on('maximize-window', () => {
        if (win.isMaximized()) {
            win.unmaximize();
        } else {
            win.maximize();
        }
    });
    ipcMain.on('close-window', () => win.close());
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
