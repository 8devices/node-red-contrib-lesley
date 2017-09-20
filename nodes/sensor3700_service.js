'use strict';

module.exports = function (RED) {
  function SensorNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    const url = 'http://localhost:8888/';
    node.service = RED.nodes.getNode(config.service);
    const name = config.id;
    
    node.interval_id = setInterval(function () {
    //setInterval(() => {
      let path = '';
      if (config.measurement === 'Active power' || config.measurement === 'active power') {
        path = '/3305/1/5800';
      } else if (config.measurement === 'Active energy' || config.measurement === 'active energy') {
        path = '/3305/1/5805';
      } else if (config.measurement === 'Reactive energy' || config.measurement === 'Reactive energy') {
        path = '/3305/1/5810';
      } else if (config.measurement === 'Reactive power' || config.measurement === 'Reactive power') {
        path = '/3305/1/5815';
      }
      node.service.get_transaction(`${url}endpoints/${name}${path}`, (resp) => {
        const msg = {};
        msg.topic = config.topic;
        msg.measurement = config.measurement;
        msg.status = resp.status;
        if (Object.prototype.hasOwnProperty.call(resp, 'payload')) {
          //const hexString = Buffer.from(resp.payload, 'base64').toString('hex');
          //const res = hexString.slice(6, 15);
          const buf = new Buffer(resp.payload, 'base64');
		  msg.payload = buf.readFloatBE(3);
          /*const intData = new Uint32Array(1);
          intData[0] = parseInt(res, 16);
          const dataAsFloat = new Float32Array(intData.buffer);
          msg.payload = dataAsFloat[0];*/
        }
        node.send(msg);
      });
    }, config.interval * 60000);
  }
  RED.nodes.registerType('sensor3700_service in', SensorNode);
  
     SensorNode.prototype.close = function() {
      if (this.interval_id != null) {
        clearInterval(this.interval_id);
      }
	};
};
