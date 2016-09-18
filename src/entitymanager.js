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
