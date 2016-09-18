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
