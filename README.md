# React Native - Samsung TV Remote Control

This project is a proof of concept to remote control Samsung TV which require encrypted communication with the internal web service of the TV.

## TOC

- [Installation](#installation)
- [Usage](#usage)
- [Find Lan Devices](#find-lan-devices)
- [Initialize](#initialize)
- [Request PIN](#request-pin)
- [Confirm PIN](#confirm-pin)
- [Connect](#connect)
- [Send Key](#send-key)
- [Key Codes](#key-codes)
- [License](#license)
- [Donate](#donate)

## Installation

Using npm:

```shell
npm i @ersinayaz/rn-samsung-tv-remote
```

or using yarn:

```shell
yarn add @ersinayaz/rn-samsung-tv-remote
```

## Usage

```js
import { SamsungRemote, DeviceDiscovery } from '@ersinayaz/rn-samsung-tv-remote';

```

### Find Lan Devices:

```js
// ...
const devices = await DeviceDiscovery.discover("urn:samsung.com:device:RemoteControlReceiver:1");
```

devices:

```js
[{"info": {"address": "192.168.1.xxx", "family": "IPv4", "port": 38092, "size": 347}, "target": "urn:samsung.com:device:RemoteControlReceiver:1"}]
```

### Initialize

```js
const tv = new SamsungRemote({ ip: device[0].info.address });
tv.init();
```
or
```js
const tv = new SamsungRemote({ ip: device[0].info.address });
// identity = await tv.confirmPin("xxxx")
tv.init(identity);
```

### Request PIN

```js
tv.requestPin();
```

### Confirm PIN

```js
const identity = await tv.confirmPin("xxxx")
```

### Connect

```js
await tv.connect()
```

### Send Key

```js
tv.sendKey("KEY_MUTE");
```

### onConnected Event

```js
// It must be defined before the tv.connect() command.
tv.onConnected(()=>{
    alert("Connected")
});
```

## Key Codes

The list of accepted keys may vary depending on the TV model, but the following list has some common key codes and their descriptions.

| KEY         | Description   |
|-------------|:-------------:|
| KEY_POWER   | Power Off     |
| KEY_MENU    | Menu          |
| KEY_CONTENTS| Smart Hub     |
| KEY_HOME    | Home          |
| KEY_UP      | Up            |
| KEY_DOWN    | Down          |
| KEY_LEFT    | Left          |
| KEY_RIGHT   | Right         |
| KEY_VOLUP   | Volume Up     |
| KEY_VOLDOWN | Volume Down   |
| KEY_MUTE    | Mute          |
| KEY_CHLIST  | Channel List  |
| KEY_CHUP    | Channel Up    |
| KEY_CHDOWN  | Channel Down  |
| KEY_SOURCE  | Source        |
| KEY_INFO    | Info          |
| KEY_HELP    | Help          |
| KEY_TOOLS   | Tools         |
| KEY_GUIDE   | Guide         |
| KEY_RETURN  | Return        |
| KEY_PLAY    | Play          |
| KEY_PAUSE   | Pause         |
| KEY_STOP    | Stop          |
| KEY_REC     | Record        |
| KEY_0       | 0             |
| KEY_1       | 1             |
| KEY_2       | 2             |
| KEY_3       | 3             |
| KEY_4       | 4             |
| KEY_5       | 5             |
| KEY_6       | 6             |
| KEY_7       | 7             |
| KEY_8       | 8             |
| KEY_9       | 9             |

Click for other keys: (https://github.com/ersinayaz/rn-samsung-tv-remote/blob/master/Keys.md)

## License

MIT

## Donate

| Crypto      | Wallet                                      |
|-------------|:-------------------------------------------:|
| BTC         | bc1qhq65mvfx4a6pdad386t85lm7ac6c2th535f2u0  |
| ETH         | 0xf053943DB59c8aE80570EdE12bAD33f26788CE6F  |
| USDT        | 0xf053943DB59c8aE80570EdE12bAD33f26788CE6F  |

[![Bitcoin Donate Button](http://ersinayaz.github.io/Bitcoin-Donate-button.png)](https://ersinayaz.github.io/)