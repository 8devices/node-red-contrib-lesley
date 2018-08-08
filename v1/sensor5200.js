'use strict';

const restAPI = require('restserver-api');

const { Lwm2m } = restAPI;
const { RESOURCE_TYPE, encodeResource, decodeResource } = Lwm2m.TLV;

module.exports = function (RED) {
  function SensorNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.service = RED.nodes.getNode(config.service);
    node.service.attach(node);

    node.observationInterval = Number(config.interval);
    node.name = config.uuid;
    node.paths = [];
    node.device = new restAPI.Device(node.service.service, node.name);
    node.state = false;
    node.cache = {};
    node.resources = [
      {
        name: 'batteryVoltage', path: '/3/0/7', type: RESOURCE_TYPE.INTEGER, need: config.batteryVoltage,
      },
      {
        name: 'screenText', path: '/3341/0/5527', type: RESOURCE_TYPE.STRING, need: config.screenText,
      },
      {
        name: 'temperatureBME', path: '/3303/2/5700', type: RESOURCE_TYPE.FLOAT, need: config.temperatureBME,
      },
      {
        name: 'humidityBME', path: '/3304/2/5700', type: RESOURCE_TYPE.FLOAT, need: config.humidityBME,
      },
      {
        name: 'pressureBME', path: '/3315/2/5700', type: RESOURCE_TYPE.FLOAT, need: config.pressureBME,
      },
      {
        name: 'gasBME', path: '/3327/2/5700', type: RESOURCE_TYPE.FLOAT, need: config.gasBME,
      },
      {
        name: 'accelerometerX', path: '/3313/0/5702', type: RESOURCE_TYPE.FLOAT, need: config.accelerometerX,
      },
      {
        name: 'accelerometerY', path: '/3313/0/5703', type: RESOURCE_TYPE.FLOAT, need: config.accelerometerY,
      },
      {
        name: 'accelerometerZ', path: '/3313/0/5704', type: RESOURCE_TYPE.FLOAT, need: config.accelerometerZ,
      },
      {
        name: 'gyroscopeX', path: '/3334/0/5702', type: RESOURCE_TYPE.FLOAT, need: config.gyroscopeX,
      },
      {
        name: 'gyroscopeY', path: '/3334/0/5703', type: RESOURCE_TYPE.FLOAT, need: config.gyroscopeY,
      },
      {
        name: 'gyroscopeZ', path: '/3334/0/5704', type: RESOURCE_TYPE.FLOAT, need: config.gyroscopeZ,
      },
      {
        name: 'magnetometerX', path: '/3314/0/5702', type: RESOURCE_TYPE.FLOAT, need: config.magnetometerX,
      },
      {
        name: 'magnetometerY', path: '/3314/0/5703', type: RESOURCE_TYPE.FLOAT, need: config.magnetometerY,
      },
      {
        name: 'magnetometerZ', path: '/3314/0/5704', type: RESOURCE_TYPE.FLOAT, need: config.magnetometerZ,
      },
      {
        name: 'temperatureHDC', path: '/3303/1/5700', type: RESOURCE_TYPE.FLOAT, need: config.temperatureHDC,
      },
      {
        name: 'humidityHDC', path: '/3304/1/5700', type: RESOURCE_TYPE.FLOAT, need: config.humidityHDC,
      },
      {
        name: 'illuminance', path: '/3301/0/5700', type: RESOURCE_TYPE.FLOAT, need: config.illuminance,
      },
    ];

    function setStatus(state) {
      if (state) {
        node.status({ fill: 'green', shape: 'dot', text: 'connected' });
      } else if (state !== undefined && !state) {
        node.status({ fill: 'red', shape: 'dot', text: 'disconnected' });
      } else if (!state) {
        node.status({ fill: 'grey', shape: 'dot', text: 'unknown' });
      }
    }

    function observe(resourcePath, resourceName, resourceType) {
      node.device.observe(resourcePath, (err, response) => {
        const msg = {};
        const buffer = Buffer.from(response, 'base64');
        const decodedResource = decodeResource(buffer, {
          identifier: Number(resourcePath.split('/')[3]),
          type: resourceType,
        });
        const resourceValue = decodedResource.value;
        msg.payload = {
          state: node.state,
          data: {},
        };
        msg.payload.data[resourceName] = resourceValue;
        node.cache[resourceName] = resourceValue;
        msg.payload.cache = node.cache;
        node.send(msg);
      }).then((resp) => {
        for (let i = 0; i < node.resources.length; i += 1) {
          if (node.resources[i].name === resourceName) {
            node.resources[i].observeAsyncID = resp;
          }
        }
      }).catch((err) => {
        if (typeof err === 'number') {
          node.error(`Error starting observation, code: ${err}`);
        } else {
          node.error(err);
        }
      });
    }

    function configure() {
      node.device.write('/1/0/3', () => {
      }, encodeResource({
        identifier: 3,
        type: RESOURCE_TYPE.INTEGER,
        value: node.observationInterval,
      })).then(() => {
        node.resources.forEach((resource) => {
          if (resource.need) {
            observe(resource.path, resource.name, resource.type);
          }
        });
      }).catch((err) => {
        if (typeof err === 'number') {
          node.error(`Error setting observation time interval, code: ${err}`);
        } else {
          node.error(err);
        }
      });
    }

    setStatus();

    node.on('input', (msg) => {
      if (typeof msg.payload === 'string' || typeof msg.payload === 'number') {
        const argument = msg.payload.toString();
        node.device.write('/3341/0/5527', () => {
        }, encodeResource({
          identifier: 5527,
          type: RESOURCE_TYPE.STRING,
          value: argument,
        }));
      } else {
        node.error('Input message payload should be a number or a string');
      }
    });

    node.device.on('register', () => {
      const msg = {};
      msg.payload = {};
      node.state = true;
      setStatus(node.state);
      msg.payload.state = node.state;
      msg.payload.data = {};
      msg.payload.cache = node.cache;
      node.send(msg);
      configure();
    });

    node.device.on('update', () => {
      node.state = true;
      setStatus(node.state);
    });

    node.device.on('deregister', () => {
      const msg = {};
      msg.payload = {};
      node.state = false;
      setStatus(node.state);
      msg.payload.state = node.state;
      msg.payload.data = {};
      msg.payload.cache = node.cache;
      node.send(msg);
    });

    node.service.on('started', () => {
      node.device.getObjects().then(() => {
        const msg = {};
        msg.payload = {};
        node.state = true;
        setStatus(node.state);
        msg.payload.state = node.state;
        msg.payload.data = {};
        msg.payload.cache = node.cache;
        node.send(msg);
        configure();
      }).catch((err) => {
        if (typeof err === 'number') {
          if (err === 404) {
            const msg = {};
            msg.payload = {};
            node.state = false;
            setStatus(node.state);
            msg.payload.state = node.state;
            msg.payload.data = {};
            msg.payload.cache = node.cache;
            node.send(msg);
          } else {
            node.error(`Error getting objects for endpoint, code: ${err}`);
          }
        } else {
          node.error(err);
        }
      });
    });

    node.on('close', (done) => {
      const cancelObservationPromises = [];

      for (let i = 0; i < node.resources.length; i += 1) {
        if (node.resources[i].observeAsyncID !== undefined) {
          cancelObservationPromises.push(node.device.cancelObserve(node.resources[i].path));
        }
      }

      Promise.all(cancelObservationPromises).catch((err) => {
        node.error(err);
      }).finally(() => {
        node.service.detach(node);
        done();
      });
    });
  }

  RED.nodes.registerType('sensor5200 in', SensorNode);
};
