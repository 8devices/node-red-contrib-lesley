'use strict';

const restAPI = require('restserver-api');

const { Lwm2m } = restAPI;
const { RESOURCE_TYPE, encodeResource, decodeResource } = Lwm2m.TLV;

module.exports = function (RED) {
  function SensorNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.service = RED.nodes.getNode(config.service);
    node.observationInterval = Number(config.interval);
    node.name = config.uuid;
    node.paths = [];
    node.device = new restAPI.Device(node.service.service, node.name);
    node.state = false;
    node.cache = {};
	
    function observe(resourcePath, resourceName, resourceType) {
      node.device.observe(resourcePath, (err, response) => {
        const msg = {};
        const buffer = Buffer.from(response, 'base64');

        const decodedResource = decodeResource(buffer, {
          identifier: Number(resourcePath.split('/')[3]),
          type: resourceType,
        });
        const resourceValue = decodedResource.value;
        msg.payload = {
          state: node.state,
          data: {},
        };
        msg.payload.data[resourceName] = resourceValue;
        node.cache[resourceName] = resourceValue;
        msg.payload.cache = node.cache;
        node.send(msg);
      }).catch((err) => {
        if (typeof err === 'number') {
          node.error(`Error code: ${err}`);
        } else {
          node.error(err);
        }
      });
    }

    function configure() {
      node.device.write('/1/0/3', () => {
      }, encodeResource({
        identifier: 3,
        type: RESOURCE_TYPE.INTEGER,
        value: node.observationInterval,
      }));

      if (config.screenText) {
        observe('/3341/0/5527', 'screenText', RESOURCE_TYPE.STRING);
      }

      if (config.temperatureBME) {
        observe('/3303/2/5700', 'temperatureBME', RESOURCE_TYPE.FLOAT);
      }

      if (config.humidityBME) {
        observe('/3304/2/5700', 'humidityBME', RESOURCE_TYPE.FLOAT);
      }
      
      if (config.pressureBME) {
        observe('/3315/2/5700', 'pressureBME', RESOURCE_TYPE.FLOAT);
      }
      
      if (config.gasBME) {
        observe('/3327/2/5700', 'gasBME', RESOURCE_TYPE.FLOAT);
      }
      
      if (node.accelerometer) {
		  if (node.accelerometerX) {
			observe('/3313/0/5702', 'accelerometerX', RESOURCE_TYPE.FLOAT);
		  }
		  
		  if (node.accelerometerY) {
			observe('/3313/0/5703', 'accelerometerY', RESOURCE_TYPE.FLOAT);
		  }
		  
		  if (node.accelerometerZ) {
			observe('/3313/0/5704', 'accelerometerZ', RESOURCE_TYPE.FLOAT);
		  }
	  }
	  
      if (node.gyroscope) {
		  if (node.gyroscopeX) {
			observe('/3334/0/5702', 'gyroscopeX', RESOURCE_TYPE.FLOAT);
		  }
		  
		  if (node.gyroscopeY) {
			observe('/3334/0/5703', 'gyroscopeY', RESOURCE_TYPE.FLOAT);
		  }
		  
		  if (node.gyroscopeZ) {
			observe('/3334/0/5704', 'gyroscopeZ', RESOURCE_TYPE.FLOAT);
		  }
	  }
	  
	  if (node.magnetometer) {
		  if (node.magnetometerX) {
			observe('/3314/0/5702', 'magnetometerX', RESOURCE_TYPE.FLOAT);
		  }
		  
		  if (node.magnetometerY) {
			observe('/3314/0/5703', 'magnetometerY', RESOURCE_TYPE.FLOAT);
		  }
		  
		  if (node.magnetometerZ) {
			observe('/3314/0/5704', 'magnetometerZ', RESOURCE_TYPE.FLOAT);
		  }
	  }
	  
	  if (config.temperatureHDC) {
        observe('/3303/1/5700', 'temperatureHDC', RESOURCE_TYPE.FLOAT);
      }

      if (config.humidityHDC) {
        observe('/3304/1/5700', 'humidityHDC', RESOURCE_TYPE.FLOAT);
      }
      
      if (config.illuminance) {
        observe('/3301/0/5700', 'illuminance', RESOURCE_TYPE.FLOAT);
      }
    }

    node.on('input', (msg) => {
		if(typeof msg.payload === 'string' || typeof msg.payload === 'number'){
		let argument;
		if(typeof msg.payload === 'string'){
			argument = msg.payload;
		}
		else if (typeof msg.payload === 'number'){
			argument = msg.payload.toString();
		}
		  node.device.write('/3341/0/5527', () => {
		  }, encodeResource({
			identifier: 5527,
			type: RESOURCE_TYPE.STRING,
			value: argument,
		  }));
		}
		else{
			node.error('Input message payload should be a number or a string');
		}
    });

    node.device.on('register', () => {
      const msg = {};
      msg.payload = {};
      node.state = true;
      msg.payload.state = node.state;
      msg.payload.data = {};
      msg.payload.cache = node.cache;
      node.send(msg);
      configure();
    });

    node.device.on('update', () => {
      node.state = true;
    });

    node.device.on('deregister', () => {
      const msg = {};
      msg.payload = {};
      node.state = false;
      msg.payload.state = node.state;
      msg.payload.data = {};
      msg.payload.cache = node.cache;
      node.send(msg);
    });

    node.device.getObjects().then(() => {
      const msg = {};
      msg.payload = {};
      node.state = true;
      msg.payload.state = node.state;
      msg.payload.data = {};
      msg.payload.cache = node.cache;
      node.send(msg);
      configure();
    }).catch((err) => {
      if (typeof err === 'number') {
        if (err === 404) {
          const msg = {};
          msg.payload = {};
          node.state = false;
          msg.payload.state = node.state;
          msg.payload.data = {};
          msg.payload.cache = node.cache;
          node.send(msg);
        } else {
          node.error(`Error code: ${err}`);
        }
      } else {
        node.error(err);
      }
    }); 
  }
  RED.nodes.registerType('sensor5200 in', SensorNode);
};
