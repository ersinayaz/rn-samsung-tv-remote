import dgram from 'react-native-udp';
const { Buffer } = require('buffer/');

const broadcastSsdp = (socket, target) => {
    const query = Buffer.from(
        'M-SEARCH * HTTP/1.1\r\n'
        + 'HOST: "239.255.255.250:1900"\r\n'
        + 'MAN: "ssdp:discover"\r\n'
        + 'MX: 1\r\n'
        + `ST: ${target}\r\n\r\n`,
    );
    socket.send(query, 0, query.length, 1900, "239.255.255.250");
};

const DeviceDiscovery =
{
    discover(urn) {
        const socket = dgram.createSocket('udp4');
        const devices = [];

        socket.on('listening', () => {
            broadcastSsdp(socket, urn);
        });

        socket.on('message', (chunk, info) => {
            const buffer = Buffer.from(chunk);
            const response = buffer.toString().trim().split('\r\n');

            response.forEach((item) => {
                const splitter = item.indexOf(':');
                if (splitter > -1) {
                    const header = item.slice(0, splitter);
                    const value = item.slice(splitter, item.length).replace(": ", "");

                    if (header === "ST" && value === urn) {
                        devices.push({ target: urn, info })
                    }
                }
            });
        });

        socket.bind(1900, "0.0.0.0");

        return new Promise((resolve) => 
        {
            setTimeout(() => 
            {
                socket.close();
                resolve(devices);
            }, 2000);
        });
    }
}

export default DeviceDiscovery;