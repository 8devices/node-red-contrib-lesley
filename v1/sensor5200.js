'use strict';

const restAPI = require('restserver-api');
const genericSensor = require('./generic_sensor.js');

const { Lwm2m } = restAPI;
const { RESOURCE_TYPE, encodeResource, decodeResource } = Lwm2m.TLV;

module.exports = function (RED) {
  function SensorNode(config) {
    RED.nodes.createNode(this, config);
    this.service = RED.nodes.getNode(config.service);
    this.service.attach(this);
    this.observationInterval = Number(config.interval);
    this.name = config.uuid;
    this.device = new restAPI.Device(this.service.service, this.name);
    this.configuration = config;
    this.resources = [
      {
        name: 'batteryVoltage', path: '/3/0/7', type: RESOURCE_TYPE.INTEGER, need: config.batteryVoltage,
      },
      {
        name: 'screenText', path: '/3341/0/5527', type: RESOURCE_TYPE.STRING, need: config.screenText,
      },
      {
        name: 'temperatureBME', path: '/3303/2/5700', type: RESOURCE_TYPE.FLOAT, need: config.temperatureBME,
      },
      {
        name: 'humidityBME', path: '/3304/2/5700', type: RESOURCE_TYPE.FLOAT, need: config.humidityBME,
      },
      {
        name: 'pressureBME', path: '/3315/2/5700', type: RESOURCE_TYPE.FLOAT, need: config.pressureBME,
      },
      {
        name: 'gasBME', path: '/3327/2/5700', type: RESOURCE_TYPE.FLOAT, need: config.gasBME,
      },
      {
        name: 'accelerometerX', path: '/3313/0/5702', type: RESOURCE_TYPE.FLOAT, need: config.accelerometerX,
      },
      {
        name: 'accelerometerY', path: '/3313/0/5703', type: RESOURCE_TYPE.FLOAT, need: config.accelerometerY,
      },
      {
        name: 'accelerometerZ', path: '/3313/0/5704', type: RESOURCE_TYPE.FLOAT, need: config.accelerometerZ,
      },
      {
        name: 'gyroscopeX', path: '/3334/0/5702', type: RESOURCE_TYPE.FLOAT, need: config.gyroscopeX,
      },
      {
        name: 'gyroscopeY', path: '/3334/0/5703', type: RESOURCE_TYPE.FLOAT, need: config.gyroscopeY,
      },
      {
        name: 'gyroscopeZ', path: '/3334/0/5704', type: RESOURCE_TYPE.FLOAT, need: config.gyroscopeZ,
      },
      {
        name: 'magnetometerX', path: '/3314/0/5702', type: RESOURCE_TYPE.FLOAT, need: config.magnetometerX,
      },
      {
        name: 'magnetometerY', path: '/3314/0/5703', type: RESOURCE_TYPE.FLOAT, need: config.magnetometerY,
      },
      {
        name: 'magnetometerZ', path: '/3314/0/5704', type: RESOURCE_TYPE.FLOAT, need: config.magnetometerZ,
      },
      {
        name: 'temperatureHDC', path: '/3303/1/5700', type: RESOURCE_TYPE.FLOAT, need: config.temperatureHDC,
      },
      {
        name: 'humidityHDC', path: '/3304/1/5700', type: RESOURCE_TYPE.FLOAT, need: config.humidityHDC,
      },
      {
        name: 'illuminance', path: '/3301/0/5700', type: RESOURCE_TYPE.FLOAT, need: config.illuminance,
      },
    ];

    this.on('input', (msg) => {
      if (typeof msg.payload === 'string' || typeof msg.payload === 'number') {
        const argument = msg.payload.toString();
        this.device.write('/3341/0/5527', () => {
        }, encodeResource({
          identifier: 5527,
          type: RESOURCE_TYPE.STRING,
          value: argument,
        }));
      } else {
        this.error('Input message payload should be a number or a string');
      }
    });

    new genericSensor.Sensor(this);
  }

  RED.nodes.registerType('sensor5200 in', SensorNode);
};
