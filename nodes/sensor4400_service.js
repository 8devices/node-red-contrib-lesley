'use strict';

module.exports = function (RED) {
  function SensorNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    const url = 'http://localhost:8888/';
    node.service = RED.nodes.getNode(config.service);
    const name = config.uuid;

    node.interval_id = setInterval(() => {
      let path = '';
      if (config.measurement === 'Temperature' || config.measurement === 'temperature') {
        path = '/3303/0/5700';
      }
      if (config.measurement === 'Magnetic field' || config.measurement === 'Magnetic field') {
        path = '/3200/0/5500';
      }
      if (node.service.status) {
        node.service.get_transaction(`${url}endpoints/${name}${path}`, (resp) => {
          const msg = {};
          msg.topic = config.topic;
          msg.measurement = config.measurement;
          msg.status = resp.status;
          if (Object.prototype.hasOwnProperty.call(resp, 'payload')) {
            const buf = Buffer.from(resp.payload, 'base64');
            msg.payload = buf.readFloatBE(3);
          }
          node.send(msg);
        });
      } else {
        const msg = {};
        msg.payload = node.service.error;
        node.send(msg);
      }
    }, config.interval * 60000);
  }
  RED.nodes.registerType('sensor4400_service in', SensorNode);

  SensorNode.prototype.close = function () {
    if (this.interval_id != null) {
      clearInterval(this.interval_id);
    }
  };
};
