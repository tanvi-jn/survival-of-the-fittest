$(document).ready(function(){

    //canvas globals
    var canvas = document.getElementById("lifecanvas");
    var ctx = canvas.getContext("2d");
    var canvW = canvas.width;
    var canvH = canvas.height;
    var cells;
    var species;

    function drawGrid(cellSize){
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
      
    function drawCells(cellSize, cells){
        console.log("hello");
        for (var i=0; i<cells.length; i++){
            for (var j=0; j<cells[0].length; j++){
                console.log("bloop");
                if (cells[i][j]==1){ //if cell is alive
                    //ctx.fillStyle=species[cells[i][j]]; //grab colour
                    console.log("found a cell!");
                    ctx.fillRect(i*cellSize,j*cellSize,cellSize,cellSize); //draw
                }   
            }
        }
    }
//move the following code into the interface file

    function editCell(e){
        var rect = canvas.getBoundingClientRect();
        cellX = e.clientX - rect.left;
        cellY = e.clientY - rect.top;
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
        for (var i = 0l i < cells.length; i++){
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

cells = initializeCells(10);
cells[0][0] = 1;
console.log(cells[5][10]);
drawGrid(10);
drawCells(10, cells);
canvas.addEventListener("click", editCell, false);

});