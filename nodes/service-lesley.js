'use strict';

const net = require('net');
const rest = require('node-rest-client');

const client = new rest.Client();

module.exports = function (RED) {
  function LesleyService(config) {
    RED.nodes.createNode(this, config);

    const service = this;
    service.options = {};
    service.options.name = config.name;
    service.status = false;
    service.pending_transactions = [];
    const url = 'http://localhost:8888/';

    service.get_transaction = function (UrlTransaction, callback) {
      client.get(UrlTransaction, (data) => {
        const trans = {};
        trans.cb = callback;
        trans.id = data['async-response-id'];
        trans.time = (new Date()).getTime();
        service.pending_transactions.push(trans);
      });
    };
	
	service.put_transaction = function (UrlTransaction, args, callback) {
      client.put(UrlTransaction, args, (data) => {
        /*const trans = {};
        trans.cb = callback;
        trans.id = data['async-response-id'];
        trans.time = (new Date()).getTime();
        service.pending_transactions.push(trans);*/
      });
    };
	
    service.interval_id = setInterval(() => {
      const test = net.connect(8888, 'localhost', () => {
        client.get(`${url}notification/pull`, (data) => {
          service.status = true;
          if (Object.prototype.hasOwnProperty.call(data, 'async-responses')) {
            for (let i = 0; i < data['async-responses'].length; i += 1) {
              for (let j = service.pending_transactions.length - 1; j >= 0; j -= 1) {
                if (data['async-responses'][i].id === service.pending_transactions[j].id) {
                  service.pending_transactions[j].cb(data['async-responses'][i]);
                }
                if ((new Date()).getTime() - service.pending_transactions[j].time >= 2 * 60000) {
                  service.pending_transactions.splice(j, 1);
                }
              }
            }
          }
        });
      });
      test.on('error', (ex) => {
        service.error = ex;
        service.status = false;
      });
    }, 5000);
  }

  RED.nodes.registerType('service-lesley', LesleyService);

  LesleyService.prototype.close = function () {
    if (this.interval_id != null) {
      clearInterval(this.interval_id);
    }
  };
};
