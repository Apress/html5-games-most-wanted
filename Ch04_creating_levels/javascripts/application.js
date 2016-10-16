// constants
var NUMBER_OF_COLUMNS = 10;
var NUMBER_OF_ROWS = 15;
var BRICK_SIZE = 30;

// grid  variables
var gridWidth = NUMBER_OF_COLUMNS * BRICK_SIZE;
var gridHeight = NUMBER_OF_ROWS * BRICK_SIZE;

// canvas variables
var canvas;
var context;
var canvasWidth = gridWidth + 1;
var canvasHeight = gridHeight + 1;

// application variables
var store = null;
var grid = null;
var selectedBrickClass = null;
var currentButton = null;

$(document).ready(function() {
  canvas = document.getElementById('grid');
  context = canvas.getContext('2d');

  store = new Store();
  grid = new Grid(gridWidth, gridHeight, BRICK_SIZE);

  initUI();
	
  draw();
});

function draw() {
  clearCanvas();

  context.translate(0.5, 0.5);
	
  grid.draw(context);
}

function clearCanvas() {
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
}

function initUI() {

  /* ---- Canvas Handler ----*/
  $(canvas).click(onGridClicked);

  /* ---- Brick Button Handler ----*/
  $("#bricks-container button").click(function(event) {
    event.preventDefault();

    var id = $(this).attr("id");
    setBrick(id);
  });

  /* ---- Clear & Save Button Handlers ----*/
  $("#save-track").click(function(event) {
    event.preventDefault();

    var trackID = store.saveTrack(grid.bricks);
    var trackName = $("#track-name").val();
    addTrackToList(trackID, trackName);
  });

  $("#clear-track").click(function(event) {
    event.preventDefault();

    grid.clear();
    draw();
  });

}

function onGridClicked(event) {

  var mouseX = event.offsetX || event.layerX;
  var mouseY = event.offsetY || event.layerY;

  var column = Math.floor(mouseX / BRICK_SIZE);
  var row = Math.floor(mouseY / BRICK_SIZE);

  var selectedBrick = grid.getBrickAt(column, row);

  if (selectedBrick) {
    selectedBrick.rotation += 90;

    draw();

  } else {
    createBrickAt(column, row);
  }
}

function createBrickAt(column, row) {
  if (!selectedBrickClass) return;

  var brick = new selectedBrickClass();
  brick.column = column;
  brick.row = row;

  grid.addBrick(brick, context);
}

function setBrick(buttonID) {

  if (currentButton) {
    currentButton.removeAttr("disabled");
  }

  currentButton = $("#" + buttonID);
  currentButton.attr("disabled", "disabled");

  switch (buttonID) {

    case "square-brick": 
      selectedBrickClass = Square;    
    break;

    case "triangle-brick":
      selectedBrickClass = Triangle;
    break;

    case "circle-brick":
      selectedBrickClass = Circle;
    break;

    case "curve-brick":
      selectedBrickClass = Curve;
    break;
  }
}

function addTrackToList(ID, name) {
  var entry = $("<p>");
  var link = $('<a href="">Load</a>');

  link.click(function(event) {
    event.preventDefault();
    loadTrack(ID);
  });

  entry.append(link).append(" - " + name);

  $("#tracks-container").append(entry);
}

function loadTrack(ID) {
  grid.bricks = store.getTrack(ID);

  draw();
}
