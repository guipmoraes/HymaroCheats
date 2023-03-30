const electron = require('electron')
const { app, BrowserWindow, Notification, getCurrentWindow, remote } = require('electron')
const shell = require('shelljs')
var request = require('request');
var installedGames = []
var exec = require('child_process').execFile;
const config = require('./config.json')
const apiURL = config.url
const settings = require('electron-settings');
app.getPath('userData');
const ejse = require('ejs-electron')
const qs = require('query-string');
const cookies = settings.get('accountInformations')
const fs = require('fs')
ejse.data('cookies', cookies)
const unzipper = require('unzipper')
var http = require('http')

// TODO pass the base url in the environment variable during setup?
/*const base = 'https://todomvc-express.bahmutov.com/'
let initialUrl = ''
// This application opens links that start with this protocol
const PROTOCOL = 'todo2://'
const PROTOCOL_PREFIX = PROTOCOL.split(':')[0]
// prints given message both in the terminal console and in the DevTools
let win
console.log('process args', process.argv)*/
let win
const isDev = true;
setInformations()
const createWindow = () => {

  win = new BrowserWindow({
    titleBarStyle: 'hidden',
    width: 800,
    height: 600,
    autoHideMenuBar: true,
  })

  /*protocol.registerHttpProtocol(PROTOCOL_PREFIX, (req, cb) => {
    const fullUrl = formFullTodoUrl(req.url)
    devToolsLog('full url to open ' + req.url)
    win.loadURL(fullUrl)
  })*/
  win.loadFile('index.ejs')


}
const createWindowOauth2 = () => {
  winOauth2 = new BrowserWindow({
    titleBarStyle: 'hidden',
    width: 800,
    height: 600,
    autoHideMenuBar: true,
  })

  /*protocol.registerHttpProtocol(PROTOCOL_PREFIX, (req, cb) => {
    const fullUrl = formFullTodoUrl(req.url)
    devToolsLog('full url to open ' + req.url)
    win.loadURL(fullUrl)
  })*/

  winOauth2.loadURL('https://discord.com/api/oauth2/authorize?client_id=1051526092311232584&redirect_uri=http%3A%2F%2Flocalhost%3A3333%2Foauth2&response_type=code&scope=identify%20email')
}
const createWindowHome = () => {
  winHome = new BrowserWindow({
    titleBarStyle: 'hidden',
    width: 974,
    height: 575,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true, 
      enableRemoteModule: true
  }
  })

  /*protocol.registerHttpProtocol(PROTOCOL_PREFIX, (req, cb) => {
    const fullUrl = formFullTodoUrl(req.url)
    devToolsLog('full url to open ' + req.url)
    win.loadURL(fullUrl)
  })*/
  winHome.loadFile('home.ejs')
}

/*function devToolsLog(s) {
  console.log(s)
  if (win && win.webContents) {
    win.webContents.executeJavaScript(`console.log("${s}")`)
  }
}*/
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
app.whenReady().then(async () => {
  const hasAccountInformations = await settings.has('accountInformations.id')
  console.log(hasAccountInformations)
  if (hasAccountInformations == false) {
    console.log("Local Store Null")
    createWindow()
  } else {
    const accountInformations = await settings.get('accountInformations')
    console.log(accountInformations)

    console.log("Local Store Not Null")
    createWindowHome()
  }
})

app.on("ready", () => {

});

function test() {
  console.log("Test")
}
/*function stripCustomProtocol(url) {
  if (!url) {
    return url
  }
  if (!url.startsWith(PROTOCOL)) {
    return url
  }
  const todoPath = url.substr(8)
  return todoPath
}

function formFullTodoUrl(todoPath) {
  return `${base}${todoPath}`
}*/
app.on('window-all-closed', () => {

  if (process.platform !== 'darwin') electron.app.quit()
})

const protocol = electron.protocol
var link;

// This will catch clicks on links such as <a href="foobar://abc=1">open in foobar</a>
if (isDev && process.platform === 'win32') {
  // Set the path of electron.exe and your app.
  // These two additional parameters are only available on windows.
  // Setting this is required to get this working in dev mode.
  app.setAsDefaultProtocolClient('indra', process.execPath, [
    process.argv[1]
  ]);
} else {
  app.setAsDefaultProtocolClient('indra');
}

