'use strict';

const rest = require('node-rest-client');
const express = require('express');
const parser = require('body-parser');

const client = new rest.Client();

module.exports = function (RED) {
  function LesleyService(config) {
    RED.nodes.createNode(this, config);

    const service = this;
    service.options = {};
    service.options.name = config.name;
    service.NotificationCallback = false;
    service.status = false;
    service.pending_transactions = [];
    const url = 'http://localhost:8888/';
    this.express = express();
    this.express.use(parser.json());

    service.PutPromises = [];
    service.GetPromises = [];

    const args = {
      data: {
        url: 'http://localhost:5727/notification',
        headers: {},
      },
      headers: { 'Content-Type': 'application/json' },
    };

    service.interval_id = setInterval(() => {
      const GetCallbackRequest = client.get(`${url}/notification/callback`, (data, response) => {
        if (response.statusCode === 404) {
          const CallbackRequest = client.put(`${url}/notification/callback`, args, () => {
            service.status = true;
          });
          CallbackRequest.on('error', (ex) => {
            service.error = ex;
            service.status = false;
          });
        }
      });
      GetCallbackRequest.on('error', (ex) => {
        service.error = ex;
        service.status = false;
      });
    }, 1000);

    this.express.put('/notification', (req, resp) => {
      if (Object.prototype.hasOwnProperty.call(req.body, 'async-responses')) {
        for (let i = 0; i < req.body['async-responses'].length; i += 1) {
          for (let j = service.pending_transactions.length - 1; j >= 0; j -= 1) {
            if (req.body['async-responses'][i].id === service.pending_transactions[j].id) {
              service.pending_transactions[j].cb(req.body['async-responses'][i]);
            }
            if ((new Date()).getTime() - service.pending_transactions[j].time >= 2 * 60000) {
              service.pending_transactions.splice(j, 1);
            }
          }
        }
      }
      resp.send();
    });

    this.server = this.express.listen(5727);

    service.get_transaction = function (UrlTransaction, callback) {
      function GetPromise() {
        return new Promise(((fullfill) => {
          const GetRequest = client.get(UrlTransaction, (data) => {
            service.status = true;
            const trans = {};
            trans.cb = callback;
            trans.id = data['async-response-id'];
            trans.time = (new Date()).getTime();
            service.pending_transactions.push(trans);
            fullfill();
          });
          GetRequest.on('error', (err) => {
            service.error = err;
            service.status = false;
            fullfill();
          });
        }));
      }
      service.GetPromises.push(GetPromise());
    };

    service.put_transaction = function (UrlTransaction, buff, callback) {
      function PutPromise() {
        return new Promise(((fullfill) => {
          const arg = {
            data: buff,
            headers: { 'Content-Type': 'application/vnd.oma.lwm2m+tlv' },
          };
          client.serializers.add({
            name: 'xxx',
            isDefault: false,
            match(req) { return req.headers['Content-Type'] === 'application/vnd.oma.lwm2m+tlv'; },
            serialize(data, nrcEventEmitter, serializedCallback) {
              serializedCallback(data);
            },
          });
          const PutRequest = client.put(UrlTransaction, arg, (data) => {
            service.status = true;
            const trans = {};
            trans.cb = callback;
            trans.id = data['async-response-id'];
            trans.time = (new Date()).getTime();
            service.pending_transactions.push(trans);
            fullfill();
          });
          PutRequest.on('error', (err) => {
            service.error = err;
            service.status = false;
            fullfill();
          });
        }));
      }
      service.PutPromises.push(PutPromise());
    };
  }
  RED.nodes.registerType('service-lesley', LesleyService);

  LesleyService.prototype.close = function () {
    if (this.interval_id != null) {
      clearInterval(this.interval_id);
    }
    this.server.close();
  };
};
