'use strict';

const restAPI = require('restserver-api');

module.exports = function (RED) {
  function LesleyService(config) {
    RED.nodes.createNode(this, config);

    const serviceNode = this;
    serviceNode.sensorNodes = [];
    serviceNode.serverStatus = false;

    const serviceOptions = {
      host: 'http://localhost:8888',
      ca: '',
      authentication: false,
      username: '',
      password: '',
      interval: 1234,
      polling: false,
      port: 5728,
    };

    let { url } = config;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (config.useCa) {
        url = `https://${url}`;
      } else {
        url = `http://${url}`;
      }
    }

    serviceOptions.host = url;

    if (config.useCa) {
      serviceOptions.ca = serviceNode.credentials.cadata;
    }

    if (config.useAuthentication) {
      serviceOptions.authentication = true;
      serviceOptions.username = serviceNode.credentials.user;
      serviceOptions.password = serviceNode.credentials.password;
    }

    if (config.notificationMethod === 'callback') {
      serviceOptions.polling = false;
      serviceOptions.port = config.methodValue;
    } else if (config.notificationMethod === 'polling') {
      serviceOptions.polling = true;
      serviceOptions.interval = config.methodValue * 1000;
    }

    serviceNode.service = new restAPI.Service(serviceOptions);
    serviceNode.service.start()
      .then(() => {
        serviceNode.emit('started');
      })
      .catch((err) => {
        serviceNode.error(err);
      });

    serviceNode.attach = function (node) {
      serviceNode.sensorNodes[node.id] = node;
    };

    serviceNode.detach = function (node) {
      delete serviceNode.sensorNodes[node.id];
      serviceNode.emit('sensor-de-attached');
    };
    
    function startService() {
		serviceNode.service.start()
		  .then(() => {
			serviceNode.emit('started');
		  })
		  .catch((err) => {
			serviceNode.error(err);
		  });
	}
    
    function restartService() {
	  serviceNode.service.stop().then(() => {
        startService();
      }).finally(() => {
        
      });
	}

    function stopService(callback) {
      serviceNode.service.stop().catch((err) => {
        serviceNode.error(err);
      }).finally(() => {
        callback();
      });
    }

    serviceNode.on('close', (done) => {
      if (Object.keys(serviceNode.sensorNodes).length > 0) {
        serviceNode.on('sensor-de-attached', () => {
          if (Object.keys(serviceNode.sensorNodes).length === 0) {
            stopService(done);
          }
        });
      } else {
        stopService(done);
      }
    });
  }
  RED.nodes.registerType('lesley-service', LesleyService, {
    credentials: {
      cadata: { type: 'text' },
      user: { type: 'text' },
      password: { type: 'password' },
    },
  });
};
