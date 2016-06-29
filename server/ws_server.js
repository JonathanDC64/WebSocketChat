var WebSocketServer = require('websocket').server;
var http = require('http');
var https = require('https');
var fs = require('fs');
var xss = require('xss');
var crypto = require('crypto');
var User = require('./User.js');

// Private key and certification used for https
var options = {
  key: fs.readFileSync('cert/server.key', 'utf8'),
  cert: fs.readFileSync('cert/server.crt', 'utf8')
};

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(200);
    response.end();
});

var port = 8080;
server.listen(port, function() {
    console.log((new Date()) + ' Server is listening on port ' + port);
});

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

var clients = [];
var USERNAME_MAX_LENGTH = 32;
var MESSAGE_MAX_LENGTH = 1024;

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
	
    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');
	
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
			var msg = JSON.parse(message.utf8Data);
			switch(msg.type){
				case "username":
					this.user = new User(xss(msg.username.substr(0, USERNAME_MAX_LENGTH)));
					console.log("User:" + JSON.stringify(this.user));
					clients[this.user.username] = this;
					broadcast({
							type: "joined",
							message: this.user.username + " joined the chat."
						});
					
					broadcastUserlist();
					break;
					
				case "message":
					if(msg.text.length <= MESSAGE_MAX_LENGTH)
						broadcast({
							type: "sentmessage",
							username: this.user.username,
							message: xss(msg.text)
						});
					else
						this.sendUTF("Message must be 1024 characters or less");
					break;
			}
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
	
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
		delete clients[this.user.username];
		broadcast({
			type: "left",
			message: this.user.username + " left the chat."
		});
		broadcastUserlist();
    });
});

function broadcastUserlist(){
	var _users = getUserList();
	broadcast({
			type: "userlist",
			users: _users
	   }
	);
}

function unicast(client, data){
	client.sendUTF(JSON.stringify(data));
}

function broadcast(data){
	Object.keys(clients).forEach(function(key,index) {
    	clients[key].sendUTF(JSON.stringify(data));
	});
}

function getUserList(){
	var users = [];
	Object.keys(clients).forEach(function(key,index){
		users.push(key);
	});
	return users;
}