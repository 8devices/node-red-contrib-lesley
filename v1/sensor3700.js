'use strict';

const restAPI = require('restserver-api');

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
    node.observe_time = config.interval;
    node.name = config.uuid;
    node.paths = [];
    node.device = new restAPI.Device(node.service.service, node.name);
    node.powerSourceVoltage = config.powerSourceVoltage;
    node.state = false;
    node.cache = {};

    function configure() {
      if (node.powerSourceVoltage) {
        node.device.observe('/3/0/7', (err, resp) => {
          const buf = Buffer.from(resp, 'base64');
          const state = buf[3]; // TODO: parse TLV
          const msg = {};
          msg.payload = {};
          msg.payload.state = node.state;
          msg.payload.event = {
            powerSourceVoltage: state,
          };
          node.cache.powerSourceVoltage = state;
          msg.payload.cache = node.cache;
          node.send(msg);
        }).then(() => {
        }).catch((err) => {
          const msg = {};
          msg.error = err;
          node.send(msg);
        });
      }

      if (node.activePower) {
        node.send(node.activePower);
        node.device.observe('/3305/0/5800', (err, resp) => {
          const buf = Buffer.from(resp, 'base64');
          const state = buf[3]; // TODO: parse TLV
          const msg = {};
          msg.payload = {};
          msg.payload.state = node.state;
          msg.payload.event = {
            activePower: state,
          };
          node.cache.activePower = state;
          msg.payload.cache = node.cache;
          node.send(msg);
        }).then(() => {
        }).catch((err) => {
          const msg = {};
          msg.error = err;
          node.send(msg);
        });
      }

      if (node.activeEnergy) {
        node.device.observe('/3305/0/5805', (err, resp) => {
          const buf = Buffer.from(resp, 'base64');
          const state = buf[3]; // TODO: parse TLV
          const msg = {};
          msg.payload = {};
          msg.payload.state = node.state;
          msg.payload.event = {
            activeEnergy: state,
          };
          node.cache.activeEnergy = state;
          msg.payload.cache = node.cache;
          node.send(msg);
        }).then(() => {
        }).catch((err) => {
          const msg = {};
          msg.error = err;
          node.send(msg);
        });
      }

      if (node.reactivePower) {
        node.device.observe('/3305/0/5815', (err, resp) => {
          const buf = Buffer.from(resp, 'base64');
          const state = buf[3]; // TODO: parse TLV
          const msg = {};
          msg.payload = {};
          msg.payload.state = node.state;
          msg.payload.event = {
            reactivePower: state,
          };
          node.cache.reactivePower = state;
          msg.payload.cache = node.cache;
          node.send(msg);
        }).then((data) => {
          node.send(data);
        }).catch((err) => {
          const msg = {};
          msg.error = err;
          node.send(msg);
        });
      }
      if (node.reactiveEnergy) {
        node.device.observe('/3305/0/5810', (err, resp) => {
          const buf = Buffer.from(resp, 'base64');
          const state = buf[3]; // TODO: parse TLV
          const msg = {};
          msg.payload = {};
          msg.payload.state = node.state;
          msg.payload.event = {
            reactiveEnergy: state,
          };
          node.cache.reactiveEnergy = state;
          msg.payload.cache = node.cache;
          node.send(msg);
        }).then(() => {
        }).catch((err) => {
          const msg = {};
          msg.error = err;
          node.send(msg);
        });
      }
      if (node.relay) {
        node.device.observe('/3312/0/5850', (err, resp) => {
          const buf = Buffer.from(resp, 'base64');
          const state = buf[3]; // TODO: parse TLV
          const msg = {};
          msg.title = 'Relay';
          msg.payload = {};
          msg.payload.state = node.state;
          msg.payload.event = {
            relay: state,
          };
          node.cache.relay = state;
          msg.payload.cache = node.cache;
          node.send(msg);
        }).then(() => {
        }).catch((err) => {
          const msg = {};
          msg.error = err;
          node.send(msg);
        });
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
      msg.payload.event = {};
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
      msg.payload.event = {};
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
