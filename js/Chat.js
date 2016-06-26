"use strict"

class Chat{
	constructor(uri, outputCallback){
		this.wsUri = uri;
		this.websocket = null;
		this.connected = false;
		this.username = null;
		this.outputCallback = outputCallback;
		this.output("Enter a username:");
	}
	
	connect(){
		this.websocket = new WebSocket(this.wsUri, "echo-protocol");
		this.connected = false;
		
		var self = this;
		
		this.websocket.onopen = 
			function(evt){
				self.output("Connected to: " + self.wsUri)
				self.connected = true;
				self.sendData(
					{
						type: "username",
						username: self.username
					}
				);
			};
		
		
		this.websocket.onclose = 
			function(evt){
				self.output("Disconnected from: " + self.wsUri);
				self.connected = false;
			};
		
		
		this.websocket.onmessage= 
			function(evt){
				self.output(evt.data)
			};
		
		
		this.websocket.onerror = 
			function(evt){
				self.output(evt.data)
			};
	}
	
	close(){
		this.websocket.close();
	}
	
	isConnected(){
		return this.connected;
	}
	
	sendData(data){
		this.websocket.send(JSON.stringify(data));
	}
	
	input(message){
		if(message != "" && message != null){
			if(!this.isConnected() && this.username == null){
				this.username = message;
				this.connect();
			}
			else{
				var msg = {
					type: "message",
					text: message,
					username: this.username,
					date: Date.now()
				  };
				this.sendData(msg);
			}
		}
	}
	
	output(text){
		var out = text;
		this.outputCallback(out);
	}
}