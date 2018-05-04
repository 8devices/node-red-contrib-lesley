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
      this.service = new restAPI.Service({
        host: this.options.url,
        polling: false,
        port: this.options.methodValue,
      });
    } else if (this.options.notificationMethod === 'polling') {
      this.service = new restAPI.Service({
        host: this.options.url,
        polling: true,
        interval: this.options.methodValue,
      });
    }
    this.service.start();
  }
  RED.nodes.registerType('lesley-service', LesleyService);

  LesleyService.prototype.close = function () {
    this.service.stop();
  };
};
