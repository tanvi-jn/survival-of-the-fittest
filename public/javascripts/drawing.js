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
    var lifeHasBegun = false;

    $(".colourBlock").on('mousedown',function(){
        //console.log(colour);
        playerColour = $(this).css("background-color");
        console.log(playerColour);
    });

    $(".join").on('mousedown',function(){
            player = {name:$("#playerNameInput").val(),colour:playerColour};
            console.log(player);
            socket.emit('joinRoom',player);
            $(".landing").hide();
            $('.game').show();
        });

    socket.on('roomJoined',function(data){
        playerId = data.id;
        species = data.species;
        world = data.world;
    });
    socket.on('newSpeciesJoined',function(data){
        species = data.species;
        world = data.world;
    });
    //socket.on('readyToPlay',)
    //let them place stuff on their half
    //send newly placed world back when they click ready

    canvas.addEventListener("mousedown", onCanvasClick, false);

    function drawGrid(){
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
            ctx.strokeStyle="red";
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
                    //ctx.fillStyle=species[world[i][j]]; //grab colour
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

    function getPlayerNameAndColour(){
        $('button').prop('disabled', false);
        $("#join").on('click',function(){ //when player hits join button
            var colour = $("#colour").val(); //colour string
            socket.emit('playerJoined',colour); //send colour to backend
        });
        var playerName = $("#pName").val();
    }

    function onCanvasClick(e){
        var rect = canvas.getBoundingClientRect(); //dimensions of canvas
        var mouse = {x: 0, y: 0}; //mouse click coordinates
        mouse.x = e.clientX - rect.left; //from world coords -> canvas coords
        mouse.y = e.clientY - rect.top;
        console.log("x: "+mouse.x+", y: "+mouse.y);
        //check if mouse click is within canvas, *(and on correct half of screen)
        if (0 <= mouse.y && mouse.y <= canvH && 0 <= mouse.x ){
            if(mouse.x <= canvW && lifeHasBegun || mouse.x <= canvW/2 && !lifeHasBegun){
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
        if (world[x][y]==1) world[x][y] = 0;
        else world[x][y] = 1;
    }
    //

});