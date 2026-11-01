import { app, BrowserWindow, ipcMain } from 'electron';
import started from 'electron-squirrel-startup';
import { readFile } from 'node:fs/promises';
// ipcMain receives messages in Electron’s main process.

// Webpack creates these two values while it builds the application.
// `declare` tells TypeScript that the values exist even though they are not
// written directly in this source file.
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Windows briefly starts the app while installing or removing shortcuts.
// In that special situation, the real application window should not open.
if (started) {
  app.quit();
}

// `: void` is a TypeScript return type. It means this function performs an
// action but does not return a value.
function createWindow(): void {
  // BrowserWindow is Electron's representation of a native desktop window.
  const mainWindow = new BrowserWindow({
    // These dimensions match the scaled player exactly, so Electron does not
    // leave unused black space around the interface.
    width: 431,
    height: 551,
    // Treat width and height as usable page space, not outer window borders.
    useContentSize: true,
    // Centering prevents a larger window from opening past the monitor edge.
    center: true,
    resizable: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    title: 'Drainamp',
    webPreferences: {
      // The preload file is our limited bridge to desktop-only features.
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  // Load the HTML/CSS/TypeScript interface into the desktop window.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // DevTools are useful while learning. Press Ctrl+Shift+I when you want to
  // inspect the page rather than opening them automatically every time.
}

// `whenReady()` finishes later, after Electron has initialized. `.then(...)`
// says what should happen next: create our window.
app.whenReady().then(() => {
  /*
   * Listen for the message sent by preload.ts.
   * `event.sender` identifies the page that sent the message.
   */
  ipcMain.handle('window:minimize', (event) => {
    const senderWindow = BrowserWindow.fromWebContents(event.sender);
    if (senderWindow) {
      senderWindow.minimize();
    }
  });

  ipcMain.handle('window:close', (event) => {
    const senderWindow = BrowserWindow.fromWebContents(event.sender);
    if (senderWindow) {
      senderWindow.close();
    }
  });

  ipcMain.handle('playlist:read-audio-file', async (_event, filePath) => {
    if (typeof filePath !== 'string' || filePath.trim() === '') {
      throw new Error('Drainamp received an invalid audio file path.');
    }

    /*
     * React cannot read an old local path by itself. The main process reads
     * the song and sends its bytes back through our narrow preload bridge.
     */
    const fileContents = await readFile(filePath);

    // Copy the Node Buffer into a plain ArrayBuffer that browsers understand.
    return Uint8Array.from(fileContents).buffer;
  });

  createWindow();

  // macOS applications commonly reopen a window when their dock icon is
  // clicked. This does nothing on Windows, but keeps the project portable.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Windows and Linux apps normally quit when their last window closes. macOS
// apps usually stay running until the user explicitly quits them.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
