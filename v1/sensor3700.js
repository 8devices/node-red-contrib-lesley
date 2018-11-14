'use strict';

const restAPI = require('restserver-api');
const { ObserveSensorNode } = require('./generic_sensor.js');

const { Lwm2m } = restAPI;
const { RESOURCE_TYPE, encodeResource } = Lwm2m.TLV;

module.exports = function (RED) {
  class Sensor3700Node extends ObserveSensorNode {
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
          name: 'activePower',
          path: '/3305/0/5800',
          type: RESOURCE_TYPE.FLOAT,
          need: config.activePower,
        },
        {
          name: 'activeEnergy',
          path: '/3305/0/5805',
          type: RESOURCE_TYPE.FLOAT,
          need: config.activeEnergy,
        },
        {
          name: 'reactivePower',
          path: '/3305/0/5810',
          type: RESOURCE_TYPE.FLOAT,
          need: config.reactivePower,
        },
        {
          name: 'reactiveEnergy',
          path: '/3305/0/5815',
          type: RESOURCE_TYPE.FLOAT,
          need: config.reactiveEnergy,
        },
        {
          name: 'relay',
          path: '/3312/0/5850',
          type: RESOURCE_TYPE.BOOLEAN,
          need: config.relay,
        },
      ];

      this.on('input', (msg) => {
        let relayState;
        if (msg.payload) {
          relayState = true;
        } else {
          relayState = false;
        }
        this.device.write('/3312/0/5850', () => {
        }, encodeResource({
          identifier: 5850,
          type: RESOURCE_TYPE.BOOLEAN,
          value: relayState,
        }));
      });
    }
  }

  RED.nodes.registerType('sensor3700 in', Sensor3700Node);
};
