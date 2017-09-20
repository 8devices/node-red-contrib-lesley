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
      try{
      node.service.get_transaction(`${url}endpoints/${name}${path}`, (resp) => {
        const msg = {};
        msg.topic = config.topic;
        msg.measurement = config.measurement;
        msg.status = resp.status;
        if (Object.prototype.hasOwnProperty.call(resp, 'payload')) {
          const buf = new Buffer(resp.payload, 'base64');
		  msg.payload = buf.readFloatBE(3);
        }
        node.send(msg);
      });
      } catch (err) {
       node.send(`Failed to connect to rest server: ${err}`);
    }
    }, config.interval * 60000);
  }
  RED.nodes.registerType('sensor3800_service in', ServerNode);
};
