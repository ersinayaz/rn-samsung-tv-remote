import { EventEmitter } from 'events';
const TvEvents = require('./TvEvents')
const RemotePairing = require('./Pairing/RemotePairing')
const RemoteConnection = require('./Connection/RemoteConnection')

class SamsungRemote {
  constructor(deviceConfig) {
    this.config = deviceConfig
    this.device = null
    this.pairing = null
    this.identity = null
    this.connection = null
    this.eventEmitter = new EventEmitter()
  }

  async init(identity = null) {
    const device = await this.fetchDeviceInfo()
    this.device = device
    this.pairing = new RemotePairing(this.config, this.device, this.eventEmitter, identity)

    if (identity) {
      this.identity = identity
    }
    return device
  }

  async fetchDeviceInfo() {
    const resp = await fetch(`http://${this.config.ip}:8001/ms/1.0/`)
    const device = await resp.json()
    const deviceInfo = { id: device.DeviceID, name: device.DeviceName, model: device.ModelName }
    return deviceInfo
  }

  async requestPin() {
    await this.pairing.requestPin()
  }

  async confirmPin(pin) {
    const identity = await this.pairing.confirmPin(pin)
    this.identity = identity
    await this.pairing.hidePinConfirmation()
    return identity
  }

  async connect() {
    this._assertPaired()

    this.connection = new RemoteConnection(this.config, this.identity, this.eventEmitter)
    return this.connection.connect().then(socket => { return this.connection })
  }

  sendKey(keyCode) {
    this._assertPaired()
    this._assertConnected()
    this.connection.sendKey(keyCode)
  }

  onConnected(listener) {
    this.eventEmitter.on(TvEvents.CONNECTED, listener)
  }

  onRepair(listener) {
    this.eventEmitter.on(TvEvents.REPAIR, listener)
  }

  onError(listener) {
    this.eventEmitter.on(TvEvents.ERROR, listener)
  }

  onDisconnected(listener) {
    this.eventEmitter.on(TvEvents.DISCONNECTED, listener)
  }

  _assertPaired() {
    if (!this.pairing.isPaired()) {
      throw Error('Pairing required')
    }
  }

  _assertConnected() {
    if (this.connection === null) {
      throw Error('Connection not established')
    }

    if (!this.connection.isReady()) {
      throw Error('Connection not yet ready')
    }
  }
}

export default SamsungRemote