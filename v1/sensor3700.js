'use strict';

const restAPI = require('restserver-api');
const { RESOURCE_TYPE, encodeResourceTLV, decodeTLV } = require('../nodes/lwm2m.js');

module.exports = function (RED) {
  function SensorNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.service = RED.nodes.getNode(config.service);

    node.powerSourceVoltage = config.powerSourceVoltage;
    node.activePower = config.activePower;
    node.activeEnergy = config.activeEnergy;
    node.reactivePower = config.reactivePower;
    node.reactiveEnergy = config.reactiveEnergy;
    node.relay = config.relay;
    node.observationInterval = Number(config.interval);
    node.name = config.uuid;
    node.paths = [];
    node.device = new restAPI.Device(node.service.service, node.name);
    node.powerSourceVoltage = config.powerSourceVoltage;
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
        msg.error = err;
        node.send(msg);
      });
    }

    function configure() {
      node.device.write('/1/0/3', () => {
      }, encodeResourceTLV(3, node.observationInterval, RESOURCE_TYPE.INTEGER));

      if (node.powerSourceVoltage) {
        observe('/3/0/7', 'powerSourceVoltage', RESOURCE_TYPE.INTEGER);
      }

      if (node.activePower) {
        observe('/3305/0/5800', 'activePower', RESOURCE_TYPE.FLOAT);
      }

      if (node.activeEnergy) {
        observe('/3305/0/5805', 'activeEnergy', RESOURCE_TYPE.FLOAT);
      }

      if (node.reactivePower) {
        observe('/3305/0/5815', 'reactivePower', RESOURCE_TYPE.FLOAT);
      }

      if (node.reactiveEnergy) {
        observe('/3305/0/5810', 'reactiveEnergy', RESOURCE_TYPE.FLOAT);
      }

      if (node.relay) {
        observe('/3312/0/5850', 'relay', RESOURCE_TYPE.BOOLEAN);
      }
    }

    node.on('input', (msg) => {
      node.device.getObjects().then((data) => {
        node.send(data);
      }).catch((err) => {
        msg.error = err;
        node.send(msg);
      });
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
      msg.payload = `[Sensor3700-${node.device.id}] Sensor is already registered`;
      node.send(msg);
      node.state = true;
      configure();
    }).catch((err) => {
      const msg = {};
      if (err === 404) {
        msg.payload = `[Sensor3700-${node.device.id}] Sensor is not yet registered. Waiting for registration event...`;
        node.send(msg);
      }
    });
  }
  RED.nodes.registerType('sensor3700 in', SensorNode);
  SensorNode.prototype.close = function () {
    // Stop all observations
  };
};
