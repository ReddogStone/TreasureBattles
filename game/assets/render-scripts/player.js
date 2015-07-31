ScriptLoader.module(function() {
	return {
		'default': function(context, player) {
			context.fillStyle = 'lightblue';
			context.strokeStyle = '#500000';

			context.beginPath();
			context.arc(player.pos.x, player.pos.y, player.size * 0.5, 0, Math.PI * 2);
			context.fill();
			context.stroke();
		}
	};
});