// Force single application instance
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();

} else {
  app.on('second-instance', async (e, argv) => {
    if (process.platform !== 'darwin') {
      console.log(argv)
      // Find the arg that is our custom protocol url and store it
      deeplinkingUrl = argv.find((arg) => arg.startsWith('indra://'));
      console.log(deeplinkingUrl)
      const args = deeplinkingUrl.split("indra://")
      console.log(args)
      if (deeplinkingUrl == "indra://oauth2/") {

        createWindowOauth2()

      }
      if (deeplinkingUrl.startsWith("indra://oauth2Login")) {
        const args2 = deeplinkingUrl.split("indra://oauth2Login")
        console.log("OAUTH2 Login")
        const parsedObject = qs.parse(args2[1].replace("/?", ""));
        await settings.set('accountInformations', parsedObject);
        console.log(parsedObject);
        win.close()
        winOauth2.close()
        createWindowHome()
      }
      if (deeplinkingUrl.startsWith("indra://exit")) {
        await settings.unset("accountInformations")
        winHome.close()
        createWindow()
      }
      if (deeplinkingUrl.startsWith("indra://open")) {
        const args2 = deeplinkingUrl.split("indra://open")

        exec(app.getAppPath() + "\\games\\" + args2[1].replace('/', "").replace("%20", " ") + "\\" + args2[1].replace('/', "").replace("%20", "-") + ".exe", function (err, data) {
          console.log(err)
          console.log(data.toString());
        });

      }
      if (deeplinkingUrl.startsWith("indra://install")) {
        const args2 = deeplinkingUrl.split("indra://install")
        console.log(args2[1])
        fs.mkdirSync(app.getAppPath() + "\\games\\" + args2[1].replace('/', "").replace("%20", " "), { recursive: true });

        const games = getGames(function (data, err) {
          const index = data.indexOf(args2[1])
          const file = fs.createWriteStream(app.getAppPath() + "\\games\\" + args2[1].replace('/', "").replace("%20", " ") + "\\" + args2[1].replace('/', "").replace("%20", "-") + ".zip");
          const request = http.get(apiURL + "/download?fileName=" + args2[1].replace('/', "").replace("%20", "-") + ".zip", function (response) {
            response.pipe(file);

            // after download completed close filestream
            file.on("finish", () => {
              file.close();
              console.log("Download Completed");
              fs.createReadStream(app.getAppPath() + "\\games\\" + args2[1].replace('/', "").replace("%20", " ") + "\\" + args2[1].replace('/', "").replace("%20", "-") + ".zip")
                .pipe(unzipper.Extract({ path: app.getAppPath() + "\\games\\" + args2[1].replace('/', "").replace("%20", " ") }));
                const accountInformations = settings.get('accountInformations')
                getUserLicenseByGameID(accountInformations.id, data.indexOf[args2[1]].gameId, function(data, err){
                  fs.writeFile('./auth.key',data[0].licenseKey, function (data, err){
                    console.log("Key writed")
                  })
                })
            });
          });
        })

      }
    }
  })

}

function getGames(callback) {


  request(apiURL + "/games", function (error, response, body) {

    return callback(response.body);

  });

}
function getUserLicenseByGameID(userId, gameId, callback) {


  request(apiURL + "/getUserLicenseByGameID?userId=" + userId + "&gameId=" + gameId, function (error, response, body) {

    return callback(response.body);

  });

}
setTimeout(() => {
  fs.readdir(app.getAppPath() + "\\games\\", (err, files) => {
    files.forEach(file => {
      ejse.data("installedGames", file)
    });
  });
}, 100);
console.log(installedGames)
async function setInformations() {

  const accountInformations = await settings.get('accountInformations')
  

  getGames(function (data, err) {
    console.log(JSON.parse(data))
    ejse.data('games', JSON.parse(data))
  })


  ejse.data('cookies', accountInformations)

}


setInformations()
