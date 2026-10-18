const path = require('node:path');
const { app, BrowserWindow, dialog, net, protocol, shell } = require('electron');
const { pathToFileURL } = require('node:url');

const entryPath = path.join(app.getAppPath(), 'index.html');
const entryUrl = new URL('frame://studio/index.html');
const appAssets = new Set(['index.html', 'app.js', 'styles.css']);

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'frame',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);

function openExternalLink(url) {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      console.error(`Blocked external URL with unsupported protocol: ${parsedUrl.protocol}`);
      return;
    }

    shell.openExternal(parsedUrl.href).catch((error) => {
      console.error('Could not open the external link.', error);
    });
  } catch (error) {
    console.error('Could not parse the external link.', error);
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 360,
    minHeight: 600,
    backgroundColor: '#101114',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    openExternalLink(url);
    return { action: 'deny' };
  });

  window.webContents.on('will-navigate', (event, url) => {
    const destination = new URL(url);
    if (destination.origin !== entryUrl.origin || destination.pathname !== entryUrl.pathname) {
      event.preventDefault();
      openExternalLink(url);
    }
  });

  window.webContents.on('render-process-gone', (_event, details) => {
    console.error('The Frame Studio renderer process exited.', details);
  });

  window.loadURL(entryUrl.href).catch((error) => {
    console.error('Could not load the Frame Studio window.', error);
    dialog.showErrorBox(
      'Frame Studio não abriu',
      'Não foi possível carregar a interface do aplicativo. Reinstale o Frame Studio e tente novamente.',
    );
  });
}

app.whenReady().then(() => {
  protocol.handle('frame', (request) => {
    const requestedUrl = new URL(request.url);
    const assetName = decodeURIComponent(requestedUrl.pathname.slice(1));
    if (requestedUrl.origin !== entryUrl.origin || !appAssets.has(assetName)) {
      return new Response('Not found', { status: 404 });
    }

    const assetPath = path.join(app.getAppPath(), assetName);
    return net.fetch(pathToFileURL(assetPath).href);
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}).catch((error) => {
  console.error('Frame Studio could not start.', error);
  app.exit(1);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
