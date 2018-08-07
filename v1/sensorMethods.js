'use strict';

const restAPI = require('restserver-api');

const { Lwm2m } = restAPI;
const { RESOURCE_TYPE, encodeResource, decodeResource } = Lwm2m.TLV;

module.exports = {
  initialize(node, config) {
    node.service.attach(node);
    node.observationInterval = Number(config.interval);
    node.device = new restAPI.Device(node.service.service, config.uuid);
    node.state = false;
    node.cache = {};
  },
  setStatus(node, state) {
    if (state) {
      node.status({ fill: 'green', shape: 'dot', text: 'connected' });
    } else if (state !== undefined && !state) {
      node.status({ fill: 'red', shape: 'dot', text: 'disconnected' });
    } else if (!state) {
      node.status({ fill: 'grey', shape: 'dot', text: 'unknown' });
    }
  },
  registerEvents(node) {
    node.device.on('register', () => {
      const msg = {};
      msg.payload = {};
      node.state = true;
      this.setStatus(node, node.state);
      msg.payload.state = node.state;
      msg.payload.data = {};
      msg.payload.cache = node.cache;
      node.send(msg);
      this.configure(node);
    });

    node.device.on('update', () => {
      node.state = true;
      this.setStatus(node, node.state);
    });

    node.device.on('deregister', () => {
      const msg = {};
      msg.payload = {};
      node.state = false;
      this.setStatus(node, node.state);
      msg.payload.state = node.state;
      msg.payload.data = {};
      msg.payload.cache = node.cache;
      node.send(msg);
    });

    node.service.on('started', () => {
      node.device.getObjects().then(() => {
        const msg = {};
        msg.payload = {};
        node.state = true;
        this.setStatus(node, node.state);
        msg.payload.state = node.state;
        msg.payload.data = {};
        msg.payload.cache = node.cache;
        node.send(msg);
        this.configure(node);
      }).catch((err) => {
        if (typeof err === 'number') {
          if (err === 404) {
            const msg = {};
            msg.payload = {};
            node.state = false;
            this.setStatus(node, node.state);
            msg.payload.state = node.state;
            msg.payload.data = {};
            msg.payload.cache = node.cache;
            node.send(msg);
          } else {
            node.error(`Error getting objects for endpoint, code: ${err}`);
          }
        } else {
          node.error(err);
        }
      });
    });

    node.on('close', (done) => {
      const cancelObservationPromises = [];

      for (let i = 0; i < node.resources.length; i += 1) {
        if (node.resources[i].observeAsyncID !== undefined) {
          cancelObservationPromises.push(node.device.cancelObserve(node.resources[i].path));
        }
      }

      Promise.all(cancelObservationPromises).catch((err) => {
        node.error(err);
      }).finally(() => {
        node.service.detach(node);
        done();
      });
    });
  },
  configure(node) {
    node.device.write('/1/0/3', () => {
    }, encodeResource({
      identifier: 3,
      type: RESOURCE_TYPE.INTEGER,
      value: node.observationInterval,
    })).then(() => {
      node.resources.forEach((resource) => {
        if (resource.need) {
          this.observe(node, resource.path, resource.name, resource.type);
        }
      });
    }).catch((err) => {
      if (typeof err === 'number') {
        node.error(`Error setting observation time interval, code: ${err}`);
      } else {
        node.error(err);
      }
    });
  },
  observe(node, resourcePath, resourceName, resourceType) {
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
    }).then((resp) => {
      for (let i = 0; i < node.resources.length; i += 1) {
        if (node.resources[i].name === resourceName) {
          node.resources[i].observeAsyncID = resp;
        }
      }
    }).catch((err) => {
      if (typeof err === 'number') {
        node.error(`Error starting observation, code: ${err}`);
      } else {
        node.error(err);
      }
    });
  },
};
