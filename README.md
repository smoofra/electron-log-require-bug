# electron-log duplicates messages when used with webpack 

This is a bug report for `electron-log`.  The bug is that when used with
webpack, and if you attempt to redirect `console.log` to `electron-log` it will
duplicate log messages.

## To reproduce

    yarn install
    yarn start
    
## What you will see

```
20:02:34.490 › hello main
20:02:35.002 › hello render
20:02:35.500 › ping main
20:02:35.503 › 20:02:35.501 › ping main
20:02:36.505 › ping main
20:02:36.507 › 20:02:36.506 › ping main
20:02:37.509 › ping main
20:02:37.510 › 20:02:37.509 › ping main
20:02:38.513 › ping main
20:02:38.515 › 20:02:38.514 › ping main
```

## What you ought to have seen

```
20:02:34.490 › hello main
20:02:35.002 › hello render
20:02:35.500 › ping main
20:02:36.505 › ping main
20:02:37.509 › ping main
20:02:38.513 › ping main
```


## What's happening


Modules loaded through webpack get a `require()` function provided by webpack.
However, webpack doesn't get a chance to interpose on the `require()` sent via
`executeJavaScript()` in `rendererConsole.js`.  This results in two copies of
`electron-log` being loaded in the render process.


```javascript
function renderConsoleTransportFactory(electronLog) {
  transport.level  = electronLog.isDev ? 'silly' : false;
  transport.format = '[{h}:{i}:{s}.{ms}] {text}';

  switch (process.type) {
    case 'browser': {
      // require electron-log in renderer
      utils.getElectronApp().on('web-contents-created', function (e, contents) {
        contents.executeJavaScript('try {require("electron-log")} catch(e){}');
      });

      return transport;
    }

    case 'renderer': {
      utils.onIpcRenderer(IPC_EVENT, function (event, msg) {
        electronLog.transports.console(msg);
      });

      return null;
    }

    default: {
      return null;
    }
  }

  function transport(msg) {
    msg.data = msg.data.map(format.stringifyObject);
    utils.sendIpcToRenderer(IPC_EVENT, msg);
  }
}
```
