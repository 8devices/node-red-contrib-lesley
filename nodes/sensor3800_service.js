'use strict';

const { Lwm2m } = require('restserver-api');

const { RESOURCE_TYPE, decodeResource } = Lwm2m.TLV;

module.exports = function (RED) {
  function SensorNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    const url = 'http://localhost:8888/';
    node.service = RED.nodes.getNode(config.service);
    const name = config.uuid;
    if (node.service != null) {
      node.interval_id = setInterval(() => {
        let path = '';
        let type;
        if (config.measurement === 'Temperature' || config.measurement === 'temperature') {
          path = '/3303/0/5700';
          type = RESOURCE_TYPE.FLOAT;
        } else if (config.measurement === 'Humidity' || config.measurement === 'humidity') {
          path = '/3304/0/5700';
          type = RESOURCE_TYPE.FLOAT;
        } else if (config.measurement === 'Power source voltage' || config.measurement === 'power source voltage') {
          path = '/3/0/7';
          type = RESOURCE_TYPE.INTEGER;
        }
        node.service.get_transaction(`${url}endpoints/${name}${path}`, (resp) => {
          const msg = {};
          msg.topic = config.topic;
          msg.measurement = config.measurement;
          msg.status = resp.status;
          if (Object.prototype.hasOwnProperty.call(resp, 'payload')) {
            if (resp.payload !== '') {
              const buf = Buffer.from(resp.payload, 'base64');
              msg.payload = decodeResource(buf, {
                identifier: Number(path.split('/')[3]),
                type,
              }).value;
            }
          }
          node.send(msg);
        });
        Promise.all(node.service.GetPromises).then(() => {
          if (!node.service.status) {
            const ErrorMsg = {};
            ErrorMsg.payload = node.service.error;
            node.error(ErrorMsg);
          }
        });
      }, config.interval * 60000);
    } else {
      const ErrorMsg = {};
      ErrorMsg.payload = 'Error: service is not selected.';
      node.error(ErrorMsg);
    }
  }
  RED.nodes.registerType('sensor3800_service in', SensorNode);

  SensorNode.prototype.close = function () {
    if (this.interval_id != null) {
      clearInterval(this.interval_id);
    }
  };
};
