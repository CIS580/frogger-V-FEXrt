"use strict;"

/* Classes */
const Game = require('./game.js');
const Player = require('./player.js');
const MiniCar = require('./minicar.js');
const Log = require('./log.js');
const EntityManager = require('./entitymanager.js');
const Hud = require('./hud.js');
const AlphaAnimator = require('./alphaanimator.js');

/* Global variables */
var canvas = document.getElementById('screen');
var game = new Game(canvas, update, render);
var player = new Player({x: 0, y: 240})
var entityManager = new EntityManager(12, 64, player);

var blackoutAnimator = new AlphaAnimator(1500, function(ctx, alpha){
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
});

var blackInAnimator = new AlphaAnimator(2000, function(ctx, alpha){
  ctx.save();
  ctx.globalAlpha = 1 - alpha;
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
});
blackInAnimator.isActive = true;


var gameOverTextAnimator = new AlphaAnimator(2000, function(ctx, alpha){
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "yellow";
  ctx.font = "bold 40px Garamond";
  ctx.textAlign="center";
  ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
  ctx.font = "bold 24px Garamond";
  ctx.fillText("Space to play again", canvas.width / 2, canvas.height / 2 + 30 );
  ctx.restore();
});

var hud = new Hud(player, canvas.width, canvas.height);
var items = [];
var isResetingForDeath = false;
var isUpdatingScore = false;

var isGameOver = false;

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


window.onkeydown = function(event) {
  event.preventDefault();

  if(isGameOver && event.keyCode == 32){
    resetGame();
    return;
  }
  player.handleInput(event);

  return false;
}

function resetGame() {
  player.reset();
  gameOverTextAnimator.reset();
  blackoutAnimator.reset();
  blackInAnimator.reset();
  blackInAnimator.isActive = true;

  isGameOver = false;
}

/**
 * @function update
 * Updates the game state, moving
 * game objects and handling interactions
 * between them.
 * @param {DOMHighResTimeStamp} elapsedTime indicates
 * the number of milliseconds passed since the last frame.
 */
function update(elapsedTime) {

  isGameOver = (player.lives <= 0);

  if(isGameOver){
    blackoutAnimator.isActive = true;
    return;
  }

  player.update(elapsedTime);
  items.forEach(function(item){
    item.update(elapsedTime);
    item.resetIfComplete();
  });

  testPlayerCollision();

  if(isPlayerInFinalLane()){
    player.animateLevelComplete();
    if(!isUpdatingScore){
      isUpdatingScore = true;
      setTimeout(function(){
        player.score += 10;
        items.forEach(function(item){
          // smaller speed means we are going faster
          items.speed *= 0.8;
        });
        isUpdatingScore = false;
      }, 1000);
    }
  }
  hud.update(elapsedTime);
}

function resetForDeath() {
  player.resetForDeath();
  items.forEach(function(item){
    item.active = true;
  });
  isResetingForDeath = false;
}

function testPlayerCollision(){
  entityManager.collisionTest(
    function(collidingEntity){
      if(collidingEntity.type == "Log"){
        player.isOnLog = true;
        player.collidingLog = collidingEntity;
      }else{
        player.isOnLog = false;
      }

      if(collidingEntity.type == "MiniCar" && player.state == "idle"){
        collidingEntity.active = false;
        if(!isResetingForDeath){
          player.animateDeathCar();
          isResetingForDeath = true;
          setTimeout(resetForDeath, 300);
        }
      }
    },
    function(){
      player.isOnLog = false;
    });

  if(isPlayerInWaterLane()){
    if(!player.isOnLog && player.state == "idle"){
      if(!isResetingForDeath){
        player.animateDeathWater();
        isResetingForDeath = true;
        setTimeout(resetForDeath, 300);
      }
    }
  }
}

function isPlayerInFinalLane(){
  return entityManager.getCell(player) == 11;
}
function isPlayerInWaterLane(){
  return contains([6, 9, 10], entityManager.getCell(player));
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

  if(isGameOver){
    blackoutAnimator.animate(elapsedTime, ctx);
    gameOverTextAnimator.isActive = (!blackoutAnimator.isAnimating);
    gameOverTextAnimator.animate(elapsedTime, ctx);
    return;
  }

  ctx.drawImage(img, 0, 0);
  items.forEach(function(item) {
    item.render(elapsedTime, ctx);
    //ctx.beginPath();
    //ctx.rect(item.x, item.y, item.displayWidth, item.displayHeight);
    //ctx.stroke();
  });
  player.render(elapsedTime, ctx);
  hud.render(elapsedTime, ctx);

  blackInAnimator.animate(elapsedTime, ctx);

}
