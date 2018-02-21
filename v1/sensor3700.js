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

    node.on('input', (msg) => {
      node.device.getObjects().then((data) => {
        node.send(data);
      }).catch((err) => {
        msg.error = err;
        node.send(msg);
      });
    });

    // configure() {
    if (node.powerSourceVoltage) {
      // node.paths.push('/3/0/7');
      node.device.observe('/3/0/7', (err, resp) => {
        const msg = {};
        msg.response = resp;
        msg.title = 'observation response';
        const buf = Buffer.from(resp, 'base64');
        const state = buf[3]; // TODO: parse TLV
        msg.payload = state;
        node.error(err);
        node.send(msg);
      });
    }

    if (node.activePower) {
      // node.paths.push('/3305/0/5800');
      node.device.observe('/3305/0/5800', (err, resp) => {
        const msg = {};
        msg.response = resp;
        msg.title = 'observation response';
        const buf = Buffer.from(resp, 'base64');
        const state = buf[3]; // TODO: parse TLV
        msg.payload = state;
        node.error(err);
        node.send(msg);
      });
    }

    if (node.activeEnergy) {
      // node.paths.push('/3305/0/5805');
      node.device.observe('/3305/0/5805', (err, resp) => {
        const msg = {};
        msg.response = resp;
        msg.title = 'observation response';
        const buf = Buffer.from(resp, 'base64');
        const state = buf[3]; // TODO: parse TLV
        msg.payload = state;
        node.error(err);
        node.send(msg);
      });
    }

    if (node.reactivePower) {
      // node.paths.push('/3305/0/5815');
      node.device.observe('/3305/0/5815', (err, resp) => {
        const msg = {};
        msg.response = resp;
        msg.title = 'observation response';
        const buf = Buffer.from(resp, 'base64');
        const state = buf[3]; // TODO: parse TLV
        msg.payload = state;
        node.error(err);
        node.send(msg);
      });
    }

    if (node.reactiveEnergy) {
      // node.paths.push('/3305/0/5810');
      node.device.observe('/3305/0/5810', (err, resp) => {
        const msg = {};
        msg.response = resp;
        msg.title = 'observation response';
        const buf = Buffer.from(resp, 'base64');
        const state = buf[3]; // TODO: parse TLV
        msg.payload = state;
        node.error(err);
        node.send(msg);
      });
    }

    if (node.relay) {
      // node.paths.push('/3312/0/5850');
      node.device.observe('/3312/0/5850', (err, resp) => {
        const msg = {};
        msg.response = resp;
        msg.title = 'observation response';
        const buf = Buffer.from(resp, 'base64');
        const state = buf[3]; // TODO: parse TLV
        msg.payload = state;
        node.error(err);
        node.send(msg);
      });
    }

    // const PutRequest = node.device.put('/1/0/3', node.period, (data) => {
  }
  // }
  RED.nodes.registerType('sensor3700 in', SensorNode);
};
