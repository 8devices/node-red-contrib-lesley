'use strict';

const restAPI = require('restserver-api');

module.exports = function (RED) {
  function SensorNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.service = RED.nodes.getNode(config.service);

    node.ap = config.ap;
    node.ae = config.ae;
    node.rp = config.rp;
    node.re = config.re;
    node.observe_time = config.interval;
    node.name = config.uuid;
    node.paths = [];
    node.device = new restAPI.Device(node.service.service, node.name);

    node.on('input', (msg) => {
      node.device.getObjects().then((data) => {
        node.send(data);
      }).catch((err) => {
        msg.error = err;
        node.send(msg);
      });
    });

  /* configure(){
    if(node.ap){
      //node.paths.push('/3305/0/5800');
      node.device.observe('/3305/0/5800', (err, resp) => {
        let msg={};
        msg.response=resp;
        msg.title="observation response";
        const buf = Buffer.from(resp, 'base64');
        let state = buf[3]; // TODO: parse TLV
        msg.payload=state;
        node.error(err);
        node.send(msg);
      });
    }
    if(node.ae){
      // node.paths.push('/3305/0/5805');
      node.device.observe('/3305/0/5805', (err, resp) => {
        let msg={};
        msg.response=resp;
        msg.title="observation response";
        const buf = Buffer.from(resp, 'base64');
        let state = buf[3]; // TODO: parse TLV
        msg.payload=state;
        node.error(err);
        node.send(msg);
      });
    }
    if(node.rp){
      // node.paths.push('/3305/0/5815');
      node.device.observe('/3305/0/5815', (err, resp) => {
        let msg={};
        msg.response=resp;
        msg.title="observation response";
        const buf = Buffer.from(resp, 'base64');
        let state = buf[3]; // TODO: parse TLV
        msg.payload=state;
        node.error(err);
        node.send(msg);
      });
    }
    if(node.re){
      // node.paths.push('/3305/0/5810');
      node.device.observe('/3305/0/5810', (err, resp) => {
        let msg={};
        msg.response=resp;
        msg.title="observation response";
        const buf = Buffer.from(resp, 'base64');
        let state = buf[3]; // TODO: parse TLV
        msg.payload=state;
        node.error(err);
        node.send(msg);
      });
    }
    //const PutRequest = node.device.put('/1/0/3', node.period, (data) => {
  } */
  }
  RED.nodes.registerType('sensor3700 in', SensorNode);
};
