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
        name: 'temperature', path: '/3303/0/5700', type: RESOURCE_TYPE.FLOAT, need: config.temperature,
      },
      {
        name: 'humidity', path: '/3304/0/5700', type: RESOURCE_TYPE.FLOAT, need: config.humidity,
      },
    ];
    sensorMethods.initialize(node, config);
    sensorMethods.setStatus(node);
    sensorMethods.registerEvents(node);
  }

  RED.nodes.registerType('sensor3800 in', SensorNode);
};
