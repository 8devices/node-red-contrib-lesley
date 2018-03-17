'use strict';

const restAPI = require('restserver-api');

module.exports = function (RED) {
  function LesleyService(config) {
    RED.nodes.createNode(this, config);
    this.options = {};
    this.options.name = config.name;
    this.options.url = config.url;
    this.service = new restAPI.Service({ host: this.options.url });
  }
  RED.nodes.registerType('lesley-service', LesleyService);

  LesleyService.prototype.close = function () {
    clearInterval(this.service.pollTimer);
  };
};
