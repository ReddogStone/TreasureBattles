ScriptLoader.module(function() {
	return {
		'default': function(context, bomb, time) {
			var state = bomb.state;

			var size = 12;

			if (state.ignite) {
				var dt = time - state.ignite;
				size *= 0.2 * (Math.cos(10 * dt) + 1) + 0.6;
			}

			var pos = bomb.pos;

			context.fillStyle = 'darkgray';
			context.strokeStyle = 'black';

			context.beginPath();
			context.arc(pos.x, pos.y, size * 0.5, 0, Math.PI * 2);
			context.fill();
			context.stroke();
		}
	};
});