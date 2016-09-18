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
