const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

// Window state management
let windowState = {
  width: 300,  // Will be calculated based on screen size
  height: 100, // Will be calculated based on screen size  
  x: undefined,
  y: undefined
};

function calculateDefaultSize(screenWidth, screenHeight) {
  // 1/7 of screen area, maintaining 16:9 ratio
  const targetArea = (screenWidth * screenHeight) / 7;
  
  // For 16:9 ratio: width = 16k, height = 9k
  // Area = 16k * 9k = 144k²
  // k = sqrt(targetArea / 144)
  const k = Math.sqrt(targetArea / 144);
  
  const calculatedWidth = Math.round(16 * k);
  const calculatedHeight = Math.round(9 * k);
  
  // Ensure minimum size
  const width = Math.max(calculatedWidth, 200);
  const height = Math.max(calculatedHeight, 112); // 200 * 9/16 ≈ 112
  
  console.log(`Screen: ${screenWidth}x${screenHeight}, Calculated: ${width}x${height} (1/7 area, 16:9 ratio)`);
  
  return { width, height };
}

function createWindow() {
  // Get display info for positioning and sizing
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  
  // Always calculate and apply the default size (no persistence for now)
  const defaultSize = calculateDefaultSize(screenWidth, screenHeight);
  windowState.width = defaultSize.width;
  windowState.height = defaultSize.height;
  
  console.log(`Setting window size to: ${windowState.width}x${windowState.height}`);
  
  // Default position (top-right corner)
  if (windowState.x === undefined) {
    windowState.x = screenWidth - windowState.width - 20;
    windowState.y = 20;
  }

  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 200,
    minHeight: 60,
    alwaysOnTop: true,
    frame: false, // Frameless window
    resizable: true,
    skipTaskbar: false,
    title: 'Precision Stopwatch',
    transparent: true, // Enable transparency for rounded corners
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false // Don't show until ready
  });

  mainWindow.loadFile('renderer.html');

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Save window state on resize/move and trigger font resize
  mainWindow.on('resize', () => {
    saveWindowState();
    // Notify renderer about resize
    mainWindow.webContents.send('window-resized');
  });
  mainWindow.on('move', saveWindowState);
  
  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle close window message from renderer
  ipcMain.on('close-window', () => {
    if (mainWindow) {
      mainWindow.close();
    }
  });
  
  // Handle window movement
  ipcMain.on('move-window', (event, deltaX, deltaY) => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds();
      const newX = bounds.x + deltaX;
      const newY = bounds.y + deltaY;
      
      // Only change position, preserve size explicitly
      mainWindow.setBounds({
        x: newX,
        y: newY,
        width: bounds.width,
        height: bounds.height
      });
    }
  });

  // Optional: Open DevTools in development
  // mainWindow.webContents.openDevTools();
}

function saveWindowState() {
  if (!mainWindow) return;
  
  const bounds = mainWindow.getBounds();
  windowState = {
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y
  };
}

// App event handlers
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

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}