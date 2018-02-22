'use strict';

const restAPI = require('restserver-api');

module.exports = function (RED) {
  function SensorNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.service = RED.nodes.getNode(config.service);

    node.powerSourceVoltage = config.powerSourceVoltage;
    node.temperature = config.temperature;
    node.humidity = config.humidity;
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

    if (node.temperature) {
      // node.paths.push('/3303/0/5700');
      node.device.observe('/3303/0/5700', (err, resp) => {
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

    if (node.humidity) {
      // node.paths.push('/3304/0/5700');
      node.device.observe('/3304/0/5700', (err, resp) => {
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
  RED.nodes.registerType('sensor3800 in', SensorNode);
};
