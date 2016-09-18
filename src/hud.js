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
