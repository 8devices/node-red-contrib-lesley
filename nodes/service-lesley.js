module.exports = function(RED) {
    var coap = require("coap");
    var Client = require('node-rest-client').Client;

    function LesleyService(config) {
        RED.nodes.createNode(this, config);
        
        var service = this;
        service.options = {};
        service.options.name = config.name;
        service.pending_transactions = [];
        var client = new Client();
        var url = "http://localhost:8888/";
        methods = {
			get_transaction: function (url, callback) {
				client.get(url, function (data, response) {
					var trans = {};
					trans.cb = callback;
					trans.id = data["async-response-id"];
					trans.time = (new Date).getTime();
					service.pending_transactions.push(trans);
				});
			}
		};

		setInterval(function () {
			client.get(url+"notification/pull", function (data, response) {
				if(data.hasOwnProperty("async-responses")) {
					for(var i = 0; i < data['async-responses'].length; i++){
						for(var j = service.pending_transactions.length - 1; j >= 0; j--) {
							if(data['async-responses'][i].id == service.pending_transactions[j].id) {
								service.pending_transactions[j].cb(data['async-responses'][i]);
							}
							if((new Date).getTime()-service.pending_transactions[j].time >= 2 * 60000){
								service.pending_transactions.splice(j, 1);
							}
						}
					}
				}
			});
		}, 5000);
		module.exports = methods;
    }
    RED.nodes.registerType("service-lesley", LesleyService);
}
