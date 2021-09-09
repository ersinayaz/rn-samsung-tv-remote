const Encryption = require('./Encryption/index')
const TvEvents = require('../TvEvents')

const buildPairingStepUri = (config, device, step) => {
  const path = `/ws/pairing?step=${step}&app_id=a0a95050-acbb-4b39-9356-5f385945d0d3&device_id=${device.deviceId}`
  return `http://${config.ip}:8080${path}`
}

const _verifyAckAuthData = (authData) => {
  const clientAck = Encryption.parseClientAcknowledge(authData.ClientAckMsg)
  if (!clientAck) {
    throw Error('failed to acknowledge client')
  }
  return authData
}

const _verifyHelloAuthData = (authData) => {
  if (Encryption.parseClientHello(authData.GeneratorClientHello) !== 0) {
    throw Error('Invalid PIN entered')
  }

  // console.debug("hello verified");
  return authData.request_id
}

const _step0 = async (config, device) => {
  const uri = buildPairingStepUri(config, device, 0)
  const res = await fetch(`${uri}&type=1`, { mode: 'no-cors' })
}

const _step1HelloServer = async (config, device, pin) => {
  const serverHello = Encryption.generateServerHello("654321", pin)

  const uri = buildPairingStepUri(config, device, 1)
  const res = await fetch(uri,
    {
      method: 'POST',
      body: JSON.stringify({ auth_Data: { auth_type: 'SPC', GeneratorServerHello: serverHello } }),
      headers: { 'Content-Type': 'application/json' }
    })
  const data = await res.json()
  const authData = JSON.parse(data.auth_data)
  return _verifyHelloAuthData(authData)
}

const _step2AckServer = async (config, device, requestId) => {
  const serverAck = Encryption.generateServerAcknowledge()

  const uri = buildPairingStepUri(config, device, 2)
  const res = await fetch(uri, {
    method: 'POST',
    body: JSON.stringify({ auth_Data: { auth_type: 'SPC', request_id: requestId, ServerAckMsg: serverAck } }),
    headers: { 'Content-Type': 'application/json' },
  })
  const data = await res.json()
  const authData = JSON.parse(data.auth_data)
  const authData2 = await _verifyAckAuthData(authData)
  const identity = {
    sessionId: authData2.session_id,
    aesKey: Encryption.getKey(),
  }
  return identity
}

class RemotePairing {
  constructor(deviceConfig, deviceInfo, eventEmitter, identity = null) {
    this.device = deviceInfo
    this.config = deviceConfig
    this.eventEmitter = eventEmitter
    this.identity = identity
  }

  async requestPin() {
    const res = await fetch(`http://${this.config.ip}:8080/ws/apps/CloudPINPage`, { method: 'POST', mode: 'no-cors', cache: 'default' })
    try {
      return await _step0(this.config, this.device)
    } catch (err) {
      throw Error('Failed to require PIN')
    }
  }

  async confirmPin(pin) {
    const requestId = await _step1HelloServer(this.config, this.device, pin)
    const identity = await _step2AckServer(this.config, this.device, requestId)
    this.identity = identity
    this.eventEmitter.emit(TvEvents.PAIRED, identity)
    return identity
  }

  async hidePinConfirmation() {
    await fetch(`http://${this.config.ip}:8080/ws/apps/CloudPINPage/run`, { method: 'DELETE' })
  }

  isPaired() {
    return this.identity !== null
  }
}

module.exports = RemotePairing