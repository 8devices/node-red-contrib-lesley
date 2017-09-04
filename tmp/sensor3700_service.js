module.exports = function(RED) {
    function ServerNode(config) {
        
        var coap = require('coap');
		const Promise = require('promise');
		var service = require('./service-lesley');
        RED.nodes.createNode(this, config);
        var node = this;
		var Client = require('node-rest-client').Client;
		var url = "http://localhost:8888/";
		
		node.service = RED.nodes.getNode(config.service);
		
		var client = new Client();
		var name = config.id;
		var measurement = config.measurement;
		var interval = config.interval;
		var topic = config.topic;
		var service_name = config.service;
		
        setInterval(function () {
			var path =  "";
			if(measurement === "Temperature" || measurement === "temperature"){
				path = "/3303/0/5700";	
			}
			else if(measurement === "Humidity" || measurement === "humidity"){
				path = "/3304/0/5700";
			}
			service.get_transaction(url+"endpoints/"+name+path, function (resp) {
						var msg = {};
						msg.topic = topic;
						msg.measurement = measurement;
						msg.status = resp.status;
						if(resp.hasOwnProperty("payload")) {
							var hexString = new Buffer(resp.payload, 'base64').toString('hex');
							var res = hexString.slice(6, 15);
							var intData = new Uint32Array(1);
							intData[0] = parseInt(res, 16);
							var dataAsFloat = new Float32Array(intData.buffer);
							msg.payload = dataAsFloat[0];
						}
						node.send(msg);
				});
		}, interval * 60000);
    };
    RED.nodes.registerType("sensor3800_service in", ServerNode);
}
