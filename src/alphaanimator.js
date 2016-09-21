"use strict";

/**
 * @module exports the AlphaAnimator class
 */
module.exports = exports = AlphaAnimator;

/**
 * @constructor AlphaAnimator
 * Creates a new AlphaAnimator object
 */
function AlphaAnimator(length, renderFunction) {
  this.animationTimer = 0;
  this.animationLength = length;
  this.alpha = 0;
  this.isAnimating = true;
  this.render = renderFunction;
  this.isActive = false;
}

/**
 * @function animates the AlphaAnimator object
 * {DOMHighResTimeStamp} time the elapsed time since the last frame
 */
AlphaAnimator.prototype.animate = function(time, ctx){
  if(!this.isActive) return;
  if(this.isAnimating){
    this.animationTimer += time;
    this.alpha = this.animationTimer / this.animationLength;
    if(this.alpha > 1){
      this.alpha = 1;
      this.isAnimating = false;
    }
  }
  this.render(ctx, this.alpha);
}

AlphaAnimator.prototype.reset = function(){
  this.animationTimer = 0;
  this.alpha = 0;
  this.isAnimating = true;
  this.isActive = false;
}
