'use strict';

const restAPI = require('restserver-api');

module.exports = function (RED) {
  function LesleyService(config) {
    RED.nodes.createNode(this, config);
    this.options = {};
    this.options.name = config.name;
    this.options.url = config.url;
    this.options.notificationMethod = config.notificationMethod;
    this.options.methodValue = config.methodValue;
    if (this.options.notificationMethod === 'callback') {
      this.options.polling = false;
    } else if (this.options.notificationMethod === 'polling') {
      this.options.polling = true;
      this.options.methodValue *= 1000;
    }
    this.service = new restAPI.Service({
      host: this.options.url,
      polling: this.options.polling,
      interval: this.options.methodValue,
    });
    this.service.start();
  }
  RED.nodes.registerType('lesley-service', LesleyService);

  LesleyService.prototype.close = function () {
    this.service.stop();
  };
};
