'use strict';

const restAPI = require('restserver-api');

const { Lwm2m } = restAPI;
const { RESOURCE_TYPE, encodeResource, decodeResource } = Lwm2m.TLV;

const STATE = {
  INIT: 'initializing',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
};

class ObserveSensorNode {
  constructor(RED, config) {
    RED.nodes.createNode(this, config);

    // Parse configuration
    this.serviceNode = RED.nodes.getNode(config.service);
    this.name = config.uuid;
    this.observationInterval = Number(config.interval || 60);

    // Initialize core variables
    this.device = new restAPI.Device(this.serviceNode.service, this.name);
    this.resources = [];

    this.state = '';
    this.cache = {};

    this.setState(STATE.INIT);

    this.serviceNode.attach(this);

    this.device.on('register', () => {
      this.setState(STATE.CONNECTED);

      const msg = {};
      msg.payload = {
        state: this.state,
        data: {},
        cache: Object.assign({}, this.cache),
      };
      this.send(msg);

      this.configure();
    });

    this.device.on('update', () => {
      this.setState(STATE.CONNECTED);
    });

    this.device.on('deregister', () => {
      this.setState(STATE.DISCONNECTED);

      const msg = {};
      msg.payload = {
        state: this.state,
        data: {},
        cache: Object.assign({}, this.cache),
      };
      this.send(msg);
    });

    this.serviceNode.on('started', () => {
      this.device.getObjects().then(() => {
        this.setState(STATE.CONNECTED);

        const msg = {};
        msg.payload = {
          state: this.state,
          data: {},
          cache: Object.assign({}, this.cache),
        };
        this.send(msg);

        this.configure();
      }).catch((err) => {
        if (typeof err === 'number') {
          if (err === 404) {
            this.setState(STATE.DISCONNECTED);

            const msg = {};
            msg.payload = {
              state: this.state,
              data: {},
              cache: Object.assign({}, this.cache),
            };
            this.send(msg);
          } else {
            this.error(`Error getting objects for endpoint, code: ${err}`);
          }
        } else {
          this.error(err);
        }
      });
    });

    this.on('close', (done) => {
      const promises = [];

      for (let i = 0; i < this.resources.length; i += 1) {
        if (this.resources[i].observeAsyncID !== undefined) {
          promises.push(this.device.cancelObserve(this.resources[i].path));
        }
      }

      Promise.all(promises).catch((err) => {
        this.error(err);
      }).finally(() => {
        this.serviceNode.detach(this);
        done();
      });
    });
  }

  setState(state) {
    this.state = state;

    const status = {
      fill: 'grey',
      shape: 'dot',
      text: state,
    };

    if (state === STATE.CONNECTED) {
      status.fill = 'green';
    } else if (state === STATE.DISCONNECTED) {
      status.fill = 'red';
    }

    this.status(status);
  }

  observe(resourcePath, resourceName, resourceType) {
    this.device.observe(resourcePath, (err, response) => {
      const buffer = Buffer.from(response, 'base64');
      const decodedResource = decodeResource(buffer, {
        identifier: Number(resourcePath.split('/')[3]),
        type: resourceType,
      });
      const resourceValue = decodedResource.value;

      this.cache[resourceName] = resourceValue;

      const msg = {};
      msg.payload = {
        state: this.state,
        data: {},
        cache: Object.assign({}, this.cache),
      };
      msg.payload.data[resourceName] = resourceValue;
      this.send(msg);
    }).then((resp) => {
      for (let i = 0; i < this.resources.length; i += 1) {
        if (this.resources[i].name === resourceName) {
          this.resources[i].observeAsyncID = resp;
        }
      }
    }).catch((err) => {
      if (typeof err === 'number') {
        this.error(`Error starting observation, code: ${err}`);
      } else {
        this.error(err);
      }
    });
  }

  configure() {
    this.device.write(
      '/1/0/3',
      () => { },
      encodeResource({
        identifier: 3,
        type: RESOURCE_TYPE.INTEGER,
        value: this.observationInterval,
      }),
    ).then(() => {
      this.resources.forEach((resource) => {
        if (resource.need) {
          this.observe(resource.path, resource.name, resource.type);
        }
      });
    }).catch((err) => {
      if (typeof err === 'number') {
        this.error(`Error setting observation time interval, code: ${err}`);
      } else {
        this.error(err);
      }
    });
  }
}

module.exports.ObserveSensorNode = ObserveSensorNode;
