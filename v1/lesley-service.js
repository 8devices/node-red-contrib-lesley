'use strict';

const restAPI = require('restserver-api');

module.exports = function (RED) {
  function LesleyService(config) {
    RED.nodes.createNode(this, config);

    const service = this;
    service.options = {};
    service.options.name = config.name;
    service.options.url = config.url;
    service.devices = [];

    service.service = new restAPI.Service({ host: service.options.url });
  }
  RED.nodes.registerType('lesley-service', LesleyService);
};
