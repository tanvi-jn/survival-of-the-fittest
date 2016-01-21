var express = require('express');
var router = express.Router();


module.exports.getRouter = function(io){

	router.get('/', function(req, res, next) {
		res.render('index.html');
	});

	var roomIdCount = 0;
	var userCount = 1;
	var horizontalCellNum = 70;
	var verticalCellNum = 50;
	var initialPlacableCellAmount = 100;
	var activeRooms = {'room0': generateRoom() };

	io.sockets.on('connection', function(socket){
		socket.on('joinRoom',function(data){
			socket.data = {};
			socket.data.id = userCount++;
			socket.data.username = data.username;
			socket.data.colour = data.colour;
			socket.data.cellsLeft = initialPlacableCellAmount;
			socket.data.readyToPlay = false;
			if (activeRooms['room' + roomIdCount].species.length == activeRooms['room' + roomIdCount].capacity ){
				activeRooms['room' + (++roomIdCount)] = generateRoom();
			}
			var assignedRoom = 'room' + roomIdCount;
			socket.join(assignedRoom);
			socket.data.room = assignedRoom;
			if (activeRooms[assignedRoom].species.length === 0){
				socket.data.side = "left";
			}else if (activeRooms[assignedRoom].species.length === 1){
				socket.data.side = "right";
			}
			activeRooms[assignedRoom].species[activeRooms[assignedRoom].species.length] = socket.data;
			socket.emit('roomJoined',{species: activeRooms[assignedRoom].species, world: generateBlankWorld(horizontalCellNum,verticalCellNum), id: socket.data.id});
			socket.broadcast.to(assignedRoom).emit('newSpeciesJoined',{species: activeRooms[assignedRoom].species, world: generateBlankWorld(horizontalCellNum,verticalCellNum)});
			socket.on('disconnect',function(){
				if (activeRooms[assignedRoom] !== undefined){
					for (var i = 0; i < activeRooms[assignedRoom].species.length;i++){
						activeRooms[assignedRoom].species.splice(i,1);
					}
					if (activeRooms[assignedRoom].species.length === 0 || activeRooms[assignedRoom].lifeStarted){
						socket.broadcast.to(assignedRoom).emit('lifeOver');
						delete activeRooms[assignedRoom];
						if (assignedRoom === ('room' + roomIdCount)){
							activeRooms['room' + (++roomIdCount)] = generateRoom();
						}
					}
				}
				socket.broadcast.to(assignedRoom).emit('speciesDisconnected',socket.data.id);
				socket.leave(socket.data.room);
			});
		});

		socket.on('requestPractice',function(){
			if (activeRooms[socket.data.room].species.length <= 1){
				activeRooms[socket.data.room].capacity = 1;
				activeRooms[socket.data.room].practiceMode = true;
				socket.emit('practiceStarted');
			}
		});

		socket.on('readyToPlay',function(data){
			if (activeRooms[socket.data.room] !== undefined){
				if (!activeRooms[socket.data.room].lifeStarted){
					if (copyPortionOfTheWorld(socket.data.side,activeRooms[socket.data.room].world,data.world,activeRooms[socket.data.room].capacity,activeRooms[socket.data.room].practiceMode,horizontalCellNum,verticalCellNum)){
						socket.emit('readyRequestAcepted');
						socket.data.readyToPlay = true;
						socket.broadcast.to(socket.data.room).emit('otherPlayerReady');
						var allReadyToPlay = true;
						for (var i = 0; i < activeRooms[socket.data.room].species.length; i++){
							if (activeRooms[socket.data.room].species[i].id === socket.id){
								//TODO: Check whether this is even neccesary or if aliasing takes care of it.
								activeRooms[socket.data.room].species[i].readyToPlay = socket.data.readyToPlay;
							}
							allReadyToPlay = allReadyToPlay && activeRooms[socket.data.room].species[i].readyToPlay;
						}
						if (allReadyToPlay && (activeRooms[socket.data.room].species.length == activeRooms[socket.data.room].capacity)){
							activeRooms[socket.data.room].allReadyToPlay = true;
							activeRooms[socket.data.room].lifeStarted = true;
							sendUpdatedWorld(socket.data.room);
						}
					}else{
						socket.emit('readyRequestRejected',{message: "Invalid placing of cells."});
					}
				}
		}
		});
	});

	function generateRoom(){
		return {species: [], world: generateBlankWorld(horizontalCellNum,verticalCellNum),capacity: 2,practiceMode: false, allReadyToPlay: false, lifeStarted: false};
	}

	function generateBlankWorld(horizontalCellNum,verticalCellNum){
		if (horizontalCellNum % 2 === 0){
			var cells = new Array(horizontalCellNum);
			for (var i = 0; i < horizontalCellNum; i++) {
				cells[i] = new Array(verticalCellNum);
				for (var j = 0; j < verticalCellNum; j++){
					cells[i][j] = 0;
				}
			}
			return cells;
		}else{
			console.log("horizontalCellNum:"+ horizontalCellNum +" needs to be set to an evenly divisible number.");
			return undefined;
		}
	}

	function copyPortionOfTheWorld(side,originalWorld,recievedWorld,capacity,practiceMode,horizontalCellNum,verticalCellNum){
		var startIndex = (side=='left')? 0 : horizontalCellNum/capacity;
		var endIndex = startIndex + horizontalCellNum/capacity;
		//TODO: Do checking that they didnt place more cells then allowed
		var totalPlaced = 0;
		for (var i = startIndex; i < endIndex; i++){
			for (var j = 0; j < verticalCellNum;j++){
				totalPlaced += (recievedWorld[i][j] === 0)? 0 : 1;
			}
		}
		if (totalPlaced > initialPlacableCellAmount && !practiceMode){return false;}
		for (var i = startIndex; i < endIndex; i++){
			for (var j = 0; j < verticalCellNum;j++){
				originalWorld[i][j] = recievedWorld[i][j];
			}
		}
		return true;
	}
	function getCell(world,i,j){
		var mod = function(num, divisor) {
			return ((num%divisor)+divisor)%divisor;
		};
		return world[mod(i,horizontalCellNum)][mod(j,verticalCellNum)];
	}
	function updateWorld(world,room){
		var worldToReturn = generateBlankWorld(world.length,world[0].length);
		for (var i = 0; i < world.length; i++){
			for (var j = 0; j < world[i].length; j++) {
				var totalNeighbourCount = 0;
				var idOfMaxNeighbour;
				var countOfMaxNeighbour = Number.NEGATIVE_INFINITY;
				for (var k = 0; k < activeRooms[room].species.length; k++){
					var id = activeRooms[room].species[k].id;
					var countForSpecies = ((getCell(world,i+1,j)===id)? 1 : 0) + ((getCell(world,i-1,j)===id)? 1 : 0) + ((getCell(world,i,j+1)===id)? 1 : 0) + ((getCell(world,i,j-1)===id)? 1 : 0) + ((getCell(world,i+1,j+1)===id)? 1 : 0) + ((getCell(world,i+1,j-1)===id)? 1 : 0) + ((getCell(world,i-1,j-1)===id)? 1 : 0) + ((getCell(world,i-1,j+1)===id)? 1 : 0);
					if (countForSpecies>countOfMaxNeighbour){
						idOfMaxNeighbour = id;
						countOfMaxNeighbour = countForSpecies;
					}
					totalNeighbourCount += countForSpecies;
				}

				if (totalNeighbourCount < 2 || totalNeighbourCount > 3){
					worldToReturn[i][j]=0;
				}
				if(totalNeighbourCount == 2){
					worldToReturn[i][j]=world[i][j];
				}
				if(totalNeighbourCount == 3){
					worldToReturn[i][j]=idOfMaxNeighbour;
				}
			}
		}
		return worldToReturn;
	}
	function sendUpdatedWorld(room){
		if (activeRooms[room] !== undefined){
		if (activeRooms[room].lifeStarted){
			activeRooms[room].world = updateWorld(activeRooms[room].world,room);
			io.sockets.in(room).emit('worldUpdated',{world: activeRooms[room].world});
			setTimeout(sendUpdatedWorld,150,room);
		}
		}
	}
	return router;
};