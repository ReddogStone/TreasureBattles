ScriptLoader.module(function() {

	var TILE_COLORS = {
		0: 'brown',
		1: 'darkgray',
		2: 'darkred'
	};

	return {
		'default': function(context, tileMap) {
			var data = tileMap.data;
			var columns = tileMap.columns;
			var tileSize = tileMap.tileSize;
			var pos = tileMap.pos;

			context.save();
			context.translate(pos.x, pos.y);

			data.forEach(function(tile, index) {
				var x = index % columns;
				var y = Math.floor(index / columns);
				context.fillStyle = TILE_COLORS[tile];
				context.fillRect(x * tileSize.x, y * tileSize.y, tileSize.x, tileSize.y);
			});

			context.restore();
		}
	};
});