'use strict';

const restAPI = require('restserver-api');
const sensorMethods = require('./sensorMethods.js');

const { Lwm2m } = restAPI;
const { RESOURCE_TYPE, encodeResource } = Lwm2m.TLV;

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
        name: 'activePower', path: '/3305/0/5800', type: RESOURCE_TYPE.FLOAT, need: config.activePower,
      },
      {
        name: 'activeEnergy', path: '/3305/0/5805', type: RESOURCE_TYPE.FLOAT, need: config.activeEnergy,
      },
      {
        name: 'reactivePower', path: '/3305/0/5810', type: RESOURCE_TYPE.FLOAT, need: config.reactivePower,
      },
      {
        name: 'reactiveEnergy', path: '/3305/0/5815', type: RESOURCE_TYPE.FLOAT, need: config.reactiveEnergy,
      },
      {
        name: 'relay', path: '/3312/0/5850', type: RESOURCE_TYPE.BOOLEAN, need: node.relay,
      },
    ];
    sensorMethods.initialize(node, config);
    sensorMethods.setStatus(node);
    sensorMethods.registerEvents(node);

    node.on('input', (msg) => {
      let relayState;
      if (msg.payload) {
        relayState = true;
      } else {
        relayState = false;
      }
      node.device.write('/3312/0/5850', () => {
      }, encodeResource({
        identifier: 5850,
        type: RESOURCE_TYPE.BOOLEAN,
        value: relayState,
      }));
    });
  }

  RED.nodes.registerType('sensor3700 in', SensorNode);
};
