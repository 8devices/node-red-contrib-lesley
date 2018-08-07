'use strict';

const restAPI = require('restserver-api');
const sensorMethods = require('./sensorMethods.js');

const { Lwm2m } = restAPI;
const { RESOURCE_TYPE } = Lwm2m.TLV;

module.exports = function (RED) {
  function SensorNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.service = RED.nodes.getNode(config.service);

    node.resources = [
      {
        name: 'powerSourceVoltage', path: '/3/0/7', type: RESOURCE_TYPE.INTEGER, need: config.powerSourceVoltage,
      },
      {
        name: 'voltage', path: '/3202/0/5600', type: RESOURCE_TYPE.FLOAT, need: config.voltage,
      },
    ];
    sensorMethods.initialize(node, config);
    sensorMethods.setStatus(node);
    sensorMethods.registerEvents(node);
  }

  RED.nodes.registerType('sensor4500 in', SensorNode);
};
