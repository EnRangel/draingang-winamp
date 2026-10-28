import { app, BrowserWindow, ipcMain } from 'electron';
import started from 'electron-squirrel-startup';
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
    // The transparent window is larger than the visible jagged player skin.
    width: 820,
    height: 760,
    resizable: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    title: 'Drainamp',
    webPreferences: {
      // The preload file will become our safe bridge to desktop features.
      // It is empty for now because Step 1 does not need filesystem access.
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
  ipcMain.on('window:minimize', (event) => {
    const senderWindow = BrowserWindow.fromWebContents(event.sender);
    if (senderWindow) {
      senderWindow.minimize();
    }
  });

  ipcMain.on('window:close', (event) => {
    const senderWindow = BrowserWindow.fromWebContents(event.sender);
    // `?.` calls close only if Electron found the sender's window.
    if (senderWindow) {
      senderWindow.close();
    }
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
