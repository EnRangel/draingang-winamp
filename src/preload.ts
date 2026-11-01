import { contextBridge, ipcRenderer, webUtils } from 'electron';

/*
 * Expose a small API to the React side of the application.
 *
 * React receives only the file and window actions listed below. It does not
 * receive unrestricted access to Electron or the user's computer.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  getFilePath: (file: File) => {
    // Browsers hide a selected file's real path. Electron can safely reveal
    // it here so Drainamp knows where to find the song after a restart.
    return webUtils.getPathForFile(file);
  },

  readAudioFile: (filePath: string) => {
    // invoke() waits for a reply from main.ts, unlike send(), which is one-way.
    return ipcRenderer.invoke('playlist:read-audio-file', filePath);
  },

  minimizeWindow: () => {
    ipcRenderer.send('window:minimize');
  },

  closeWindow: () => {
    // IPC means inter-process communication.
    // This sends a named message to Electron's main process.
    ipcRenderer.send('window:close');
  },
});
