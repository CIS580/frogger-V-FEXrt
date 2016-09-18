(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict;"

/* Classes */
const Game = require('./game.js');
const Player = require('./player.js');
const MiniCar = require('./minicar.js');
const Log = require('./log.js');
const EntityManager = require('./entitymanager.js');
const Hud = require('./hud.js');

/* Global variables */
var canvas = document.getElementById('screen');
var game = new Game(canvas, update, render);
var player = new Player({x: 0, y: 240})
var entityManager = new EntityManager(12, 64, player);
var hud = new Hud(player, canvas.width, canvas.height);
var items = [];
var isResetingForDeath = false;
var isUpdatingScore = false;

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
  ctx.fillStyle = "lightblue";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  items.forEach(function(item) {
    item.render(elapsedTime, ctx);
    //ctx.beginPath();
    //ctx.rect(item.x, item.y, item.displayWidth, item.displayHeight);
    //ctx.stroke();
  });
  player.render(elapsedTime, ctx);
  hud.render(elapsedTime, ctx);
}

},{"./entitymanager.js":2,"./game.js":3,"./hud.js":4,"./log.js":5,"./minicar.js":6,"./player.js":7}],2:[function(require,module,exports){
"use strict";

/**
 * @module exports the Car class
 */
module.exports = exports = EntityManager;

/**
 * @constructor car
 * Creates a new EntityManager object
 */
function EntityManager(cellCount, cellSize, collidingEntity) {
  this.collidingEntity = collidingEntity;
  this.cellSize = cellSize;
  this.cells = [];
  for(var i = 0; i < cellCount; i++){
    this.cells.push([]);
  }
}

EntityManager.prototype.addEntity = function (entity) {
  var cell = this.getCell(entity);
  this.cells[cell].push(entity);
}

EntityManager.prototype.getCell = function(entity){
  return Math.floor(entity.x / this.cellSize);
}

EntityManager.prototype.collisionTest = function(callbackCollide, callbackNoCollide){
  var self = this;
  var didCollide = false;
  this.cells.forEach(function(cell){
    cell.forEach(function(entity){
        if(collision(self.collidingEntity, entity)) {
          callbackCollide(entity);
          didCollide = true;
        }
    });
  });
  if(!didCollide){callbackNoCollide();}
}

function collision(entity1, entity2){
  return !(
    (entity1.y + entity1.displayHeight < entity2.y) ||
    (entity1.y > entity2.y + entity2.displayHeight) ||
    (entity1.x > entity2.x + entity2.displayWidth) ||
    (entity1.x + entity1.displayWidth < entity2.x))
}

},{}],3:[function(require,module,exports){
"use strict";

/**
 * @module exports the Game class
 */
module.exports = exports = Game;

/**
 * @constructor Game
 * Creates a new game object
 * @param {canvasDOMElement} screen canvas object to draw into
 * @param {function} updateFunction function to update the game
 * @param {function} renderFunction function to render the game
 */
function Game(screen, updateFunction, renderFunction) {
  this.update = updateFunction;
  this.render = renderFunction;

  // Set up buffers
  this.frontBuffer = screen;
  this.frontCtx = screen.getContext('2d');
  this.backBuffer = document.createElement('canvas');
  this.backBuffer.width = screen.width;
  this.backBuffer.height = screen.height;
  this.backCtx = this.backBuffer.getContext('2d');

  // Start the game loop
  this.oldTime = performance.now();
  this.paused = false;
}

/**
 * @function pause
 * Pause or unpause the game
 * @param {bool} pause true to pause, false to start
 */
Game.prototype.pause = function(flag) {
  this.paused = (flag == true);
}

/**
 * @function loop
 * The main game loop.
 * @param{time} the current time as a DOMHighResTimeStamp
 */
Game.prototype.loop = function(newTime) {
  var game = this;
  var elapsedTime = newTime - this.oldTime;
  this.oldTime = newTime;

  if(!this.paused) this.update(elapsedTime);
  this.render(elapsedTime, this.frontCtx);

  // Flip the back buffer
  this.frontCtx.drawImage(this.backBuffer, 0, 0);
}

},{}],4:[function(require,module,exports){
"use strict";

/**
 * @module exports the Hud class
 */
module.exports = exports = Hud;

var Sprite = {
  Dead: 0,
  Alive: 2
}

/**
 * @constructor Hud
 * Creates a new Hud object
 */
function Hud(player, canvasWidth, canvasHeight) {
  var widthMultiTop = 0.2;
  var widthMultiBottom = 0.4;
  this.player = player;

  // Top Hud
  this.top = {};
  this.top.width = canvasWidth * widthMultiTop;
  this.top.height = canvasHeight % 64;
  this.top.x = canvasWidth * ((1 - widthMultiTop)/2);
  this.top.y = 0;

  // Bottom Hud
  this.bottom = {};
  this.bottom.width = canvasWidth * widthMultiBottom;
  this.bottom.height = canvasHeight % 64;
  this.bottom.x = canvasWidth * ((1 - widthMultiBottom)/2);
  this.bottom.y = canvasHeight - this.bottom.height;

  this.spritesheets = [];

  for(var i = 0; i < 4; i++){
    this.spritesheets.push(new Image());
    this.spritesheets[i].src = encodeURI('assets/PlayerSprite' + i + '.png');
  }
}

/**
 * @function updates the Hud object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Hud.prototype.update = function(time) {
}

/**
 * @function renders the Hud into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Hud.prototype.render = function(time, ctx) {
  var cornerRadius = 50;
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = "black";

  // Draw Top Hud
  ctx.beginPath();
  ctx.moveTo(this.top.x + cornerRadius, this.top.y + this.top.height);
  ctx.lineTo(this.top.x + this.top.width - cornerRadius, this.top.y + this.top.height);
  ctx.arc(this.top.x + this.top.width - cornerRadius, this.top.y, this.top.height, 0.5*Math.PI, 0, true);
  ctx.lineTo(this.top.x, this.top.y);
  ctx.arc(this.top.x + cornerRadius, this.top.y, this.top.height, Math.PI, 0.5 * Math.PI, true);
  ctx.fill();

  // Draw Bottom Hud
  ctx.beginPath();
  ctx.moveTo(this.bottom.x + cornerRadius, this.bottom.y);
  ctx.lineTo(this.bottom.x + this.bottom.width - cornerRadius, this.bottom.y);
  ctx.arc(this.bottom.x + this.bottom.width - cornerRadius, this.bottom.y + this.bottom.height, this.bottom.height, 1.5*Math.PI, 0);
  ctx.lineTo(this.bottom.x, this.bottom.y + this.bottom.height);
  ctx.arc(this.bottom.x + cornerRadius, this.bottom.y + this.bottom.height, this.bottom.height, Math.PI, 1.5 * Math.PI);
  ctx.fill();

  ctx.restore();

  // DrawFrogs
  var centerX = this.bottom.x + (this.bottom.width / 2);
  var bottomCenterY = this.bottom.y + (this.bottom.height / 2);
  var topCenterY = this.top.y + (this.top.height / 2);

  for(var i = 0; i < 3; i++) {
    var index = (i < this.player.lives) ? Sprite.Alive : Sprite.Dead;
    ctx.drawImage(
      // image
      this.spritesheets[index],
      // source rectangle
      3 * 64, 1 * 64, 64, 64,
      // destination rectangle
      centerX - 64 + (i * 64) - (45 / 2), bottomCenterY - ((45 + 14)/2), 45, 45
    );
  }

  ctx.fillStyle = "yellow";
  ctx.font = "bold 24px Arial";
  ctx.textAlign="center";
  ctx.fillText(this.player.score, centerX, topCenterY + 5);
}

},{}],5:[function(require,module,exports){
"use strict";

/**
 * @module exports the Car class
 */
module.exports = exports = Log;

/**
 * @constructor car
 * Creates a new car object
 */
function Log(x, isGoingUp, speed) {
  this.type = "Log";

  this.sprite  = new Image();
  this.sprite.src = encodeURI('assets/log.png');

  this.width  = 201;
  this.height = 296;

  this.displayWidth  = this.width / 3.35;
  this.displayHeight = this.height / 3.35;

  this.isGoingUp = isGoingUp;
  this.speed = speed;

  this.x =  x + 2; // pick road point

  this.active = false;
  this.isReseting = false;

  if(isGoingUp){
    this.y = 480 + this.displayHeight;
  }else{
    this.y = -this.displayHeight;
  }

  this.moveDistance = 480 + this.displayHeight *  2;

  var self = this;
  this.move = function(time){
    if(self.moveDistance == 0){
      return;
    }

    var change = time/self.speed * 64
    self.moveDistance -= change;

    if(self.moveDistance <= 0){
      change = self.moveDistance + change;
      self.moveDistance = 0;
    }

    if(self.isGoingUp){
      self.y -= change;
    }else{
      self.y += change;
    }
  }
}

/**
 * @function updates the car object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Log.prototype.update = function(time) {
      if(!this.active) return;
      this.move(time);
}

Log.prototype.resetIfComplete = function(){
       if(!this.moveDistance == 0){return;}
       if(this.isReseting){return;}
       this.isReseting = true;
       var self = this;
       setTimeout(function(){ self.reset(); }, Math.floor((Math.random() * 1500)) + 500);
}

Log.prototype.reset = function(){
  if(this.isGoingUp){
    this.y = 480 + this.displayHeight;
  }else{
    this.y = -this.displayHeight;
  }
  this.moveDistance = 480 + this.displayHeight *  2;
  this.isReseting = false;
}

/**
 * @function renders the car into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Log.prototype.render = function(time, ctx) {
  if(!this.active) return;
  ctx.drawImage(
    // image
    this.sprite,
    // destination
    this.x, this.y, this.displayWidth, this.displayHeight
  );
}

},{}],6:[function(require,module,exports){
"use strict";

/**
 * @module exports the Car class
 */
module.exports = exports = MiniCar;

/**
 * @constructor car
 * Creates a new car object
 */
function MiniCar(x, isGoingUp, speed) {
  this.type = "MiniCar";

  this.spriteUp  = new Image();
  this.spriteUp.src = encodeURI('assets/cars_mini.svg');
  this.spriteDown  = new Image();
  this.spriteDown.src = encodeURI('assets/cars_mini_reversed.svg');

  this.width  = 245;
  this.height = 350;

  this.displayWidth  = this.width / 4.5;
  this.displayHeight = this.height / 4.5;

  this.isGoingUp = isGoingUp;
  this.speed = speed;

  this.x =  x + 5; // pick road point

  this.active = false;
  this.isReseting = false;

  if(isGoingUp){
    this.y = 480 + this.displayHeight;
    this.sprite = this.spriteUp;
  }else{
    this.y = -this.displayHeight;
    this.sprite = this.spriteDown;
  }

  this.moveDistance = 480 + this.displayHeight *  2;

  this.carImage = Math.floor((Math.random() * 5));

  var self = this;
  this.move = function(time){
    if(self.moveDistance == 0){
      return;
    }

    var change = time/self.speed * 64
    self.moveDistance -= change;

    if(self.moveDistance <= 0){
      change = self.moveDistance + change;
      self.moveDistance = 0;
    }

    if(self.isGoingUp){
      self.y -= change;
    }else{
      self.y += change;
    }

  }
}

/**
 * @function updates the car object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
MiniCar.prototype.update = function(time) {
      if(!this.active) return;
      this.move(time);
}

MiniCar.prototype.resetIfComplete = function(){
       if(!this.moveDistance == 0){return;}
       if(this.isReseting){return;}
       this.isReseting = true;
       var self = this;
       setTimeout(function(){ self.reset(); }, Math.floor((Math.random() * 1500)) + 500);

}

MiniCar.prototype.reset = function(){
  if(this.isGoingUp){
    this.y = 480 + this.displayHeight;
  }else{
    this.y = -this.displayHeight;
  }
  this.carImage = Math.floor((Math.random() * 5));
  this.moveDistance = 480 + this.displayHeight *  2;
  this.isReseting = false;
}

/**
 * @function renders the car into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
MiniCar.prototype.render = function(time, ctx) {
  ctx.drawImage(
    // image
    this.sprite,
    // source rectangle
    this.carImage * this.width - 20, 0, this.width, this.height,
    // destination rectangle
    this.x, this.y, this.displayWidth, this.displayHeight
  );
}

},{}],7:[function(require,module,exports){
"use strict";

const MS_PER_FRAME = 1000/8;

/**
 * @module exports the Player class
 */
module.exports = exports = Player;

var Direction = {
  Up: 0,
  Down: 1,
  Left: 2,
  Right: 3
}

var SpriteSheet = {
  Jump: 0,
  Idle: 1
}

/**
 * @constructor Player
 * Creates a new player object
 * @param {Postition} position object specifying an x and y
 */
function Player(position) {
  this.type = "Player";

  this.state = "idle";
  this.x = position.x;
  this.y = position.y;
  this.width  = 64;
  this.height = 64;
  this.displayWidth = this.width;
  this.displayHeight = this.height;

  this.lives = 3;
  this.score = 0;

  this.spritesheets = [];

  for(var i = 0; i < 4; i++){
    this.spritesheets.push(new Image());
    this.spritesheets[i].src = encodeURI('assets/PlayerSprite' + i + '.png');
  }
  this.spriteIndex  = 2;
  this.disableInput = false;

  this.timer = 0;
  this.frame = 0;
  this.isOnLog = false;
  this.isAnimatingLevelComplete = false;

  var self = this;

  window.onkeydown = function(event) {
    event.preventDefault();

    if(self.state == "jump"){
      return;
    }
    if(self.disableInput){
      return;
    }

    switch(event.keyCode) {
      case 38:
      case 87:
        self.direction = Direction.Up;
        break;

      case 37:
      case 65:
        self.direction = Direction.Left;
        break;

      case 39:
      case 68:
        self.direction = Direction.Right;
        break;

      case 40:
      case 83:
        self.direction = Direction.Down;
        break;
    }

    self.frame = 0;
    self.state = "jump";
  }

  this.animate = function(time){
    self.timer += time;
    if(self.timer > MS_PER_FRAME) {
      self.timer = 0;
      self.frame += 1;
      if(self.frame > 3) self.frame = 0;
    }
  }

  self.moveDistance = 64;

  this.move = function(time){

    if(self.moveDistance == 0){
      self.state = "idle";
      self.moveDistance = 64;
      return;
    }

    var change = time/400 * 64
    self.moveDistance -= change;

    if(self.moveDistance <= 0){
      change = self.moveDistance + change;
      self.moveDistance = 0;
    }

    switch(self.direction){
      case Direction.Up:
        self.y -= change;
        break;
      case Direction.Down:
        self.y += change;
        break;
      case Direction.Left:
        self.x -= change;
        break;
      case Direction.Right:
        self.x += change;
        break;
    }
  }

  this.moveifOnLog = function(){
    if(self.isOnLog){
      if(self.offset == 999){ /* 999 is a number larger than any possible offset */
        self.offset = self.y - self.collidingLog.y;
      }
      self.y = self.collidingLog.y + self.offset;
    }else{
      self.offset = 999;
    }
  }
  this.animateDeathCar = function(){
    self.spriteIndex = 0;
    self.disableInput = true;
  }
  this.animateDeathWater = function () {
    self.spriteIndex = 1;
    self.disableInput = true;
  }
  this.resetForDeath = function(){
    self.x = 0;
    self.spriteIndex = 2;
    self.lives--;
    self.disableInput = false;
  }

  this.animateLevelComplete = function(){
    if(self.isAnimatingLevelComplete) return;

    self.isAnimatingLevelComplete = true;
    self.disableInput = true;

    setTimeout(function(){
     self.direction = Direction.Right;
     self.state = "jump";
    }, 100);

    setTimeout(function(){ self.x = -self.width;}, 600);

    setTimeout(function(){
     self.direction = Direction.Right;
     self.state = "jump";
   }, 900);

    setTimeout(function(){
      self.disableInput = false;
      self.isAnimatingLevelComplete = false;
    }, 1400);
  }

}

/**
 * @function updates the player object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
Player.prototype.update = function(time) {
  switch(this.state) {
    case "idle":
      this.animate(time);
      this.moveifOnLog();
      break;
    case "jump":
      this.animate(time);
      this.move(time);
      break;
  }
}

/**
 * @function renders the player into the provided context
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 * {CanvasRenderingContext2D} ctx the context to render into
 */
Player.prototype.render = function(time, ctx) {
  switch(this.state) {
    case "jump":
      ctx.drawImage(
        // image
        this.spritesheets[this.spriteIndex],
        // source rectangle
        this.frame * 64, SpriteSheet.Jump * 64, this.width, this.height,
        // destination rectangle
        this.x, this.y, this.width, this.height
      );
      break;
    case "idle":
      ctx.drawImage(
        // image
        this.spritesheets[this.spriteIndex],
        // source rectangle
        this.frame * 64, SpriteSheet.Idle * 64, this.width, this.height,
        // destination rectangle
        this.x, this.y, this.width, this.height
      );
      break;
    // TODO: Implement your player's redering according to state
  }
}

},{}]},{},[1]);
