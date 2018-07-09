'use strict';

const restAPI = require('restserver-api');

const { Lwm2m } = restAPI;
const { RESOURCE_TYPE, encodeResource, decodeResource } = Lwm2m.TLV;

module.exports = function (RED) {
  function SensorNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.service = RED.nodes.getNode(config.service);
    node.name = config.uuid;
    node.device = new restAPI.Device(node.service.service, node.name);
    node.requestType = config.requestType;
    node.resourcePath = config.uri;
    node.resourceType = config.resourceType;
    node.inputValue = config.resourceValue;
    node.valueSource = config.valueSource;
    node.observeInterval = config.observeInterval;

    let resourceType;
    switch (node.requestType) {
      case 'write': {
        node.on('input', (input) => {
          let resourceValue;
          switch (node.valueSource) {
            case 'textbox': {
              resourceValue = node.inputValue;
              break;
            }

            case 'input': {
              resourceValue = input.payload;
              break;
            }

            default:
              return;
          }

          if (node.resourcePath.split('/').length === 4) {
            const resourceIdentifier = Number(node.resourcePath.split('/')[3]);

            switch (node.resourceType) {
              case 'integer':
              case 'float': {
                resourceValue = Number(resourceValue);
                resourceType = RESOURCE_TYPE[node.resourceType.toUpperCase()];

                break;
              }
              case 'string': {
                resourceType = RESOURCE_TYPE[node.resourceType.toUpperCase()];

                break;
              }
              case 'boolean': {
                resourceValue = Boolean(resourceValue);
                resourceType = RESOURCE_TYPE[node.resourceType.toUpperCase()];

                break;
              }
              case 'opaque': {
                resourceValue = Buffer.from(resourceValue);
                resourceType = RESOURCE_TYPE[node.resourceType.toUpperCase()];

                break;
              }
              default:
                return;
            }

            const tlvBuffer = encodeResource({
              type: resourceType,
              identifier: resourceIdentifier,
              value: resourceValue,
            });

            node.device.write(node.resourcePath, (statusCode, payload) => {
              const msg = {};
              msg.payload = {};
              msg.payload.uuid = node.name;
              msg.payload.path = node.resourcePath;
              msg.payload.statusCode = statusCode;
              msg.payload.value = payload;
              node.send(msg);
            }, tlvBuffer)
              .catch((err) => {
                if (typeof err === 'number') {
                  node.error(`Error code: ${err}`);
                } else {
                  node.error(err);
                }
              });
          } else {
            node.error('Invalid path to resource. Must be "/object/instance/resource", e.g., "/1/0/3".');
          }
        });

        break;
      }

      case 'read': {
        node.on('input', () => {
          if (node.resourcePath.split('/').length === 4) {
            const resourceIdentifier = Number(node.resourcePath.split('/')[3]);

            node.device.read(node.resourcePath, (statusCode, payload) => {
              const buffer = Buffer.from(payload, 'base64');
              const msg = {};

              switch (node.resourceType) {
                case 'integer':
                case 'float':
                case 'string':
                case 'boolean':
                case 'opaque':
                  resourceType = RESOURCE_TYPE[node.resourceType.toUpperCase()];
                  break;
                default:
                  resourceType = RESOURCE_TYPE.STRING;
              }

              const decodedResource = decodeResource(buffer, {
                type: resourceType,
                identifier: resourceIdentifier,
              });

              msg.payload = {};
              msg.payload.uuid = node.name;
              msg.payload.path = node.resourcePath;
              msg.payload.statusCode = statusCode;
              msg.payload.value = decodedResource.value;

              node.send(msg);
            }).catch((err) => {
              if (typeof err === 'number') {
                node.error(`Error code: ${err}`);
              } else {
                node.error(err);
              }
            });
          } else {
            node.error('Invalid path to resource. Must be "/object/instance/resource", e.g., "/1/0/3".');
          }
        });

        break;
      }

      case 'execute': {
        node.on('input', () => {
          if (node.resourcePath.split('/').length === 4) {
            node.device.execute(node.resourcePath, (statusCode, payload) => {
              const msg = {};
              msg.payload = {};
              msg.payload.uuid = node.name;
              msg.payload.path = node.resourcePath;
              msg.payload.statusCode = statusCode;
              msg.payload.value = payload;
              node.send(msg);
            }).catch((err) => {
              if (typeof err === 'number') {
                node.error(`Error code: ${err}`);
              } else {
                node.error(err);
              }
            });
          } else {
            node.error('Invalid path to resource. Must be "/object/instance/resource", e.g., "/1/0/3".');
          }
        });

        break;
      }

      case 'observe': {
        if (!Number.isNaN(node.observeInterval)) {
          node.device.write('/1/0/3', () => {
          }, encodeResource({
            identifier: 3,
            type: RESOURCE_TYPE.INTEGER,
            value: Math.ceil(Number(node.observeInterval)),
          }));

          node.on('input', () => {
            if (node.resourcePath.split('/').length === 4) {
              const resourceIdentifier = Number(node.resourcePath.split('/')[3]);

              node.device.observe(node.resourcePath, (statusCode, payload) => {
                node.observeStarted = true;
                const buffer = Buffer.from(payload, 'base64');
                const msg = {};

                switch (node.resourceType) {
                  case 'integer':
                  case 'float':
                  case 'string':
                  case 'boolean':
                  case 'opaque':
                    resourceType = RESOURCE_TYPE[node.resourceType.toUpperCase()];
                    break;
                  default:
                    resourceType = RESOURCE_TYPE.STRING;
                }

                const decodedResource = decodeResource(buffer, {
                  type: resourceType,
                  identifier: resourceIdentifier,
                });

                msg.payload = {};
                msg.payload.uuid = node.name;
                msg.payload.path = node.resourcePath;
                msg.payload.statusCode = statusCode;
                msg.payload.value = decodedResource.value;

                node.send(msg);
              }).catch((err) => {
                if (typeof err === 'number') {
                  node.error(`Error code: ${err}`);
                } else {
                  node.error(err);
                }
              });
            } else {
              node.error('Invalid path to resource. Must be "/object/instance/resource", e.g., "/1/0/3".');
            }
          });
        } else {
          node.error('Invalid observation interval. Must be an integer, e.g., "1", "2", "3".');
        }

        break;
      }

      default:
        node.error('Unknown LwM2M request type.');
    }
  }

  RED.nodes.registerType('LwM2M request in', SensorNode);

  SensorNode.prototype.close = function () {
    if (this.requestType === 'observe' && this.observeStarted) {
      this.device.cancelObserve(this.resourcePath).catch((err) => {
        this.error(`Error stopping observation: ${err}`);
      });
    }
  };
};
