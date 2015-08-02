ScriptLoader.module(function() {
	return {
		'default': function(context, player, time) {
			var state = player.state;

			var size = player.size;
			if (state.move) {
				var dt = time - state.move;
				size *= 0.2 * (Math.cos(10 * dt) + 1) + 0.6;
			}

			var pos = player.pos;
			if (state.hit) {
				var dt = time - state.hit;
				var offset = Math.cos(10 * dt) + 1;
				var dir = player.direction;
				pos.x += dir.x * offset;
				pos.y += dir.y * offset;
			}

			context.fillStyle = 'lightblue';
			context.strokeStyle = '#500000';

			context.beginPath();
			context.arc(pos.x, pos.y, size * 0.5, 0, Math.PI * 2);
			context.fill();
			context.stroke();
		}
	};
});