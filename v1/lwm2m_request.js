'use strict';

const restAPI = require('restserver-api');
const { RESOURCE_TYPE, encodeResourceTLV, decodeTLV } = require('../nodes/lwm2m.js');

module.exports = function (RED) {
  function SensorNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.service = RED.nodes.getNode(config.service);

    node.name = config.uuid;
    node.requestType = config.requestType;
    node.resourcePath = config.uri;
    node.resourceType = config.resourceType;
    node.resourceValue = config.resourceValue;
    node.valueSource = config.valueSource;

    node.device = new restAPI.Device(node.service.service, node.name);

    switch (node.requestType) {
      case 'write': {
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
            const resourceIdentifier = Number(node.resourcePath.split('/')[3]);
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
            }, tlvBuffer)
            .catch((err) => {
              const msg = {};
              msg.error = err;
              node.send(msg);
            });
          }
        });

        break;
      }

      case 'read': {
        node.on('input', () => {
          node.device.read(node.resourcePath, (statusCode, payload) => {
            const msg = {};
            msg.payload = {};
            msg.payload.data = {};
            const buffer = Buffer.from(payload, 'base64');
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
          }).catch((err) => {
            const msg = {};
            msg.error = err;
            node.send(msg);
          });
        });

        break;
      }

      case 'execute': {
        node.on('input', () => {
          node.device.execute(node.resourcePath, (statusCode) => {
            const msg = {};
            msg.payload = {};
            msg.payload.code = {};
            msg.payload.code[node.resourcePath] = statusCode;
            node.send(msg);
          }).catch((err) => {
            const msg = {};
            msg.error = err;
            node.send(msg);
          });
        });

        break;
      }

      default:
        this.error({ payload: 'Unknown LwM2M request type.' });
    }
  }
  RED.nodes.registerType('LwM2M request in', SensorNode);
};
