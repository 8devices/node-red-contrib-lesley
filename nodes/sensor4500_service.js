'use strict';

const lwm2m = require('./lwm2m.js');

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
        if (config.measurement === 'Voltage' || config.measurement === 'voltage') {
          path = '/3202/0/5600';
        }
        if (config.measurement === 'Power source voltage' || config.measurement === 'power source voltage') {
          path = '/3/0/7';
        }
        node.service.get_transaction(`${url}endpoints/${name}${path}`, (resp) => {
          const msg = {};
          msg.topic = config.topic;
          msg.measurement = config.measurement;
          msg.status = resp.status;
          if (Object.prototype.hasOwnProperty.call(resp, 'payload')) {
            if (resp.payload !== '') {
              const buf = Buffer.from(resp.payload, 'base64');
              const objectsList = lwm2m.decodeTLV(buf, node);
              if ((objectsList.length === 1)
                  && (objectsList[0].getType() === lwm2m.INSTANCE_TYPE.RESOURCE)) {
                switch (path) {
                  case '/3/0/7':
                    msg.payload = objectsList[0].getIntegerValue();
                    break;
                  default:
                    msg.payload = objectsList[0].getFloatValue();
                }
              }
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
  RED.nodes.registerType('sensor4500_service in', SensorNode);

  SensorNode.prototype.close = function () {
    if (this.interval_id != null) {
      clearInterval(this.interval_id);
    }
  };
};
