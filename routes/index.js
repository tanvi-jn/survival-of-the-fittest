var express = require('express');
var router = express.Router();


module.exports.getRouter = function(io){

	router.get('/', function(req, res, next) {
		res.render('index.html');
	});


	var activeRooms = {'room0': generateRoom() };
	var roomIdCount = 0;
	var userCount = 0;
	var initialPlacableCellAmount = 30;

	io.sockets.on('connection', function(socket){

		socket.on('joinRoom',function(data){
			socket.data = {};
			socket.data.id = userCount++;
			socket.data.colour = data.colour;
			socket.data.cellsLeft = initialPlacableCellAmount;
			socket.data.readyToPlay = false;
			if (activeRooms['room' + roomIdCount].species.length == 2 ){
				activeRooms['room' + ++roomIdCount] = generateRoom();
			}
			var assignedRoom = 'room' + roomIdCount;
			socket.join(assignedRoom);
			socket.data.room = assignedRoom;
			activeRooms[assignedRoom].species[species.length] = socket.data;
			socket.emit('roomJoined',activeRooms[assignedRoom]);
			socket.broadcast.to(assignedRoom).emit('newSpeciesJoined',activeRooms[assignedRoom]);
		});
	});

	function generateRoom(){
		return {species: []};
	}
	return router;
};
