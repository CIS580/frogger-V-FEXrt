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
