'use strict';

const restAPI = require('restserver-api');
const { decodeTLV } = require('../nodes/lwm2m.js');

module.exports = function (RED) {
  function SensorNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.service = RED.nodes.getNode(config.service);

    node.name = config.uuid;
    node.resourcePath = config.uri;
    node.resourceType = config.resourceType;
    node.device = new restAPI.Device(node.service.service, node.name);

    node.on('input', (input) => {
      node.device.read(node.resourcePath, (response) => {
        const msg = {};
        msg.payload = {};
        msg.payload.data = {};
        const buffer = Buffer.from(response, 'base64');
        const objectsList = decodeTLV(buffer, node);
        switch (node.resourceType) {
          case 'integer':
            msg.payload.data[node.resourcePath] = objectsList[0].getIntegerValue();
            break;
          case 'float':
            msg.payload.data[node.resourcePath] = objectsList[0].getFloatValue();
            break;
          case 'string':
            msg.payload.data[node.resourcePath] = objectsList[0].getStringValue();
            break;
          case 'boolean':
            msg.payload.data[node.resourcePath] = objectsList[0].getBooleanValue();
            break;
          case 'opaque':
            msg.payload.data[node.resourcePath] = objectsList[0].getBinaryValue();
            break;
          default:
            msg.payload.data[node.resourcePath] = objectsList[0].getStringValue();
        }
        node.send(msg);
      }).then((data) => {
        node.send(data);
      }).catch((err) => {
        const msg = {};
        msg.error = err;
        node.send(msg);
      });
    });

  }
  RED.nodes.registerType('sensor read in', SensorNode);
};
