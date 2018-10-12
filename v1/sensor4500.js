'use strict';

const restAPI = require('restserver-api');
const { ObserveSensorNode } = require('./generic_sensor.js');

const { Lwm2m } = restAPI;
const { RESOURCE_TYPE } = Lwm2m.TLV;

module.exports = function (RED) {
  class Sensor4500Node extends ObserveSensorNode {
    constructor(config) {
      super(RED, config);

      this.resources = [
        {
          name: 'powerSourceVoltage',
          path: '/3/0/7',
          type: RESOURCE_TYPE.INTEGER,
          need: config.powerSourceVoltage,
        },
        {
          name: 'voltage',
          path: '/3202/0/5600',
          type: RESOURCE_TYPE.FLOAT,
          need: config.voltage,
        },
      ];
    }
  }

  RED.nodes.registerType('sensor4500 in', Sensor4500Node);
};
