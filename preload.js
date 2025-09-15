const { contextBridge, ipcRenderer } = require('electron');

// Expose safe methods to renderer
contextBridge.exposeInMainWorld('electronAPI', {
    closeWindow: () => ipcRenderer.send('close-window'),
    moveWindow: (deltaX, deltaY) => ipcRenderer.send('move-window', deltaX, deltaY)
});

console.log('Stopwatch preload script loaded');