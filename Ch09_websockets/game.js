var GP =
	{
		GameWidth: 700,				// In pixels.
		GameHeight: 400,			// In pixels.
		GameFrameTime: 20,			// In milliseconds.
		CarRadius: 25, 				// In pixels.
		FrictionMultiplier: 0.97,	// Unitless, multiplies velocity on every game frame.
		MaxSpeed: 6,				// In pixels per game frame.
		TurnSpeed: 0.1,				// In radians per game frame.
		Acceleration: 0.3			// In (pixels per game frame) per game frame.
	};
	
function RunGameFrame(Cars)
{	
	// Move the cars and collect impulses due to collisions.
	var Impulses = []; // Each will be an array in the format [ Index of first car, Index of second car, X impulse, Y impulse ].
	for (var i = 0; i < Cars.length; i++)
	{
		// Move the cars. X and Y are the coordinates of the center of the car.
		Cars[i].X += Cars[i].VX;
		Cars[i].Y += Cars[i].VY;
		
		// Check for proximity to the left and right walls.
		if (Cars[i].X <= GP.CarRadius || Cars[i].X >= GP.GameWidth - GP.CarRadius)
		{
			// If we are going towards the wall, then give an impulse. Note that, in the
			// game frame following a collision with the wall, the car may still be in close
			// proximity to the wall but will have velocity pointing away from it. We should not
			// treat that as a new collision. That is the reason for this code.
			if (Cars[i].X <= GP.CarRadius && Cars[i].VX <= 0 || Cars[i].X >= GP.GameWidth - GP.CarRadius && Cars[i].VX >= 0)
				Impulses.push([i, null, 2 * Cars[i].VX, 0]); // This impulse turns the car around.
			
			// Make the walls truly rigid. If the car has pushed into the wall, push it back out.
			if (Cars[i].X <= GP.CarRadius) Cars[i].X = GP.CarRadius;
			if (Cars[i].X >= GP.GameWidth - GP.CarRadius) Cars[i].X = GP.GameWidth - GP.CarRadius;
		}
			
		// Same as above, but now for the top and bottom walls.
		if (Cars[i].Y <= GP.CarRadius || Cars[i].Y >= GP.GameHeight - GP.CarRadius)
		{
			if (Cars[i].Y <= GP.CarRadius && Cars[i].VY <= 0 || Cars[i].Y >= GP.GameHeight - GP.CarRadius && Cars[i].VY >= 0)
				Impulses.push([i, null, 0, 2 * Cars[i].VY]);
				
			if (Cars[i].Y <= GP.CarRadius) Cars[i].Y = GP.CarRadius;
			if (Cars[i].Y >= GP.GameHeight - GP.CarRadius) Cars[i].Y = GP.GameHeight - GP.CarRadius;
		}
		
		// Now that collisions with walls have been counted, check for collisions between cars.
		// Two cars have collided if their centers are within 2 * GP.CarRadius, i.e. if they overlap at all.
		// Note the bounds of this for loop. We don't need to check all the cars.
		for (var j = i + 1; j < Cars.length; j++)
		{
			// Euclidean distance between the centers of the two cars.
			if (Math.sqrt((Cars[i].X - Cars[j].X) * (Cars[i].X - Cars[j].X) + (Cars[i].Y - Cars[j].Y) * (Cars[i].Y - Cars[j].Y)) <= 2 * GP.CarRadius)
			{
				// The impulses from a two dimensional elastic collision.
				// Delta = (r_j - r_i) . (v_i - v_j) / |r_j - r_i|^2.
				// Impulse 1 = -Delta * [ DX, DY ].
				// Impulse 2 = Delta * [ DX, DY ].
				var DX = Cars[j].X - Cars[i].X;
				var DY = Cars[j].Y - Cars[i].Y;
				var Delta = (DX * (Cars[i].VX - Cars[j].VX) + DY * (Cars[i].VY - Cars[j].VY))/(DX * DX + DY * DY)
				
				// If they're already proceeding away from the collision, (r_j - r_i) . (v_i - v_j) <= 0,
				// then we dealt with the collision on a previous game frame. This is similar to the consideration
				// we made for collisions at the wall.
				if (Delta <= 0) continue;
				
				Impulses.push([i, j, Delta * DX, Delta * DY]);
			}
		}
	}
		
	// Apply impulses.
	for (var i = 0; i < Impulses.length; i++)
	{
		// Wall collisions specify null for one of the car indices, because there is no
		// second car involved. Therefore we are careful not to refer to an index which
		// doesn't belong to the Cars array.
		if (Impulses[i][0] in Cars)
		{
			Cars[Impulses[i][0]].VX -= Impulses[i][2];
			Cars[Impulses[i][0]].VY -= Impulses[i][3];
		}
		
		if (Impulses[i][1] in Cars)
		{		
			Cars[Impulses[i][1]].VX += Impulses[i][2];
			Cars[Impulses[i][1]].VY += Impulses[i][3];
		}
	}

		
	// Enforce speed limit and apply friction.
	for (var i = 0; i < Cars.length; i++)
	{
		// Scale down the car's speed if it's breaking the speed limit.
		var Speed = Math.sqrt(Cars[i].VX * Cars[i].VX + Cars[i].VY * Cars[i].VY);
		if (Speed >= GP.MaxSpeed)
		{
			Cars[i].VX *= GP.MaxSpeed / Speed;
			Cars[i].VY *= GP.MaxSpeed / Speed;
		}
		
		// Friction will act on the cars at all times, eventually bringing them to rest.
		Cars[i].VX *= GP.FrictionMultiplier;
		Cars[i].VY *= GP.FrictionMultiplier;
	}
}

if (typeof exports !== "undefined")
{
	exports.GP = GP;
	exports.RunGameFrame = RunGameFrame;
}