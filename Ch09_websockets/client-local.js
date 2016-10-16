var GraphicsContext;
var Cars = [];
var MyCar = null;
var KeysPressed = 0; // Bit 0: up. Bit 1: left. Bit 2: right.

var CarImage = new Image();
CarImage.src = "car.png";

document.addEventListener("keydown",
	function(E)
	{
		if (E.which == 38 && (KeysPressed & 1) == 0) KeysPressed |= 1; // Up.
		else if (E.which == 37 && (KeysPressed & 2) == 0) KeysPressed |= 2; // Left.
		else if (E.which == 39 && (KeysPressed & 4) == 0) KeysPressed |= 4; // Right.
	}
	);
	
document.addEventListener("keyup",
	function(E)
	{
		if (E.which == 38) KeysPressed &= ~1; // Up.
		else if (E.which == 37) KeysPressed &= ~2; // Left.
		else if (E.which == 39) KeysPressed &= ~4; // Right.
	}
	);
	
window.addEventListener("load",
	function()
	{
		var BumperCanvas = document.getElementById("BumperCanvas");
		BumperCanvas.width = GP.GameWidth;
		BumperCanvas.height = GP.GameHeight;
		GraphicsContext = BumperCanvas.getContext("2d");
		
		// Set up game loop.
		setInterval(
					function()
					{
						if (MyCar)
						{
							if (KeysPressed & 2) MyCar.OR -= GP.TurnSpeed; // Turn left.
							if (KeysPressed & 4) MyCar.OR += GP.TurnSpeed; // Turn right.
							if (KeysPressed & 1) // Accelerate.
							{
								MyCar.VX += GP.Acceleration * Math.sin(MyCar.OR);
								MyCar.VY -= GP.Acceleration * Math.cos(MyCar.OR);
							}
						}

						RunGameFrame(Cars);
						DrawGame();
					},
					GP.GameFrameTime);
	}
	);
	
function DrawGame()
{
	// Clear the screen
	GraphicsContext.clearRect(0, 0, GP.GameWidth, GP.GameHeight);
	
	for (var i = 0; i < Cars.length; i++)
	{
		GraphicsContext.save();
		GraphicsContext.translate(Cars[i].X | 0, Cars[i].Y | 0);
		GraphicsContext.rotate(Cars[i].OR);
		GraphicsContext.drawImage(CarImage, -CarImage.width / 2 | 0, -CarImage.height / 2 | 0);		
		GraphicsContext.restore();
	}
}

Cars.push({ X: 200, Y: 200, VX: 0, VY: 0, OR: 0 });
Cars.push({ X: 100, Y: 100, VX: 5, VY: 0, OR: 0 });
Cars.push({ X: 300, Y: 300, VX: -1, VY: -1, OR: Math.PI });
MyCar = Cars[0];