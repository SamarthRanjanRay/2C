// Gets DOM ready
$(function(){

	// Uses variable equivalents of jQuery for easy usage
	var socket = io('/')
	var message = $("#message")
	var chat_zone = $("#chat_zone")
	var feedback = $("#feedback")
	var changename = $("#changename")
	var user = $("#user_zone")
	var users_btn = $("#users_btn")
	var active_users = $("#active_users")
	var settings = $("#settings_zone")
	var settings_btn = $("#settings_btn")
	var username = $("#username")
	var avatar = $("#avatar")
	var set = $("#set")
	var rooms = $("#rooms")

	// Alerts the user about the username and avatar fields in settings zone
	alert("Click on the settings icon and change your username and avatar for better experience.")

	// Makes the user join the room
	socket.emit("join_room", {room: room})

	// Translates the settings button and the zone in and out of screen
	settings_btn.click(function() {
		if(settings_btn.css("margin-right")==="0px") {
			settings_btn.css("margin-right", "45%")
			settings.css("margin-right", "0px")
		}
		else {
			settings_btn.css("margin-right", "0px")
			settings.css("margin-right", "-45%")
		}
	})

	// Translates the users button and the zone in and out of screen
	users_btn.click(function() {
		if(users_btn.css("margin-left")==="0px") {
			users_btn.css("margin-left", "45%")
			user.css("margin-left", "0px")
		}
		else {
			users_btn.css("margin-left", "0px")
			user.css("margin-left", "-45%")
		}
	})

	// Applies Enter event to set username
	username.bind("keypress", function (event) {
		if (event.key == "Enter") {
			socket.emit('update_username', {username : username.val()})
		}
	})

	// Applies Enter event to set avatar
	avatar.bind("keypress", function (event) {
		if (event.key == "Enter") {
			socket.emit('update_avatar', {avatarlink : avatar.val()})
		}
	})

	// Applies Username and Avatar at the same time
	set.bind("click", function () {
		socket.emit('update_username', {username : username.val()})
		socket.emit('update_avatar', {avatarlink : avatar.val()})
	})


	// Updates the Active Users in the current chat room
	socket.on('update_list', function (sdata) {
		active_users.html('')
		sdata.arr.forEach(function (username) {
			active_users.append("<listitem>" + username + "</listitem>")
		})
	})

	// Informs the user if the name is already taken / someone else is trying to apply your username
	socket.on('username_exists', function(sdata) {
		if(sdata.username==username.val())
			alert('If you are changing username, then please try a new one as this one already exists. For others, someone is trying to use your username (or you only tried to set yours again).')
	})

	// Concats new messages into the chatroom with proper aligment
	socket.on('new_message',function (sdata) {
		feedback.html('')
		// Aligns the user's own messages to the right
		if (sdata.username==username.val()) {
			chat_zone.append("<p class='my message'>" + sdata.message + "</p>")
			message.val('')
		}
		// Aligns everyone else's messages to the left
		else {
			// Prepends only username if no avatar is set
			if (sdata.avatarlink=="") {
				chat_zone.append("<p class='message'>" + sdata.username + " : " + sdata.message + "</p>")
			}
			// Prepends avatar and username on hover when avatar is present
			else {
				chat_zone.append("<p class='message'><img src='" + sdata.avatarlink + "' height='35px' width='35px' title='" + sdata.username + "'><span class='txt'>" + sdata.message + "</span></p>")
			}
		}
	})

	// Binds Event key for the message box
	message.bind("keypress",function () {
		// Emits typing message to server
		socket.emit('typing')
		if (event.key == "Enter") {
			// Checks that the message box is not empty and sends the message to everyone
			if (!(message.val()==null || message.val()=="")) {
				event.preventDefault()
				socket.emit('new_message', {message : message.val()})
			}
			// Alerts the user to fill some characters into the message box before hitting enter
			else {
				alert("Please enter something into the textbox")
			}
		}
		// Animates the chat box to automatially slide down to the new messages
		chat_zone.stop().animate({
  		scrollTop: chat_zone[0].scrollHeight
		}, 800)
	})

	// Broadcasts username is typing to everyone else other than the typing user
	socket.on('typing',function (sdata) {
		feedback.html("<p><i>" + sdata.username + " is typing a message..." + "</i></p>")
	})

	// Braodcasts change in username for others to know
	socket.on('change_username',function (sdata) {
		changename.html("<p><i>" + sdata.old + " is now known as... " + sdata.new + "</i></p>")
		setTimeout(function () {
			changename.html('')
		}, 5000)
	})
})
