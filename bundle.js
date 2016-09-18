(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"./entitymanager.js":2,"./game.js":3,"./log.js":4,"./minicar.js":5,"./player.js":6}],2:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
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
  if(!this.active) return;
  ctx.drawImage(
    // image
    this.sprite,
    // source rectangle
    this.carImage * this.width - 20, 0, this.width, this.height,
    // destination rectangle
    this.x, this.y, this.displayWidth, this.displayHeight
  );
}

},{}],6:[function(require,module,exports){
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
  this.spritesheet  = new Image();
  this.spritesheet.src = encodeURI('assets/PlayerSprite2.png');
  this.timer = 0;
  this.frame = 0;
  this.isOnLog = false;

  var self = this;

  window.onkeydown = function(event) {
    event.preventDefault();

    if(self.state == "jump"){
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
        this.spritesheet,
        // source rectangle
        this.frame * 64, SpriteSheet.Jump * 64, this.width, this.height,
        // destination rectangle
        this.x, this.y, this.width, this.height
      );
      break;
    case "idle":
      ctx.drawImage(
        // image
        this.spritesheet,
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
