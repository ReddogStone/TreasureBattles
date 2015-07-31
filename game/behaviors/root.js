var RootBehavior = (function() {
	function draw(world, context, graphics) {
		var player = world.player;
		context.fillRect(player.pos.x, player.pos.y, player.size.x, player.size.y);
	}

	function update(world, deltaTime) {
		var player = world.player;
		var pos = player.pos;
		var newPos = Vector.add(pos, Vector.mul(player.velocity, deltaTime));
		var newPlayer = player.with('pos', newPos);
		return world.with('player', newPlayer);
	}

	var PLAYER_SPEED = 100;

	function keypress(world, keyCode) {
		var player = world.player;
		var newVelocity = player.velocity;

		switch (keyCode) {
			case 39: newVelocity = Vector.make(PLAYER_SPEED, 0); break;
			case 37: newVelocity = Vector.make(-PLAYER_SPEED, 0); break;
			case 40: newVelocity = Vector.make(0, PLAYER_SPEED); break;
			case 38: newVelocity = Vector.make(0, -PLAYER_SPEED); break;
		}

		return world.with('player', player.with('velocity', newVelocity));
	}

	function main(world) {
		return function(eventType, data) {
			var newWorld = world;

			switch (eventType) {
				case 'update': return main(update(world, data));
				case 'draw': draw(world, data.context, data.graphics); break;
				case 'keypress': return main(keypress(world, data.keyCode));
			}

			return main(world);
		};
	}

	return main({
		player: {
			pos: Point.make(100, 200),
			size: Size.make(60, 50),
			velocity: Point.make(10, 5)
		}
	});
})();