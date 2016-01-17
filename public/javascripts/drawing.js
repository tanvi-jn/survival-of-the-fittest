$(document).ready(function(){
    var socket = io();

    //canvas globals
    var canvas = document.getElementById("lifecanvas");
    var ctx = canvas.getContext("2d");
    var canvW = canvas.width;
    var canvH = canvas.height;
    var cellSize = 10;
    var cells;
    var species;
    var playerName;
    var playerColour;

    $(".colourBlock").on('mousedown',function(){
        var colour = $('.colourBlock').attr('class').split(' ')[1];
        console.log(colour);
        playerColour = $("."+colour).attr("background");
        console.log(playerColour);
    });

    $(".join").on('mousedown',function(){
            player = {name:$("#playerNameInput").val(),colour:playerColour};
            console.log(player);
            socket.emit('joinGame',player);
            $(".landing").hide();
            $('.game').show();
        });

    cells = initializeCells(cellSize);
    drawGrid(cellSize);
    drawCells(cellSize, cells);
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
    }
      
    function drawCells(){
        for (var i=0; i<cells.length; i++){
            for (var j=0; j<cells[0].length; j++){
                if (cells[i][j]==1){ //if cell is alive
                    //ctx.fillStyle=species[cells[i][j]]; //grab colour
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
        if (0 <= mouse.x && mouse.x <= canvW && 0 <= mouse.y && mouse.y <= canvH){
            editCell(mouse);
        }
        //temporary redrawing
        drawFrame();
    }

    function editCell(mouse){
        var x =Math.floor((mouse.x)/cellSize);
        var y =Math.floor((mouse.y)/cellSize);
        console.log(x+","+y);
        if (cells[x][y]==1) cells[x][y] = 0;
        else cells[x][y] = 1;
    }
    //

//move the following code into game-mechanics file
    function initializeCells(cellSize){
        var cells = new Array(canvW/cellSize);
        for (var i = 0; i < canvW/cellSize; i++) {
            cells[i] = new Array(canvH/cellSize);
            for (var j = 0; j < canvH/cellSize; j++){
                cells[i][j] = 0;
            }
        }
        return cells;
    }

    function clearCells(cells){
        for (var i = 0; i < cells.length; i++){
            for (var j = 0; j < cells.length; j++) {
                cells[i][j] = 0;
            }
        }
    }

    function nextGen(cells, species){
        for (var i = 0; i < cells.length; i++){
            for (var j = 0; j < cells.length; j++) {
                var numberOfSpecies = species.length;

                n = world[i+1][j] + world[i-1][j] + world[i][j+1] + world[i][j-1] + world[i+1][j+1] + world[i+1][j-1] + world[i-1][j-1] + world[i-1][j+1];
                if (n < 2 || n > 3){
                    temp[i][j]=0; //cell dies due to under- or over-population
                }
                if(n == 2){ //with a balanced population, cell stays the same
                    temp[i][j]=world[i][j];
                }
                if(n == 3){ //with enough live neighbours, new cells may be "born"
                    temp[i][j]=1;
                }
            }
        }
    }

});