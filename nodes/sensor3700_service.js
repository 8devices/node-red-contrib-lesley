'use strict';

module.exports = function (RED) {
  function SensorNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    const url = 'http://localhost:8888/';
    node.service = RED.nodes.getNode(config.service);
    const name = config.id;
    const EnableTimer = config.timer;

    let path = '';
    if (config.measurement === 'Active power' || config.measurement === 'active power') {
      path = '/3305/1/5800';
    } else if (config.measurement === 'Active energy' || config.measurement === 'active energy') {
      path = '/3305/1/5805';
    } else if (config.measurement === 'Reactive energy' || config.measurement === 'reactive energy') {
      path = '/3305/1/5810';
    } else if (config.measurement === 'Reactive power' || config.measurement === 'reactive power') {
      path = '/3305/1/5815';
    } else if (config.measurement === 'Relay' || config.measurement === 'relay') {
      path = '/3312/1/5850';
    }

    node.on('input', (msg) => {
      // if (config.measurement === 'Relay' || config.measurement === 'relay') {
      /* if (msg.payload) {
           node.service.put_transaction(`${url}endpoints/${name}${path}`, (resp) => {
            const data = {};
            data.topic = config.topic;
            data.measurement = config.measurement;
            data.status = resp.status;
            if (Object.prototype.hasOwnProperty.call(resp, 'payload')) {
              const buf = Buffer.from(resp.payload, 'base64');
              data.payload = buf.readIntLE(3);
            }
            node.send(data);
          });
        } else if (!msg.payload) {

        } */
      // } else {
      node.service.get_transaction(`${url}endpoints/${name}${path}`, (resp) => {
        const data = {};
        data.topic = config.topic;
        data.measurement = config.measurement;
        data.status = resp.status;
        if (Object.prototype.hasOwnProperty.call(resp, 'payload')) {
          const buf = Buffer.from(resp.payload, 'base64');
          if (resp.payload !== '') {
            data.payload = buf.readFloatBE(3);
          }
        }
        msg = data;
        node.send(msg);
      });
      // }
    });

    if (EnableTimer) {
      node.interval_id = setInterval(() => {
        if (node.service.status) {
          node.service.get_transaction(`${url}endpoints/${name}${path}`, (resp) => {
            const msg = {};
            msg.topic = config.topic;
            msg.measurement = config.measurement;
            msg.status = resp.status;
            if (Object.prototype.hasOwnProperty.call(resp, 'payload')) {
              const buf = Buffer.from(resp.payload, 'base64');
              if ((config.measurement === 'Relay' || config.measurement === 'relay') && resp.payload !== '') {
                msg.payload = buf.readIntLE(3);
              } else if (resp.payload !== '') {
                msg.payload = buf.readFloatBE(3);
              }
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
  }
  RED.nodes.registerType('sensor3700_service in', SensorNode);

  SensorNode.prototype.close = function () {
    if (this.interval_id != null) {
      clearInterval(this.interval_id);
    }
  };
};
