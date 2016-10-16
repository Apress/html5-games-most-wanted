var Curve = function() {
  this.row = 0;
  this.column = 0;
  this.type = "Curve";
  this.rotation = 0;
}

Curve.prototype.draw = function(context) {

  context.save();

    context.translate(this.column * BRICK_SIZE, this.row * BRICK_SIZE);

    context.translate(BRICK_SIZE / 2, BRICK_SIZE / 2);
    context.rotate(this.rotation * Math.PI / 180);
    context.translate(- BRICK_SIZE / 2, - BRICK_SIZE / 2);

    context.beginPath();

    context.fillColor = 0;
    context.moveTo(0, 0);
    context.bezierCurveTo(BRICK_SIZE / 2, 0,  BRICK_SIZE, BRICK_SIZE / 2, BRICK_SIZE, BRICK_SIZE);
    context.lineTo(0, BRICK_SIZE);

    context.closePath();

    context.fill();

  context.restore();
}