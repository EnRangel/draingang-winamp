import { contextBridge, ipcRenderer } from 'electron';

/*
 * Expose a small API to the React side of the application.
 *
 * React will be allowed to request "close the window", but it will not
 * receive unrestricted access to Electron or the user's computer.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => {
    ipcRenderer.send('window:minimize');
  },

  closeWindow: () => {
    // IPC means inter-process communication.
    // This sends a named message to Electron's main process.
    ipcRenderer.send('window:close');
  },
});