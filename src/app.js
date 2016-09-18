"use strict;"

/* Classes */
const Game = require('./game.js');
const Player = require('./player.js');
const MiniCar = require('./minicar.js');
const Log = require('./log.js');
const EntityManager = require('./entitymanager.js')

/* Global variables */
var canvas = document.getElementById('screen');
var game = new Game(canvas, update, render);
var player = new Player({x: 0, y: 240})
var entityManager = new EntityManager(12, 64, player);
var items = [];

items.push(
  /* Lane 0  */
  /* Lane 1  */ new MiniCar(1 * 64, true, 300),
  /* Lane 2  */
  /* Lane 3  */ new MiniCar(3 * 64, false, 300),
  /* Lane 4  */ new MiniCar(4 * 64, true, 300),
  /* Lane 5  */
  /* Lane 6  */ new Log(6 * 64, false, 300),
  /* Lane 7  */
  /* Lane 8  */ new MiniCar(8 * 64, false, 300),
  /* Lane 9  */ new Log(9 * 64, true, 300),
  /* Lane 10 */ new Log(10 * 64, false, 300)
  /* Lane 11 */
          )

items.forEach(function(item){
  entityManager.addEntity(item);
});

addItem(items.length - 1);

var img  = new Image();
img.src = encodeURI('assets/background.png');

function addItem(idx){
  items[idx].active = true;

  if(idx - 1 >= 0){
    setTimeout(function(){ addItem(idx-1); }, Math.floor((Math.random() * 1500)) + 500);
  }
}
/**
 * @function masterLoop
 * Advances the game in sync with the refresh rate of the screen
 * @param {DOMHighResTimeStamp} timestamp the current time
 */
var masterLoop = function(timestamp) {
  game.loop(timestamp);
  window.requestAnimationFrame(masterLoop);
}
masterLoop(performance.now());


/**
 * @function update
 * Updates the game state, moving
 * game objects and handling interactions
 * between them.
 * @param {DOMHighResTimeStamp} elapsedTime indicates
 * the number of milliseconds passed since the last frame.
 */
function update(elapsedTime) {
  player.update(elapsedTime);
  items.forEach(function(item){
    item.update(elapsedTime);
    item.resetIfComplete();
  });

  entityManager.collisionTest(
    function(collidingEntity){
      if(collidingEntity.type == "Log"){
        player.isOnLog = true;
        player.collidingLog = collidingEntity;
      }else{
        player.isOnLog = false;
      }

      if(collidingEntity.type == "MiniCar"){
        console.log('die');
      }
    },
    function(){
      player.isOnLog = false;
    }
);

  if(contains([6, 9, 10], entityManager.getCell(player))){
    if(!player.isOnLog){
      console.log('die');
    }
  }

}

function contains(arr, obj){
  return (arr.indexOf(obj) != -1);
}

/**
  * @function render
  * Renders the current game state into a back buffer.
  * @param {DOMHighResTimeStamp} elapsedTime indicates
  * the number of milliseconds passed since the last frame.
  * @param {CanvasRenderingContext2D} ctx the context to render to
  */
function render(elapsedTime, ctx) {
  ctx.fillStyle = "lightblue";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  /*items.forEach(function(item) {
    item.render(elapsedTime, ctx);
    ctx.beginPath();
    ctx.rect(item.x, item.y, item.displayWidth, item.displayHeight);
    ctx.stroke();
  });*/
  player.render(elapsedTime, ctx);
}
