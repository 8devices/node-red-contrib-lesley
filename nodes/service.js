module.exports = function(RED) {
    function ServerNode(config) {
        
        var coap = require('coap');
		const Promise = require('promise');
		
        RED.nodes.createNode(this, config);
        var node = this;
		var Client = require('node-rest-client').Client;
		var url="http://localhost:8888/";
		
		var client = new Client();

        node.recieved=[];
		node.data=[];
        node.requests=[];
        node.id=[];
        node.send_time=[];
        node.response_url=[];
        
		node.on('input', function(msg) {
			function path_promise(name, uri) {
				return new Promise(function (fullfill) {
					client.get(url+"endpoints/" + name + uri, function (data, response) {
						node.requests.push(response.responseUrl);
						node.response_url.push(response.responseUrl);
						node.data.push(data);
						node.send_time.push((new Date()).getTime());
						node.id.push(data['async-response-id']);					
						fullfill();
					});
				});
			}
			
			function name_promise(name) {
				return new Promise(function (fullfill) {
					client.get(url+"endpoints/"+name, function (uris, response) {
						var path_promises = [];					
						for (var ui=0; ui<uris.length; ui++) {
							var uri = uris[ui].uri;
							path_promises.push(path_promise(name, uri));
						}
						Promise.all(path_promises).then(function (res) {
							fullfill();
						});
					});
				});
			}
			
			var endpoints_promises=[];
			
			function endpoints_promise() {
				return new Promise(function (fullfill) {
						client.get(url+"endpoints/", function (data, response) {
							var name_promises=[];
							for (var ci=0; ci<data.length; ci++) {
								name_promises.push(name_promise(data[ci].name));
							}
							Promise.all(name_promises).then(function (res) {
								fullfill();
							});
						});
				});
			}
			
			endpoints_promises.push(endpoints_promise());
			
			Promise.all(endpoints_promises).then(function (res) {
				var data_msg=[]
				msg.response_url=node.response_url;
				msg.id = node.id;
				node.send([msg, null]);
			});
			node.response_url=[];
			node.id=[];
        });
        
		(function(){
			client.get(url+"notification/pull", function (data, response) {
				var payload={};
				var msgn={};
				msgn.payloads=[];
				if(data.hasOwnProperty("async-responses")){
					for(var i = 0; i < data['async-responses'].length; i++){
						var sent_from_here = false;
						for(var j = node.data.length - 1; j >= 0; j--){
							payload={};
							if(data['async-responses'][i].id == node.data[j]['async-response-id']){
								payload.request = node.requests[j];
								payload.id = data["async-responses"][i].id;
								payload.status=data["async-responses"][i].status;
								if(data["async-responses"][i].hasOwnProperty("payload")){
									payload.payload=data["async-responses"][i].payload;
								}
								payload.sent_from="'service' node";
								msgn.payloads.push(payload);
								sent_from_here=true;
							}
							else{
								payload.req="if didnt work\n"+data['async-responses'][i].id +"\n"+node.data[j]['async-response-id'];
							}
							if((new Date).getTime()-node.send_time[j] >= 2 * 60000){
								node.data.splice(j, 1); 
								node.requests.splice(j, 1);
								node.send_time.splice(j,1);
							}
						}
						if(!sent_from_here){
							msgn.payloads.push(data['async-responses'][i]);
							msgn.payloads[i].sent_from="not 'service' node";
						}
					}
					node.send([null, msgn]);
				}		
			});		
			setTimeout(arguments.callee, 40000);
		})();
    };
    RED.nodes.registerType("service in", ServerNode);
}
