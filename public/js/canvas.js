const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');
const ConnManager = require('./connectionManager');
const connectionManager = new ConnManager();
const arena = connectionManager.arena;
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;

let cellSize = calculateCellSize();
let mouseX, mouseY;
let boardWidth = 15 * cellSize;
const spriteSheet = new Image();
let myself = arena.player1;
let enemy = arena.player2;

const fontSize = 50;
const fontBase = 1920;

connectionManager.connect('ws://localhost:3000/index');

const rects = [];

const sessionId = window.location.hash.split('#')[1];

connectionManager.conn.onopen = function(){
    connectionManager.joinSession(sessionId);
    connectionManager.getArenaInformation();
}


document.addEventListener('keydown', event => {
   if(event.code === "KeyR"){
       console.log("PRESSED THIS SHIT")
       connectionManager.sendKeyPress("R");
   }
});

function getTextWidth(text) {
    context.font = getFont();
    const metrics = context.measureText(text);
    return metrics.width;
}

function getFontSize() {
    const ratio = fontSize / fontBase;
    return canvas.width * ratio;
}

function getFont() {
    return (getFontSize() | 0) + 'px ARIAL'; // set font
}

function getSizeRatio() {
    return canvas.width / 1920;
}

function loadSprites() {
    spriteSheet.src = 'res/tiwpr.png';
    spriteSheet.onload = function () {
    }
}

canvas.onmousemove = function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
};

function calculateCellSize(){
    return Math.floor(canvas.width / 40);
}

function createRectangleArray(id) {
    cellSize = calculateCellSize();
    boardWidth = 6 * cellSize;
    let distance = canvas.width - 6 * cellSize - boardWidth * 2;
    let deltaX = (id - 1) * distance + cellSize * 6;
    let deltaY = 5 * cellSize;
    for (let i = 0; i < 36; i++) {
        let x = Math.floor(i % 6);
        let y = Math.floor(i / 6);
        rects[i] = {
            x: deltaX + x * cellSize,
            y: deltaY + y * cellSize,
            size: cellSize
        }
    }
    console.table(rects);
}



function drawMaze(player){
    let displacementX = cellSize * 2 + player * cellSize * 20;
    let displacementY = cellSize * 2;
    for (let row = 0; row < arena.height; row++) {
        for (let col = 0; col < arena.height; col++) {
            context.strokeStyle = 'rgb(255, 255, 255)';
            if(arena.loaded) {
                if (arena.maze[row][col].top) {
                    context.beginPath();
                    context.moveTo(displacementX + cellSize * col, displacementY + cellSize * row);
                    context.lineTo(displacementX + cellSize * (col + 1), displacementY + cellSize * row);
                    context.stroke();
                }
                if (arena.maze[row][col].left) {
                    context.beginPath();
                    context.moveTo(displacementX + cellSize * col, displacementY + cellSize * row);
                    context.lineTo(displacementX + cellSize * col, displacementY + cellSize * (row + 1));
                    context.stroke();
                }
                if (arena.maze[row][col].right) {
                    context.beginPath();
                    context.moveTo(displacementX + cellSize * (col + 1), displacementY + cellSize * (row + 1));
                    context.lineTo(displacementX + cellSize * (col + 1), displacementY + cellSize * row);
                    context.stroke();
                }
                if (arena.maze[row][col].bottom) {
                    context.beginPath();
                    context.moveTo(displacementX + cellSize * (col + 1), displacementY + cellSize * (row + 1));
                    context.lineTo(displacementX + cellSize * col, displacementY + cellSize * (row + 1));
                    context.stroke();
                }
            }
        }
    }
}


window.addEventListener('resize', resizeCanvas, false);

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cellSize = calculateCellSize();
    boardWidth = cellSize * 15;
    drawBoard();
    print(arena.player1);
    print(arena.player2);
}

function print(player) {
    let displacementX = cellSize * 2 + (player.id - 1) * cellSize * 20;
    let displacementY = cellSize * 3;
    context.font = getFont();
    context.fillStyle = "WHITE";
    context.fillText(player.timer + " ms", displacementX, displacementY - cellSize);
    context.fillText(player.name, displacementX, boardWidth + displacementY);
    if(!player.ready){
        context.fillStyle = "RED";
        context.fillText("Press R to make yourself ready", displacementX, displacementY + boardWidth / 2);
    }
}

function update() {
    setInterval(function () {
        drawBoard()
        arena.update(performance.now());
        print(arena.player1);
        print(arena.player2);
    }, 10);
}

function startGame() {
    loadSprites()
    update()
}

startGame()

function drawBoard() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawMaze(0)
    drawMaze(1)
    // drawGrid(myself)
    // drawGrid(enemy)
}

// function doKeyDown(evt)
// {
//     var handled = false;
//     if (playing) {
//         switch (evt.keyCode) {
//             case 38:  /* Up arrow was pressed */
//                 m.moveup("canvas");
//                 handled = true
//                 break;
//             case 87:  /* Up arrow was pressed */
//                 m.moveup("canvas");
//                 handled = true
//                 break;
//             case 40 :  /* Down arrow was pressed */
//                 m.movedown("canvas");
//                 handled = true
//                 break;
//             case 83 :  /* Down arrow was pressed */
//                 m.movedown("canvas");
//                 handled = true
//                 break;
//             case 37:  /* Left arrow was pressed */
//                 m.moveleft("canvas");
//                 handled = true
//                 break;
//             case 65:  /* Left arrow was pressed */
//                 m.moveleft("canvas");
//                 handled = true
//                 break;
//             case 39:  /* Right arrow was pressed */
//                 m.moveright("canvas");
//                 handled = true
//                 break;
//             case 68:  /* Right arrow was pressed */
//                 m.moveright("canvas");
//                 handled = true
//                 break;
//         }
//         if (m.checker("canvas"))
//             playing = false
//         console.log(m.getMoves())
//
//     }
//     if (handled)
//         evt.preventDefault(); // prevent arrow keys from scrolling the page (supported in IE9+ and all other browsers)
// }