'use strict';

module.exports = function (RED) {
  function ServerNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    const url = 'http://localhost:8888/';
    node.service = RED.nodes.getNode(config.service);
    const name = config.id;

    setInterval(() => {
      let path = '';
      if (config.measurement === 'Temperature' || config.measurement === 'temperature') {
        path = '/3303/0/5700';
      } else if (config.measurement === 'Humidity' || config.measurement === 'humidity') {
        path = '/3304/0/5700';
      }
      node.service.get_transaction(`${url}endpoints/${name}${path}`, (resp) => {
        const msg = {};
        msg.topic = config.topic;
        msg.measurement = config.measurement;
        msg.status = resp.status;
        if (Object.prototype.hasOwnProperty.call(resp, 'payload')) {
          const hexString = Buffer.from(resp.payload, 'base64').toString('hex');
          const res = hexString.slice(6, 15);
          const intData = new Uint32Array(1);
          intData[0] = parseInt(res, 16);
          const dataAsFloat = new Float32Array(intData.buffer);
          msg.payload = dataAsFloat[0];
        }
        node.send(msg);
      });
    }, config.interval * 60000);
  }
  RED.nodes.registerType('sensor3800_service in', ServerNode);
};
