var System = require("sys");
var HTTP = require("http");
var WebSocketServer = require("/path/to/websocket").server;
var Game = require("/path/to/game");

var Frame = 0;
var FramesPerGameStateTransmission = 3;
var MaxConnections = 10;
var Connections = {};

// Creates an HTTP server that will respond with a simple blank page when accessed.
var HTTPServer = HTTP.createServer(
			function(Request, Response)
			{
				Response.writeHead(200, { "Content-Type": "text/plain" });
				Response.end();
			}
			);

// Starts the HTTP server on port 9001.
HTTPServer.listen(9001, function() { System.log("Listening for connections on port 9001"); });

// Creates a WebSocketServer using the HTTP server just created.
var Server = new WebSocketServer(
			{
				httpServer: HTTPServer,
				closeTimeout: 2000
			}
			);
			
// When a client connects...
Server.on("request",
			function(Request)
			{
				if (ObjectSize(Connections) >= MaxConnections)
				{
					Request.reject();
					return;
				}
				
				var Connection = Request.accept(null, Request.origin);
				Connection.IP = Request.remoteAddress;
				
				// Assign a random ID that hasn't already been taken.
				do { Connection.ID = Math.floor(Math.random() * 100000) } while (Connection.ID in Connections);
				Connections[Connection.ID] = Connection;
				
				Connection.on("message",
					function(Message)
					{
						// All of our messages will be transmitted as unicode text.
						if (Message.type == "utf8")
							HandleClientMessage(Connection.ID, Message.utf8Data);
					}
					);
					
				Connection.on("close",
					function()
					{
						HandleClientClosure(Connection.ID);
					}
					);
				
				System.log("Logged in " + Connection.IP + "; currently " + ObjectSize(Connections) + " users.");
			}
			);

function HandleClientClosure(ID)
{
	if (ID in Connections)
	{
		System.log("Disconnect from " + Connections[ID].IP);
		delete Connections[ID];
	}
}

function HandleClientMessage(ID, Message)
{
	// Check that we know this client ID and that the message is in a format we expect.
	if (!(ID in Connections)) return;
	
	try { Message = JSON.parse(Message); }
	catch (Err) { return; }
	if (!("Type" in Message && "Data" in Message)) return;
	
	// Handle the different types of messages we expect.
	var C = Connections[ID];
	switch (Message.Type)
	{
		// Handshake.
		case "HI":
			// If this player already has a car, abort.
			if (C.Car) break;
			
			// Create the player's car with random initial position.
			C.Car = 
				{
					X: Game.GP.CarRadius + Math.random() * (Game.GP.GameWidth - 2 * Game.GP.CarRadius),
					Y: Game.GP.CarRadius + Math.random() * (Game.GP.GameHeight - 2 * Game.GP.CarRadius),
					VX: 0,
					VY: 0,
					OR: 0,
					// Put a reasonable length restriction on usernames, which will be displayed to all players.
					Name: Message.Data.toString().substring(0, 10)
				};

			// Initialize the input bitfield.
			C.KeysPressed = 0;
			System.log(C.Car.Name + " spawned a car!");
			
			SendGameState();
			break;
			
		// Key up.
		case "U":
			if (typeof C.KeysPressed === "undefined") break;
			
			if (Message.Data == 37) C.KeysPressed &= ~2; // Left
			else if (Message.Data == 39) C.KeysPressed &= ~4; // Right
			else if (Message.Data == 38) C.KeysPressed &= ~1; // Up
			break;
			
		// Key down.
		case "D":
			if (typeof C.KeysPressed === "undefined") break;
			
			if (Message.Data == 37) C.KeysPressed |= 2; // Left
			else if (Message.Data == 39) C.KeysPressed |= 4; // Right
			else if (Message.Data == 38) C.KeysPressed |= 1; // Up
			break;
	}
}

function SendGameState()
{
	var CarData = [];
	var Indices = {};
	
	// Collect all the car objects to be sent out to the clients
	for (var ID in Connections)
	{
		// Some users may not have Car objects yet (if they haven't done the handshake)
		var C = Connections[ID];
		if (!C.Car) continue;
		
		CarData.push(C.Car);
		
		// Each user will be sent the same list of car objects, but needs to be able to pick
		// out his car from the pack. Here we take note of the index that belongs to him.
		Indices[ID] = CarData.length - 1;
	}
	
	// Go through all of the connections and send them personalized messages. Each user gets
	// the list of all the cars, but also the index of his car in that list.
	for (var ID in Connections)
		Connections[ID].sendUTF(JSON.stringify({ MyIndex: Indices[ID], Cars: CarData }));
}

// Set up game loop.
setInterval(function()
			{
				// Make a copy of the car data suitable for RunGameFrame.
				var Cars = [];
				for (var ID in Connections)
				{
					var C = Connections[ID];
					if (!C.Car) continue;
					
					Cars.push(C.Car);
				
					if (C.KeysPressed & 2) C.Car.OR -= Game.GP.TurnSpeed;
					if (C.KeysPressed & 4) C.Car.OR += Game.GP.TurnSpeed;
					if (C.KeysPressed & 1)
					{
						C.Car.VX += Game.GP.Acceleration * Math.sin(C.Car.OR);
						C.Car.VY -= Game.GP.Acceleration * Math.cos(C.Car.OR);
					}
				}
				
				Game.RunGameFrame(Cars);

				// Increment the game frame, which is only used to time the SendGameState calls.
				Frame = (Frame + 1) % FramesPerGameStateTransmission;
				if (Frame == 0) SendGameState();
			},
			Game.GP.GameFrameTime
			);
			
function ObjectSize(Obj)
{
	var Size = 0;
	for (var Key in Obj)
		if (Obj.hasOwnProperty(Key))
			Size++;
			
	return Size;
}