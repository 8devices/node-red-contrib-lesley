'use strict';

const restAPI = require('restserver-api');
const { RESOURCE_TYPE, encodeResourceTLV, decodeTLV } = require('../nodes/lwm2m.js');

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

    function observe(resourcePath, resourceName, resourceType) {
      node.device.observe(resourcePath, (err, response) => {
        const msg = {};
        const buffer = Buffer.from(response, 'base64');
        const objectsList = decodeTLV(buffer, node);
        const resourceValue = objectsList[0].getValue(resourceType);
        msg.payload = {
          state: node.state,
          data: {},
        };
        msg.payload.data[resourceName] = resourceValue;
        node.cache[resourceName] = resourceValue;
        msg.payload.cache = node.cache;
        node.send(msg);
      }).then(() => {
      }).catch((err) => {
        const msg = {};
        msg.payload = err;
        node.error(msg);
      });
    }

    function configure() {
      node.device.write('/1/0/3', () => {
      }, encodeResourceTLV(3, node.observationInterval, RESOURCE_TYPE.INTEGER));

      if (node.powerSourceVoltage) {
        observe('/3/0/7', 'powerSourceVoltage', RESOURCE_TYPE.INTEGER);
      }

      if (node.voltage) {
        observe('/3202/0/5600', 'voltage', RESOURCE_TYPE.FLOAT);
      }
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
      if (err === 404) {
        const msg = {};
        msg.payload = {};
        node.state = false;
        msg.payload.state = node.state;
        msg.payload.data = {};
        msg.payload.cache = node.cache;
        node.send(msg);
      } else {
        const msg = {};
        msg.payload = err;
        node.error(msg);
      }
    });
  }
  RED.nodes.registerType('sensor4500 in', SensorNode);
};
