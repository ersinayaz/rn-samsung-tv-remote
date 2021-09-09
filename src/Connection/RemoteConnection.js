const Encryption = require('../Pairing/Encryption/index')
const TvEvents = require('../TvEvents')
const Messages = require('./Messages')
const messages = new Messages()

const buildEmitMessage = (name, payload) => {
  return ('5::/com.samsung.companion:' + JSON.stringify({ name, args: [payload] }))
}

const handshake = async (config) => {
  const res = await fetch(`http://${config.ip}:8000/socket.io/1`);
  const body = await res.text();
  const hs = body.split(':');
  return hs[0];
}

const onMessageEmitter = (socket, identity, data, eventEmitter, config) => {
  const message = { socket, identity, data, eventEmitter, config }

  const shouldEmitEvent = (resolved) => {
    return (resolved !== null && typeof resolved === 'object' && resolved.hasOwnProperty('event'))
  }

  messages.handle(message).then((resolved) => {
    if (shouldEmitEvent(resolved)) {
      eventEmitter.emit(resolved.event, resolved.value)
    }
  })
}

messages.on('1::', (message) => {
  const { socket, identity } = message

  socket.send('1::/com.samsung.companion')
  socket.send(buildEmitMessage('registerPush', Encryption.encryptData(identity.aesKey, identity.sessionId, { eventType: 'EMP', plugin: 'SecondTV' })))
  socket.send(buildEmitMessage('registerPush', Encryption.encryptData(identity.aesKey, identity.sessionId, { eventType: 'EMP', plugin: 'RemoteControl' })))
  socket.send(buildEmitMessage('callCommon', Encryption.encryptData(identity.aesKey, identity.sessionId, { method: 'POST', body: { plugin: 'NNavi', api: 'GetDUID', version: '1.000' } })))
})

messages.on('2::', (message) => {
  const { socket } = message
  socket.send('2::')
})

messages.on(data => data.startsWith('5::/com.samsung.companion:'), message => {
  const { socket, identity, data, eventEmitter } = message

  const event = JSON.parse(data.slice('5::/com.samsung.companion:'.length))
  if (event.name !== 'receiveCommon') {
    return
  }

  try {
    const decrypted = JSON.parse(Encryption.decryptData(identity.aesKey, event.args))
    if (decrypted.plugin === 'NNavi' && decrypted.api === 'GetDUID') {
      return { event: TvEvents.DUID, value: decrypted.result }
    }
  } catch (error) {
    // todo: probably pairing failed, request pairing here
    console.log('handleEvent : unable to decrypt data', error)
    eventEmitter.emit(TvEvents.REPAIR, "unable to decrypt data");
    socket.close()
  }
})

const openSocket = async (config, identity, eventEmitter) => {
  try {
    await fetch(
      `http://${config.ip}:8000/common/1.0.0/service/startService?appID=com.samsung.companion`
    );
    const mask = await handshake(config);
    const socket = new WebSocket(
      `ws://${config.ip}:8000/socket.io/1/websocket/${mask}`
    );

    if (!socket) {
      throw Error('unable');
    }

    socket.onopen = () => {
      eventEmitter.emit(TvEvents.CONNECTING);
    };

    socket.onmessage = (e) => {
      onMessageEmitter(socket, identity, e.data, eventEmitter, config);
    };

    socket.onclose = () => {
      eventEmitter.emit(TvEvents.DISCONNECTED);
    };

    socket.onerror = (err) => {
      eventEmitter.emit(TvEvents.ERROR, 'An error has occurred with the socket connection.', err);
    };
    return socket;
  } catch (err_1) {
    eventEmitter.emit(TvEvents.ERROR, 'Error while creating socket.', err_1);
  }
}

class RemoteConnection {
  constructor(deviceConfig, identity, eventEmitter) {
    this.config = deviceConfig
    this.identity = identity
    this.eventEmitter = eventEmitter
    this.socket = null
    this.duid = null
    this.ready = false
    this._initializeEvents()
  }

  _initializeEvents() {
    this.eventEmitter.on(TvEvents.DUID, (duid) => {
      this.duid = duid

      if (this.isReady() && !this.ready) {
        this.ready = true
        this.eventEmitter.emit(TvEvents.CONNECTED)
      }
    })
    this.eventEmitter.on(TvEvents.DISCONNECTED, () => {
      this.ready = false
      this.socket = null
    })
  }

  async connect() {
    const socket = await openSocket(this.config, this.identity, this.eventEmitter);
    this.socket = socket;

    await new Promise(resolve => {
      this.eventEmitter.once(TvEvents.CONNECTED, () => {
        resolve();
      });
    });
    return socket;
  }

  async close() {
    if (!this.isReady || !this.socket) {
      return
    }

    this.socket.close();
  }

  sendKey(keyCode) {
    if (!this.isReady) {
      throw Error('Connection not established')
    }

    this.socket.send(
      buildEmitMessage(
        'callCommon',
        Encryption.encryptData(this.identity.aesKey, this.identity.sessionId, {
          method: 'POST',
          body: {
            plugin: 'RemoteControl',
            version: '1.000',
            api: 'SendRemoteKey',
            param1: this.duid,
            param2: 'Click',
            param3: keyCode,
            param4: 'false',
          },
        })
      )
    )
  }

  isReady() {
    return this.socket != null && this.duid != null
  }
}

module.exports = RemoteConnection