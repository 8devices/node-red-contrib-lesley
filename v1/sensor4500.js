'use strict';

const restAPI = require('restserver-api');

const { Lwm2m } = restAPI;
const { RESOURCE_TYPE, encodeResource, decodeResource } = Lwm2m.TLV;

module.exports = function (RED) {
  function SensorNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.service = RED.nodes.getNode(config.service);

    node.powerSourceVoltage = config.powerSourceVoltage;
    node.voltage = config.voltage;
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
      addResource('powerSourceVoltage', '/3/0/7', RESOURCE_TYPE.INTEGER, node.powerSourceVoltage);
      addResource('voltage', '/3202/0/5600', RESOURCE_TYPE.FLOAT, node.voltage);

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
  RED.nodes.registerType('sensor4500 in', SensorNode);
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
