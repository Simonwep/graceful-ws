<h3 align="center">
    <img src="https://user-images.githubusercontent.com/30767528/66257184-01a1c380-e796-11e9-9b2c-4908cfc22c95.png" alt="Logo">
</h3>

<p align="center">
  <img alt="gzip size" src="https://img.badgesize.io/https://cdn.jsdelivr.net/npm/graceful-ws@1.2.1/lib/graceful-ws.min.js?compression=gzip&style=flat-square">
  <img alt="brotli size" src="https://img.badgesize.io/https://cdn.jsdelivr.net/npm/graceful-ws@1.2.1/lib/graceful-ws.min.js?compression=brotli&style=flat-square">
  <a href="https://travis-ci.org/Simonwep/graceful-ws"><img
     alt="Build Status"
     src="https://img.shields.io/travis/Simonwep/graceful-ws.svg?style=popout-square"></a>
  <a href="https://www.npmjs.com/package/graceful-ws"><img
     alt="Download count"
     src="https://img.shields.io/npm/dm/graceful-ws.svg?style=popout-square"></a>
  <img alt="No dependencies" src="https://img.shields.io/badge/dependencies-none-27ae60.svg?style=popout-square">
  <a href="https://www.jsdelivr.com/package/npm/graceful-ws"><img
     alt="JSDelivr download count"
     src="https://data.jsdelivr.com/v1/package/npm/graceful-ws/badge"></a>
  <img alt="Current version"
       src="https://img.shields.io/github/tag/Simonwep/graceful-ws.svg?color=3498DB&label=version&style=flat-square">
  <a href="https://www.patreon.com/simonwep"><img
     alt="Support me"
     src="https://img.shields.io/badge/patreon-support-3498DB.svg?style=popout-square"></a>
</p>

<br>


`graceful-ws` is a [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) - wrapper which tries to keep a connection alive
through sending a ping request every `n` milliseconds. It will automatically re-bind all event-listeners after a re-establishment of the connection.

## Getting Started

Install via npm:
```shell
$ npm install graceful-ws
```

Install via yarn:
```shell
$ yarn add graceful-ws
```

Include directly via jsdelivr:
```html
<script src="https://cdn.jsdelivr.net/npm/graceful-ws/lib/graceful-ws.min.js"></script>
```

Using [JavaScript Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules):

````js
import {...} from 'https://cdn.jsdelivr.net/npm/graceful-ws/lib/graceful-ws.min.mjs'
````


## Usage

```js
const ws = new GracefulWebSocket('ws://localhost:8080');

// Connection-state related events
ws.addEventListener('connected', () => console.log('[GWS] Connected'));
ws.addEventListener('disconnected', () => console.log('[GWS] disconnected'));
ws.addEventListener('killed', () => console.log('[GWS] killed'));

// Message event
ws.addEventListener('message', e => {
    console.log('[GWS] Message received: ', e.data);
});
```


##### All options
```js
const ws = new GracefulWebSocket({

    // Timing settings
    pingTimeout: 2500,   // After how many ms a connection should be declared as disconnected
    pingInterval: 5000,  // Ping interval
    retryInterval: 1000, // Reconnect interval

    // Ping message and expected answer
    com: {
        message: '__PING__', // Message which will be send to the server as question "hey, are you still there?"
        answer: '__PONG__'   // Expected response to the message
    },

    /**
     * Websocket parameters. ws.url is required to initialize GracefulWebsocket, otherwise an error will be thrown.
     * See https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/WebSocket#Parameters
     */
    ws: {
        url: 'ws://...', // WebSocket url
        protocol: 'protocols...' // Optional protocols as string or array of strings
    }
});
```

### Functions
* `ws.addEventlistener(type, callback, options?)` _- Adds a new eventlistener, see [events](#events) section._
* `ws.removeEventListener(type, callback, options?)` _- Removes an eventlistener,  see [events](#events) section._
* `ws.send(data)` _- Same as `WebSocket.prototype.send`, will throw an Error if there's currently no open connection._
* `ws.close(code?)` _- Same as `WebSocket.prototype.close` emits a `close` event, will throw an Error if there's currently no open connection. (It won't restart after this function got called!)_

All [websocket properties](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) (except eventlistener like `onclose`, `onmessage` etc...) are implemented by graceful-ws. `add/removeEventListener` is handled by graceful-ws and cannot / shouldn't be accessed directly.
If there's no active connection `null` will be returned.


### Events
* `message` _- Websocket received a message._
* `connected` _- Emitted whenever a connection got re-established._
* `disconnected` _- Emitted whenever the `pingTimeout` threshold was exceeded or a network error occur._
* `killed` _- Emitted if `.close()` was called which prevents further connection re-establishment._
