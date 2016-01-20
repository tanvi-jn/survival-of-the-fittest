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
    var playerColour = "#1a5d7a";
    var playerId;
    var playerSide;
    var oponentName;
    var readyToPlay = false;
    var lifeHasBegun = false;

    $(".colourBlock").on('click',function(){
        $(".colourBlock").removeClass('chosenBlock');
        $(this).addClass('chosenBlock');
        $('.landing').focus();
        playerColour = $(this).css("background-color");
    });
    var join = function(){
        if (playerColour !== undefined){
            player = {username:$("#playerNameInput").val(),colour:playerColour};
            socket.emit('joinRoom',player);
            $(".landing").hide();
            $('.game').show();
            drawGrid();
        }
    };
    $(".join").on('mousedown',join);
    $(document).keydown(function(event){
        if (event.keyCode == 13){
            join();
        }
        if (event.keyCode == 9){
            event.preventDefault()
            for (var i = 0; i < $('.colourBlock').length; i++){
                if ($('.chosenBlock')[0] === $('.colourBlock')[i]){
                    $($('.colourBlock')[(i+1)%$('.colourBlock').length]).click();
                    break;
                }
            }
        }
    });

    socket.on('roomJoined',function(data){
        playerId = data.id;
        species = data.species;
        cellsLeft = getSpecies(playerId).cellsLeft;
        world = data.world;
        playerSide = getSpecies(playerId).side;
        $(".numCellsLeft").text(cellsLeft);
        $(".playerName"+playerSide).text(getSpecies(playerId).username);
        $('.canvContainer').append('<div class="oponentOverlay"><span class="waitingLabel">Waiting for an oponent..</span></div>');
        var oponentSide = playerSide=='left'? 'right': 'left';
        $('.oponentOverlay').css(oponentSide, "0");
        if (species.length>1){
            var newSpecies = species[0];
            $(".playerName"+newSpecies.side).text(newSpecies.username);
            if (newSpecies.readyToPlay == false){
                $('.waitingLabel').text(newSpecies.username +" is birthing cells..");
            }else{
                $('.waitingLabel').text(newSpecies.username + " is ready!");
            }
        }
        $("." + playerSide + "Col").append('<input class="button-primary ready" value="Ready" type="submit">');
        $(".ready").on('mousedown',function(){
            if (!readyToPlay) {
                socket.emit("readyToPlay",{world:world});
                socket.on('readyRequestAcepted',function(){
                    console.log("Ready confirmed!");
                    $(".ready").hide();
                    $(".cellsLeft").hide();
                    readyToPlay = true;
                });
                socket.on('readyRequestRejected',function(data){
                    swal({title: "Request failed.",
                       text: data.message,
                       type: "error",
                       confirmButtonText: "Ok." 
                    });
                })
            }
        });
    });

    socket.on('newSpeciesJoined',function(data){
        species = data.species;
        var newSpecies = species[1];
        oponentName = newSpecies.username;
        $(".playerName"+newSpecies.side).text(newSpecies.username);
        $('.waitingLabel').text(newSpecies.username +" is birthing cells..");
    });

    socket.on('otherPlayerReady',function(){
        $('.waitingLabel').text(oponentName + " is ready!");
    });

    socket.on("worldUpdated",function(data){
        $('.oponentOverlay').remove();
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
        ctx.fillStyle="white";
        ctx.fillRect(0,0,canvW,canvH);
        ctx.strokeStyle="#50514f";
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
            ctx.strokeStyle="#50514f";
            ctx.lineWidth= 0.5;
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
                if (world[i][j]!==0){ //if cell is alive
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
        if (world[x][y]!==0){
            cellsLeft++;
            world[x][y] = 0;
        }else if(cellsLeft>0){
            cellsLeft--;
            world[x][y] = playerId;
        }
        $(".numCellsLeft").text(cellsLeft);
    }
    //

});