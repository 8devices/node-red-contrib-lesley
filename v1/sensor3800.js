'use strict';

const restAPI = require('restserver-api');
const { ObserveSensorNode } = require('./generic_sensor.js');

const { Lwm2m } = restAPI;
const { RESOURCE_TYPE } = Lwm2m.TLV;

module.exports = function (RED) {
  class Sensor3800Node extends ObserveSensorNode {
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
          name: 'temperature',
          path: '/3303/0/5700',
          type: RESOURCE_TYPE.FLOAT,
          need: config.temperature,
        },
        {
          name: 'humidity',
          path: '/3304/0/5700',
          type: RESOURCE_TYPE.FLOAT,
          need: config.humidity,
        },
      ];
    }
  }

  RED.nodes.registerType('sensor3800 in', Sensor3800Node);
};
