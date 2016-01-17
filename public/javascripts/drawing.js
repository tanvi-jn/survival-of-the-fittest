$(document).ready(function(){
    var socket = io();

    //canvas globals
    var canvas = document.getElementById("lifecanvas");
    var ctx = canvas.getContext("2d");
    var canvW = canvas.width;
    var canvH = canvas.height;
    var cellSize = 10;
    var world;
    var species;
    var playerName;
    var playerColour;
    var playerId;
    var playerSide;
    var readyToPlay = false;
    var lifeHasBegun = false;

    $(".colourBlock").on('mousedown',function(){
        //console.log(colour);
        playerColour = $(this).css("background-color");
        console.log(playerColour);
    });

    $(".join").on('mousedown',function(){
        if (playerColour !== undefined){
            player = {username:$("#playerNameInput").val(),colour:playerColour}; 
            socket.emit('joinRoom',player);
            $(".landing").hide();
            $('.game').show();
            drawGrid();
        }
    }); 

    socket.on('roomJoined',function(data){
        console.log(data);
        playerId = data.id;
        species = data.species;
        cellsLeft = getSpecies(playerId).cellsLeft;
        world = data.world;
        playerSide = getSpecies(playerId).side;
        $(".numCellsLeft").text(cellsLeft);
        $(".playerName"+playerSide).text(getSpecies(playerId).username);
        if (species.length>1){
            var newSpecies = species[0];
            $(".playerName"+newSpecies.side).text(newSpecies.username);
        }

        $(".ready-"+playerSide).on('mousedown',function(){
            $(this).hide();
            $(".cellsLeft").hide();
            if (!ready) socket.emit("readyToPlay",{world:world});
            readyToPlay = true;
        });
    });

    socket.on('newSpeciesJoined',function(data){
        console.log(data);
        species = data.species;
        var newSpecies = species[1];
        $(".playerName"+newSpecies.side).text(newSpecies.username);
    });

    socket.on("worldUpdated",function(data){
        $('.ready').hide();
        lifeHasBegun = true;
        world = data.world;
        drawFrame();
    });
    canvas.addEventListener("mousedown", onCanvasClick, false);

    function getSpecies(id){
        for (var i = 0; i < species.length; i++){
            if (species[i].id === id){
                return species[i];
            }
        }
    }

    function drawGrid(){
        ctx.strokeStyle="black";
        ctx.lineWidth= 0.1;
        //vertical
        for (var i= 0; i<=canvH; i+=cellSize){
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(canvW, i);
            ctx.stroke();
            ctx.closePath();
        }
        ///horizontal
        for (var j=0; j<=canvW; j+=cellSize){
            ctx.beginPath();
            ctx.moveTo(j, 0);
            ctx.lineTo(j, canvH);
            ctx.stroke();
            ctx.closePath();
        }
        if (!lifeHasBegun){
            ctx.strokeStyle="black";
            ctx.lineWidth= 1;
            ctx.beginPath();
            ctx.moveTo(canvW/2,0);
            ctx.lineTo(canvW/2,canvH);
            ctx.stroke();
            ctx.closePath();
        }

    }
      
    function drawCells(){
        for (var i=0; i<world.length; i++){
            for (var j=0; j<world[0].length; j++){
                if (world[i][j]!=0){ //if cell is alive
                    ctx.fillStyle=getSpecies(world[i][j]).colour; //grab colour
                    ctx.fillRect(i*cellSize,j*cellSize,cellSize,cellSize); //draw
                }   
            }
        }
    }

    function drawFrame(){
        ctx.clearRect(0,0,canvW,canvH);
        drawGrid();
        drawCells();
    }
//move the following code into the interface file

    function onCanvasClick(e){
        var rect = canvas.getBoundingClientRect(); //dimensions of canvas
        var mouse = {x: 0, y: 0}; //mouse click coordinates
        mouse.x = e.clientX - rect.left; //from world coords -> canvas coords
        mouse.y = e.clientY - rect.top;
        console.log("x: "+mouse.x+", y: "+mouse.y);
        //console.log(playerSide);
        //check if mouse click is within canvas, *(and on correct half of screen)
        if (0 <= mouse.y && mouse.y <= canvH && 0 <= mouse.x && !readyToPlay){
            if(mouse.x <= canvW/2 && playerSide==="left" || mouse.x > canvW/2 && playerSide==="right"){
                editCell(mouse);
            }
        }
        //temporary redrawing
        drawFrame();
    }

    function editCell(mouse){
        var x =Math.floor((mouse.x)/cellSize);
        var y =Math.floor((mouse.y)/cellSize);
        console.log(x+","+y);
        if (world[x][y]!=0) world[x][y] = 0;
        else if(cellsLeft>0){
            cellsLeft--;
            $(".numCellsLeft").text(cellsLeft);
            world[x][y] = playerId;
        }
    }
    //

});