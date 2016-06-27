var chat = null;
$(function() {
	$("#chat").hide();
	$("#connectbutton").on("click", onConnectClick);
	$("#chatinputbutton").on("click", onClick);
	$("#chatinputtext").keypress(function(e) {
		if (e.which == 13) {
			e.preventDefault();
			sendMessage();
		}
	});
});

function onOutput(data) {
	if(data.type == "userlist"){
		var users = data.users;
		$("#userlist").empty();
		$.each(users, function(index, value){
			$("#userlist").append("<a href='#' class='list-group-item'><b>" + value  + "</b></a>");
		});
	}
	else{
		$("#chatoutput").append("<div>" + data.message + "</div>");
		$('.chatbox').scrollTop($('.chatbox')[0].scrollHeight);	
	}
}

function onConnectClick(e){

	if($("#address").val() != ""){
		chat = new Chat("ws://" + $("#address").val() + "/", onOutput);
		$("#connect").hide();
		$("#chat").show();
	}
}

function onClick(e) {
	sendMessage();
}

function sendMessage() {
	chat.input($("#chatinputtext").val());
	$("#chatinputtext").val("");
}