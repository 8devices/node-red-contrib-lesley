'use strict';

const restAPI = require('restserver-api');

const { Lwm2m } = restAPI;
const { RESOURCE_TYPE, encodeResource, decodeResource } = Lwm2m.TLV;

module.exports = function (RED) {
  function SensorNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.service = RED.nodes.getNode(config.service);
    node.observationInterval = Number(config.interval);
    node.name = config.uuid;
    node.paths = [];
    node.device = new restAPI.Device(node.service.service, node.name);
    node.state = false;
    node.cache = {};
    node.resources = [];

    function addResource(resourceName, resourcePath, resourceType, resourceNeed) {
      const resource = {
        name: resourceName,
        path: resourcePath,
        type: resourceType,
        need: resourceNeed,
      };
      node.resources.push(resource);
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
      }).catch((err) => {
        if (typeof err === 'number') {
          node.error(`Error code: ${err}`);
        } else {
          node.error(err);
        }
      });
    }

    function configure() {
      addResource('screenText', '/3341/0/5527', RESOURCE_TYPE.STRING, config.screenText);
      addResource('temperatureBME', '/3303/2/5700', RESOURCE_TYPE.FLOAT, config.temperatureBME);
      addResource('humidityBME', '/3304/2/5700', RESOURCE_TYPE.FLOAT, config.humidityBME);
      addResource('pressureBME', '/3315/2/5700', RESOURCE_TYPE.FLOAT, config.pressureBME);
      addResource('gasBME', '/3327/2/5700', RESOURCE_TYPE.FLOAT, config.gasBME);
      addResource('accelerometerX', '/3313/0/5702', RESOURCE_TYPE.FLOAT, config.accelerometerX);
      addResource('accelerometerY', '/3313/0/5703', RESOURCE_TYPE.FLOAT, config.accelerometerY);
      addResource('accelerometerZ', '/3313/0/5704', RESOURCE_TYPE.FLOAT, config.accelerometerZ);
      addResource('gyroscopeX', '/3334/0/5702', RESOURCE_TYPE.FLOAT, config.gyroscopeX);
      addResource('gyroscopeY', '/3334/0/5703', RESOURCE_TYPE.FLOAT, config.gyroscopeY);
      addResource('gyroscopeZ', '/3334/0/5704', RESOURCE_TYPE.FLOAT, config.gyroscopeZ);
      addResource('magnetometerX', '/3314/0/5702', RESOURCE_TYPE.FLOAT, config.magnetometerX);
      addResource('magnetometerY', '/3314/0/5703', RESOURCE_TYPE.FLOAT, config.magnetometerY);
      addResource('magnetometerZ', '/3314/0/5704', RESOURCE_TYPE.FLOAT, config.magnetometerZ);
      addResource('temperatureHDC', '/3303/1/5700', RESOURCE_TYPE.FLOAT, config.temperatureHDC);
      addResource('humidityHDC', '/3304/1/5700', RESOURCE_TYPE.FLOAT, config.humidityHDC);
      addResource('illuminance', '/3301/0/5700', RESOURCE_TYPE.FLOAT, config.illuminance);

      node.device.write('/1/0/3', () => {
      }, encodeResource({
        identifier: 3,
        type: RESOURCE_TYPE.INTEGER,
        value: node.observationInterval,
      }));

      node.resources.forEach((resource) => {
        if (resource.need) {
          observe(resource.path, resource.name, resource.type);
        }
      });
    }

    node.on('input', (msg) => {
      if (typeof msg.payload === 'string' || typeof msg.payload === 'number') {
        let argument;
        if (typeof msg.payload === 'string') {
          argument = msg.payload;
        } else if (typeof msg.payload === 'number') {
          argument = msg.payload.toString();
        }
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
      msg.payload.state = node.state;
      msg.payload.data = {};
      msg.payload.cache = node.cache;
      node.send(msg);
      configure();
    });

    node.device.on('update', () => {
      node.state = true;
    });

    node.device.on('deregister', () => {
      const msg = {};
      msg.payload = {};
      node.state = false;
      msg.payload.state = node.state;
      msg.payload.data = {};
      msg.payload.cache = node.cache;
      node.send(msg);
    });

    node.device.getObjects().then(() => {
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
          const msg = {};
          msg.payload = {};
          node.state = false;
          msg.payload.state = node.state;
          msg.payload.data = {};
          msg.payload.cache = node.cache;
          node.send(msg);
        } else {
          node.error(`Error code: ${err}`);
        }
      } else {
        node.error(err);
      }
    });
  }
  RED.nodes.registerType('sensor5200 in', SensorNode);
  SensorNode.prototype.close = function () {
    const node = this;
    this.resources.forEach((resource) => {
      if (resource.need) {
        node.device.cancelObserve(resource.path).catch((err) => {
          node.error(`Error stopping ${resource.name} observation (${node.name}/${resource.path}):${err}`);
        });
      }
    });
  };
};
