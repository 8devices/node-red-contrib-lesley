'use strict';

const restAPI = require('restserver-api');

module.exports = function (RED) {
  function SensorNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.service = RED.nodes.getNode(config.service);

    node.powerSourceVoltage = config.powerSourceVoltage ;
    node.voltage = config.voltage;
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
        //node.paths.push('/3/0/7');
        node.device.observe('/3/0/7', (err, resp) => {
          let msg = {};
          msg.response = resp;
          msg.title = "observation response";
          const buf = Buffer.from(resp, 'base64');
          let state = buf[3]; // TODO: parse TLV
          msg.payload = state;
          node.error(err);
          node.send(msg);
        });
      }

      if (node.voltage) {
        //node.paths.push('/3202/0/5600');
        node.device.observe('/3202/0/5600', (err, resp) => {
          let msg = {};
          msg.response = resp;
          msg.title = "observation response";
          const buf = Buffer.from(resp, 'base64');
          let state = buf[3]; // TODO: parse TLV
          msg.payload = state;
          node.error(err);
          node.send(msg);
        });
      }
      //const PutRequest = node.device.put('/1/0/3', node.period, (data) => {
    }
  // }
  RED.nodes.registerType('sensor4500 in', SensorNode);
};
