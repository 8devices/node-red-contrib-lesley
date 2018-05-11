'use strict';

const restAPI = require('restserver-api');

module.exports = function (RED) {
  function LesleyService(config) {
    RED.nodes.createNode(this, config);
    const options = {
      host: 'http://localhost:8888',
      interval: 1234,
      polling: false,
      port: 5728,
    };
    options.host = config.url;
    if (config.notificationMethod === 'callback') {
      options.polling = false;
      options.port = config.methodValue;
    } else if (config.notificationMethod === 'polling') {
      options.polling = true;
      options.interval = config.methodValue * 1000;
    }
    this.service = new restAPI.Service(options);
    this.service.start();
  }
  RED.nodes.registerType('lesley-service', LesleyService);

  LesleyService.prototype.close = function () {
    this.service.stop();
  };
};
