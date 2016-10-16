var GraphicsContext;
var Cars = [];
var MyCar = null;
var KeysPressed = 0; // Bit 0: up. Bit 1: left. Bit 2: right.
var Socket = null;
var GameTimer = null;

var CarImage = new Image();
CarImage.src = "car.png";

document.addEventListener("keydown",
	function(E)
	{
		var Transmit = false;
		if (E.which == 38 && (KeysPressed & 1) == 0) { Transmit = true; KeysPressed |= 1; } // Up.
		else if (E.which == 37 && (KeysPressed & 2) == 0) { Transmit = true; KeysPressed |= 2; } // Left.
		else if (E.which == 39 && (KeysPressed & 4) == 0) { Transmit = true; KeysPressed |= 4; } // Right.
		
		// Only send to the server if the key is one of the three we care about, and only if this key
		// press wasn't already reflected in the KeyPressed bitfield.
		if (Transmit && Socket && Socket.readyState == 1)
			Socket.send(JSON.stringify({ Type: "D", Data: E.which }));
	}
	);
	
document.addEventListener("keyup",
	function(E)
	{
		var Transmit = false;
		if (E.which == 38) { Transmit = true; KeysPressed &= ~1; } // Up.
		else if (E.which == 37) { Transmit = true; KeysPressed &= ~2; } // Left.
		else if (E.which == 39) { Transmit = true; KeysPressed &= ~4; } // Right.
		
		// For "keyup", we just have to check that it's one of the keys we care about.
		if (Transmit && Socket && Socket.readyState == 1)
			Socket.send(JSON.stringify({ Type: "U", Data: E.which }));
	}
	);
	
window.addEventListener("load",
	function()
	{
		var BumperCanvas = document.getElementById("BumperCanvas");
		BumperCanvas.width = GP.GameWidth;
		BumperCanvas.height = GP.GameHeight;
		GraphicsContext = BumperCanvas.getContext("2d");
		
		var Name = prompt("What is your username?", "Anonymous");
		GraphicsContext.textAlign = "center";
		GraphicsContext.fillText("Connecting...", GP.GameWidth / 2, GP.GameHeight / 2);

		try
		{
			if (typeof MozWebSocket !== "undefined")
				Socket = new MozWebSocket("ws://SERVERIP:9001");
			else if (typeof WebSocket !== "undefined")
				Socket = new WebSocket("ws://SERVERIP:9001");
			else
			{
				Socket = null;
				alert("Your browser does not support websockets. We recommend that you use an up-to-date version of Google Chrome or Mozilla Firefox.");
				return false;
			}
		}
		catch (E) { Socket = null; return false; }

		Socket.onerror = function(E) { alert("WebSocket error: " + JSON.stringify(E)); };

		Socket.onclose = function (E)
			{
				// Shut down the game loop.
				if (GameTimer) clearInterval(GameTimer);
				GameTimer = null;
			};

		Socket.onopen = function()
			{
				// Send a handshake message.
				Socket.send(JSON.stringify({ Type: "HI", Data: Name.substring(0, 10) }));
				
				// Set up game loop.
				GameTimer = setInterval(
					function()
					{
						// Supposing MyCar is not null, which it shouldn't be if we're
						// participating in the game and communicating with the server.
						if (MyCar)
						{
							// Turn and accelerate the car locally, while we wait for the server
							// to respond to the key presses we transmit to it.
							if (KeysPressed & 2) MyCar.OR -= GP.TurnSpeed;
							if (KeysPressed & 4) MyCar.OR += GP.TurnSpeed;
							if (KeysPressed & 1)
							{
								MyCar.VX += GP.Acceleration * Math.sin(MyCar.OR);
								MyCar.VY -= GP.Acceleration * Math.cos(MyCar.OR);
							}
						}

						RunGameFrame(Cars);
						DrawGame();
					},
					GP.GameFrameTime);
			};

		Socket.onmessage = function(E)
			{
				var Message;

				// Check that the message is in the format we expect.
				try { Message = JSON.parse(E.data); }
				catch (Err) { return; }
				if (!("MyIndex" in Message && "Cars" in Message)) return;
				
				// Overwrite our old Cars array with the new data sent from the server.
				Cars = Message.Cars;
				if (Message.MyIndex in Cars) MyCar = Cars[Message.MyIndex];
			};
	}
	);
	
function DrawGame()
{
	// Clear the screen
	GraphicsContext.clearRect(0, 0, GP.GameWidth, GP.GameHeight);
	
	GraphicsContext.save();
	GraphicsContext.font = "12pt Arial";
	GraphicsContext.fillStyle = "black";
	GraphicsContext.textAlign = "center";
	for (var i = 0; i < Cars.length; i++)
	{
		GraphicsContext.save();
		GraphicsContext.translate(Cars[i].X | 0, Cars[i].Y | 0);
		GraphicsContext.rotate(Cars[i].OR);
		GraphicsContext.drawImage(CarImage, -CarImage.width / 2 | 0, -CarImage.height / 2 | 0);		
		GraphicsContext.restore();
		
		if (Cars[i].Name) GraphicsContext.fillText((Cars[i] == MyCar ? "Me" : Cars[i].Name.substring(0, 10)), Cars[i].X | 0, (Cars[i].Y - GP.CarRadius - 12) | 0);
	}
	GraphicsContext.restore();
}