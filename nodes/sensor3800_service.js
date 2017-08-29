module.exports = function(RED) {
    function ServerNode(config) {
        
        var coap = require('coap');
		const Promise = require('promise');
		
        RED.nodes.createNode(this, config);
        var node = this;
		var Client = require('node-rest-client').Client;
		var url="http://localhost:8888/";
		
		var client = new Client();
		var name = config.id;
		var measurement = config.measurement;
		var interval = config.interval;
		var topic = config.topic;
		node.data=[];
        node.requests=[];
        node.send_time=[];
        
		setInterval(function(){
			var msg={};
			var endpoints_promises=[];
			function endpoints_promise() {
				return new Promise(function (fullfill) {
					if(name != ""){
						if(measurement==="Temperature" || measurement==="temperature"){
							client.get(url+"endpoints/"+name+"/3303/0/5700", function (data, response) {
								node.requests.push(response.responseUrl);
								node.data.push(data);
								node.send_time.push((new Date()).getTime());
								fullfill();
							});
						}
						else if(measurement==="Humidity" || measurement==="humidity"){
							client.get(url+"endpoints/"+name+"/3304/0/5700", function (data, response) {
								node.requests.push(response.responseUrl);
								node.data.push(data);
								node.send_time.push((new Date()).getTime());			
								fullfill();
							});
						}
					}	
				});
			}
			
			endpoints_promises.push(endpoints_promise());
			
			Promise.all(endpoints_promises).then(function (res) {
				msg.id = name;
				msg.measurement = measurement;
				msg.topic = topic;
				setTimeout(function(){ 
					client.get(url+"notification/pull", function (data, response) {
						if(data.hasOwnProperty("async-responses")){
							for(var i = 0; i < data['async-responses'].length; i++){
								for(var j = node.data.length - 1; j >= 0; j--){
									payload={};
									if(data['async-responses'][i].id == node.data[j]['async-response-id']){
										msg.response_url = node.requests[j];
										msg.async_id = data["async-responses"][i].id;
										msg.status=data["async-responses"][i].status;
										if(data["async-responses"][i].hasOwnProperty("payload")){
											var hexString = new Buffer(data["async-responses"][i].payload, 'base64').toString('hex');
											var res = hexString.slice(6, 15);
											var intData = new Uint32Array(1);
											intData[0] = parseInt(res, 16);
											var dataAsFloat = new Float32Array(intData.buffer);
											var result = dataAsFloat[0];
											msg.payload=result;
											msg.debug_hex=hexString;
										}
									}
									if((new Date).getTime()-node.send_time[j] >= 2 * 60000){
										node.data.splice(j, 1); 
										node.requests.splice(j, 1);
										node.send_time.splice(j,1);
									}
								}
							}
							if(msg.hasOwnProperty("async_id")){
								node.send(msg);
							}
						}
					});	
				}, 5000);
			});
        } , interval * 60000);
    };
    RED.nodes.registerType("sensor3800_service in", ServerNode);
}
