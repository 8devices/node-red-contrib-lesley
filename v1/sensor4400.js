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

    node.powerSourceVoltage = config.powerSourceVoltage;
    node.magneticField = config.magneticField;
    node.magneticCounter = config.magneticCounter;
    node.temperature = config.temperature;
    node.observationInterval = Number(config.interval);
    node.name = config.uuid;
    node.paths = [];
    node.device = new restAPI.Device(node.service.service, node.name);
    node.state = false;
    node.cache = {};
    node.resources = [
      {
        name: 'powerSourceVoltage', path: '/3/0/7', type: RESOURCE_TYPE.INTEGER, need: node.powerSourceVoltage,
      },
      {
        name: 'magneticField', path: '/3200/0/5500', type: RESOURCE_TYPE.BOOLEAN, need: node.magneticField,
      },
      {
        name: 'magneticCounter', path: '/3200/0/5501', type: RESOURCE_TYPE.INTEGER, need: node.magneticCounter,
      },
      {
        name: 'temperature', path: '/3303/0/5700', type: RESOURCE_TYPE.FLOAT, need: node.temperature,
      },
    ];

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

    node.on('input', (msg) => {
      let relayState;
      if (msg.payload) {
        relayState = true;
      } else {
        relayState = false;
      }
      node.device.write('/3312/0/5850', () => {
      }, encodeResource({
        identifier: 5850,
        type: RESOURCE_TYPE.BOOLEAN,
        value: relayState,
      }));
    });

    node.device.on('register', () => {
      node.status({ fill: 'green', shape: 'dot', text: 'connected' });
      const msg = {};
      msg.payload = {};
      node.state = true;
      msg.payload.state = node.state;
      msg.payload.data = {};
      msg.payload.cache = node.cache;
      node.send(msg);
      configure();
    });

    node.device.on('update', () => {
      node.status({ fill: 'green', shape: 'dot', text: 'connected' });
      node.state = true;
    });

    node.device.on('deregister', () => {
      node.status({ fill: 'red', shape: 'dot', text: 'disconnected' });
      const msg = {};
      msg.payload = {};
      node.state = false;
      msg.payload.state = node.state;
      msg.payload.data = {};
      msg.payload.cache = node.cache;
      node.send(msg);
    });

    node.service.on('started', () => {
      node.device.getObjects().then(() => {
        node.status({ fill: 'green', shape: 'dot', text: 'connected' });
        const msg = {};
        msg.payload = {};
        node.state = true;
        msg.payload.state = node.state;
        msg.payload.data = {};
        msg.payload.cache = node.cache;
        node.send(msg);
        configure();
      }).catch((err) => {
        if (typeof err === 'number') {
          if (err === 404) {
            node.status({ fill: 'red', shape: 'dot', text: 'disconnected' });
            const msg = {};
            msg.payload = {};
            node.state = false;
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
      })
        .finally(() => {
          node.service.deattach(node);
          done();
        });
    });
  }

  RED.nodes.registerType('sensor4400 in', SensorNode);
};

