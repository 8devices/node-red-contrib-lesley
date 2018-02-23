'use strict';

const restAPI = require('restserver-api');
const lwm2m = require('../nodes/lwm2m.js');

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
    // node.message = {};
    // node.message.payload = {};

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
      // this.configure();
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

    if (node.powerSourceVoltage) {
      node.device.observe('/3/0/7', (err, resp) => {
        const buffer = Buffer.from(resp, 'base64');
        const objectsList = lwm2m.parseTLV(buffer, node);
        const state = objectsList[0].getIntegerValue();
        const msg = {};
        msg.payload = {};
        msg.payload.state = node.state;
        msg.payload.data = {
          powerSourceVoltage: state,
        };
        node.cache.powerSourceVoltage = state;
        msg.payload.cache = node.cache;
        node.send(msg);
      });
    }

    if (node.activePower) {
      node.send(node.activePower);
      node.device.observe('/3305/0/5800', (err, resp) => {
        const buffer = Buffer.from(resp, 'base64');
        const objectsList = lwm2m.parseTLV(buffer, node);
        const state = objectsList[0].getFloatValue();
        const msg = {};
        msg.payload = {};
        msg.payload.state = node.state;
        msg.payload.data = {
          activePower: state,
        };
        node.cache.activePower = state;
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

    if (node.activeEnergy) {
      node.device.observe('/3305/0/5805', (err, resp) => {
        const buffer = Buffer.from(resp, 'base64');
        const objectsList = lwm2m.parseTLV(buffer, node);
        const state = objectsList[0].getFloatValue();
        const msg = {};
        msg.payload = {};
        msg.payload.state = node.state;
        msg.payload.data = {
          activeEnergy: state,
        };
        node.cache.activeEnergy = state;
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

    if (node.reactivePower) {
      node.device.observe('/3305/0/5815', (err, resp) => {
        const buffer = Buffer.from(resp, 'base64');
        const objectsList = lwm2m.parseTLV(buffer, node);
        const state = objectsList[0].getFloatValue();
        const msg = {};
        msg.payload = {};
        msg.payload.state = node.state;
        msg.payload.data = {
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
        const buffer = Buffer.from(resp, 'base64');
        const objectsList = lwm2m.parseTLV(buffer, node);
        const state = objectsList[0].getFloatValue();
        const msg = {};
        msg.payload = {};
        msg.payload.state = node.state;
        msg.payload.data = {
          reactiveEnergy: state,
        };
        node.cache.reactiveEnergy = state;
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
    if (node.relay) {
      node.device.observe('/3312/0/5850', (err, resp) => {
        const buffer = Buffer.from(resp, 'base64');
        const objectsList = lwm2m.parseTLV(buffer, node);
        const state = objectsList[0].getBooleanValue();
        const msg = {};
        msg.payload = {};
        msg.payload.state = node.state;
        msg.payload.data = {
          relay: state,
        };
        node.cache.relay = state;
        msg.payload.cache = node.cache;
        node.send(msg);
      });
    }
    // const PutRequest = node.device.put('/1/0/3', node.period, (data) => {
  }
  RED.nodes.registerType('sensor3700 in', SensorNode);
  /* function containsObject(obj, list) {
    let i;
    for (i = 0; i < list.length; i++) {
      if (list[i] === obj) {
        return true;
      }
    }
    return false;
  } */
};
