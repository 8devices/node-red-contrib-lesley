'use strict';

const restAPI = require('restserver-api');
const { RESOURCE_TYPE, encodeResourceTLV } = require('../nodes/lwm2m.js');

module.exports = function (RED) {
  function SensorNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.service = RED.nodes.getNode(config.service);

    node.name = config.uuid;
    node.resourcePath = config.uri;
    node.resourceType = config.resourceType;
    node.resourceValue = config.resourceValue;
    node.valueSource = config.valueSource;

    node.device = new restAPI.Device(node.service.service, node.name);

    node.on('input', (input) => {
      let value;
      switch (node.valueSource) {
        case 'textbox': {
          value = node.resourceValue;
          break;
        }

        case 'input': {
          value = input.payload;
          break;
        }

        default:
          return;
      }

      if (node.resourcePath.split('/').length === 4) {
        const resourceIdentifier = node.resourcePath.split('/')[3];
        let tlvBuffer;
        switch (node.resourceType) {
          case 'integer':
            value = Number(value);
            tlvBuffer = encodeResourceTLV(resourceIdentifier, value, RESOURCE_TYPE.INTEGER);
            break;
          case 'float':
            value = Number(value);
            tlvBuffer = encodeResourceTLV(resourceIdentifier, value, RESOURCE_TYPE.FLOAT);
            break;
          case 'string':
            tlvBuffer = encodeResourceTLV(resourceIdentifier, value, RESOURCE_TYPE.STRING);
            break;
          case 'boolean':
            value = Boolean(value);
            tlvBuffer = encodeResourceTLV(resourceIdentifier, value, RESOURCE_TYPE.BOOLEAN);
            break;
          case 'opaque':
            value = Buffer.from(value);
            tlvBuffer = encodeResourceTLV(resourceIdentifier, value, RESOURCE_TYPE.OPAQUE);
            break;
          default:
            return;
        }

        node.device.write(node.resourcePath, (statusCode) => {
          const msg = {};
          msg.payload = {};
          msg.payload.code = {};
          msg.payload.code[node.resourcePath] = statusCode;
          node.send(msg);
        }, tlvBuffer).then((data) => {
          node.send(data);
        }).catch((err) => {
          const msg = {};
          msg.error = err;
          node.send(msg);
        });
      }
    });
  }
  RED.nodes.registerType('sensor write in', SensorNode);
};
