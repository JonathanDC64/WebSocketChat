"use strict"

class Chat{
	constructor(uri, outputCallback){
		this.wsUri = uri;
		this.websocket = null;
		this.connected = false;
		this.username = null;
		this.outputCallback = outputCallback;
		this.output(new Output("enterusername", "Enter a username:"));
	}
	
	connect(){
		this.websocket = new WebSocket(this.wsUri, "echo-protocol");
		this.connected = false;
		
		var self = this;
		
		this.websocket.onopen = 
			function(evt){
				self.output(new Output("connected", "Connected to: " + self.wsUri))
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
				self.output(new Output("disconnected","Disconnected from: " + self.wsUri));
				self.connected = false;
			};
		
		
		this.websocket.onmessage= 
			function(evt){
				var msg = JSON.parse(evt.data);
				var data = new Output(msg.type, null);
				switch(msg.type){
					case "sentmessage":
						data.message = 
							"<span>" +
								"<span class='bold'>" + 
									msg.username + 
								"</span>: " +
							msg.message + 
							"</span>";
						break;
						
					case "joined":
						data.message = 
							"<span class='success'>" +
								msg.message +
							"</span>";
						break;
						
					case "left":
						data.message = 
							"<span class='error'>" +
								msg.message +
							"</span>";
						break;
						
					case "userlist":
						data["users"] = msg.users;
						break;
				}
				if(data.type != null){
					self.output(data);
				}
				
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
	
	output(data){
		this.outputCallback(data);
	}
}

class Output{
	constructor(type, message){
		this.type = type;
		this.message = message;
	}
}