// Declares dependencies
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const PORT = process.env.PORT || 5000

// Declare the total users joined till date variable
var user_count = -1;

// Declares engines and other properties
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Renders room choice page when landing on the home page
app.get('/', (req, res) => {
	res.render('room')
})

// Redirects the user to the chat box with a specific url which contains the name of the room they intend to join
app.post('/', (req, res) => {
	req.body.room = req.body.room.replace(/</g, "&lt;").replace(/>/g, "&gt;");
	res.redirect('/' + req.body.room);
})

// Renders the chatbox for the user
app.get('/:room', (req, res) => {
	res.render('index', {room:req.params.room})
})

// Listens the application on 3000 port
server = app.listen(PORT)

// Socket io main defenitions
const io = require('socket.io')(server)

// Declares all functions of socket during its connection time
io.on('connection', (socket) => {
	// Sets a unique name, no avatar and no room name for the socket initially
	socket.username = "Nameless#" + ++user_count
	socket.avatar = ""
	socket.room = ""
	socket.mate = []
	// Assigns the room to the user
	socket.on('join_room', (cdata) => {
    socket.join(cdata.room)
		socket.room = cdata.room
		// Create array of all users' username in the room
		io.in(socket.room).clients((error, clients) => {
			clients.forEach ( function (sid) {
				socket.mate.push(io.sockets.sockets[sid].username)
			})
			// Updates the active user list
			io.sockets.in(socket.room).emit('update_list', {arr : socket.mate})
		})
	})

	// Server checks if the username exists or not and then proceeds with assigning username
  socket.on('update_username', (cdata) => {
		io.in(socket.room).clients((error, clients) => {
			socket.mate = []
			// Create array of all users' username in the room
			clients.forEach ( function (sid) {
				socket.mate.push(io.sockets.sockets[sid].username)
			})
			// Uses the function to know if the username already exists with some other user or not
			// If the username already exists, it alerts the user to try a new one
			if(socket.mate.includes(cdata.username)) {
				io.sockets.in(socket.room).emit('username_exists', {username: cdata.username})
			}
			// If the username doesnt exists, it assigns the username to the user and updates the active user list
			else {
				socket.mate.push(cdata.username)
				// Filters out the old username, if it was there in the list
				socket.mate = socket.mate.filter( function (username) {
					return username != socket.username
				})
				// Broadcasts the information of change of username of a user to everyone else in the room
				socket.broadcast.in(socket.room).emit('change_username', {old: socket.username, new: cdata.username})
				// Asigns the username
				socket.username = cdata.username
				// Updates the active users list
				io.sockets.in(socket.room).emit('update_list', {arr : socket.mate})
			}
		})
  })

	// Updates the avatar of a user
	socket.on('update_avatar', (cdata) => {
		socket.avatar = cdata.avatarlink
	})

	// Broadcasts a user is typing message to everyone else in the room
  socket.on('typing', () => {
  	socket.broadcast.in(socket.room).emit('typing', {username : socket.username})
  })

	// Emits the message sent by a user to everyone in the room
  socket.on('new_message', (cdata) => {
    io.sockets.in(socket.room).emit('new_message', {message : cdata.message, username : socket.username, avatarlink: socket.avatar});
  })


	// On disconnection, removes the user from the list of active users
	socket.on('disconnect', function () {
		socket.mate = []
		io.in(socket.room).clients((error, clients) => {
			clients.forEach ( function (sid) {
				socket.mate.push(io.sockets.sockets[sid].username)
			})
			// Updates the active users list
			io.sockets.in(socket.room).emit('update_list', {arr : socket.mate})
		})
  })
})
