var Circle = function() {
  this.row = 0;
  this.column = 0;
  this.type = "Circle";
  this.rotation = 0;
}

Circle.prototype.draw = function(context) {

  var radius = BRICK_SIZE / 2;

  context.save();

    context.translate(this.column * BRICK_SIZE, this.row * BRICK_SIZE);
    context.fillColor = 0;

    context.beginPath();
    context.arc(radius, radius, radius, 0, Math.PI * 2);
    context.closePath();

    context.fill();

  context.restore();
}