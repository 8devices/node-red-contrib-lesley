'use strict';

const restAPI = require('restserver-api');

module.exports = function (RED) {
  function LesleyService(config) {
    RED.nodes.createNode(this, config);

    const serviceOptions = {
      host: 'http://localhost:8888',
      options: {
        host: 'localhost',
        port: '8888',
        path: '/',
        ca: '',
      },
      https: false,
      authentication: false,
      username: '',
      password: '',
      interval: 1234,
      polling: false,
      port: 5728,
    };

    let { url } = config;
    if ((url.indexOf('http://') !== 0) && (url.indexOf('https://') !== 0)) {
      if (config.useCa) {
        url = `https://${url}`;
      } else {
        url = `http://${url}`;
      }
    }

    if (url.indexOf('http://') === 0) {
      serviceOptions.https = false;
      serviceOptions.host = url;
    } else if (url.indexOf('https://') === 0) {
      serviceOptions.https = true;
      const hostAddress = url.slice('https://'.length).split(':');
      serviceOptions.options.host = hostAddress[0];
      serviceOptions.options.port = hostAddress[1];
      serviceOptions.options.ca = this.credentials.cadata;
    }

    if (config.useAuthentication) {
      serviceOptions.authentication = true;
      serviceOptions.username = this.credentials.user;
      serviceOptions.password = this.credentials.password;
    }

    if (config.notificationMethod === 'callback') {
      serviceOptions.polling = false;
      serviceOptions.port = config.methodValue;
    } else if (config.notificationMethod === 'polling') {
      serviceOptions.polling = true;
      serviceOptions.interval = config.methodValue * 1000;
    }

    this.service = new restAPI.Service(serviceOptions);
    this.service.start()
      .then(() => {
        this.emit('started');
      })
      .catch((err) => {
        this.error(err);
      });

    this.on('close', (done) => {
      this.service.stop().then(() => {
        done();
      }).catch((err) => {
        this.error(err);
        done();
      });
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
