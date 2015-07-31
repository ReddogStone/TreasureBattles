var RootBehavior = (function() {
	function getScriptPath(scriptName) {
		return 'game/assets/render-scripts/' + scriptName + '.js';
	}

	function draw(world, context) {
		var assets = world.assets;

		world.entities.forEach(function(id, entity) {
			var render = assets.renderScripts[getScriptPath(entity.renderScript)];
			render && render.default && render.default(context, entity);
		});
	}

	var PLAYER_SPEED = 5;

	function update(world, deltaTime) {
		var player = world.entities.player;
		var tileMap = world.entities.background;
		var tileSize = tileMap.tileSize;

		var direction = player.direction;
		var from = player.from;
		var to = player.to;
		var percentage = 1;

		if ((from.x !== to.x) || (from.y !== to.y)) {
			percentage = player.percentage + PLAYER_SPEED * deltaTime;
		}

		if ( (percentage >= 1) && ((direction.x !== 0) || (direction.y !== 0)) ) {
			from = Vector.clone(to);
			to = Vector.add(from, direction);
			percentage -= 1;
		}

		var gridPos = Vector.lerp(from, to, percentage);
		var pos = [tileMap.pos, Vector.make(gridPos.x * tileSize.x, gridPos.y * tileSize.y), Vector.mul(tileSize, 0.5)].reduce(Vector.add);
		var newPlayer = player.merge({
			pos: pos,
			percentage: percentage,
			from: from,
			to: to
		});
		return world.with(['entities', 'player'], newPlayer);
	}

	function keypress(world, keyCode) {
		var player = world.entities.player;
		var newDirection = player.direction;

		switch (keyCode) {
			case 39: newDirection = Vector.make(1, 0); break;
			case 37: newDirection = Vector.make(-1, 0); break;
			case 40: newDirection = Vector.make(0, 1); break;
			case 38: newDirection = Vector.make(0, -1); break;
		}

		return world.with(['entities', 'player', 'direction'], newDirection);
	}

	function main(world) {
		return function(eventType, data) {
			var newWorld = world;

			switch (eventType) {
				case 'update': return main(update(world, data));
				case 'draw': draw(world, data); break;
				case 'keypress': return main(keypress(world, data.keyCode));
			}

			return main(world);
		};
	}

	var renderScriptUrls = [
		'tile-map',
		'player',
	].map(getScriptPath);

	var renderScriptCache = {};

	function loadScriptCache() {
		renderScriptUrls.forEach(function(url) {
			ScriptLoader.load(url, {}, function(err, script, cache) {
				if (err) {
					return console.log(err);
				}
				Object.keys(cache).forEach(function(id) {
					renderScriptCache[id] = cache[id];
				});
			});
		});
	}

	return {
		init: function() {
			loadScriptCache();

			document.getElementById('btnReload').addEventListener('click', function() {
				loadScriptCache();
			}, false);

			return main({
				assets: {
					renderScripts: renderScriptCache
				},
				entities: {
					background: {
						pos: Point.make(0, 0),
						tileSize: Size.make(16, 16),
						columns: 64,
						data: Array.apply(null, Array(64 * 48)).map(function() { return Math.floor(Math.random() * 3); }),
						renderScript: 'tile-map'
					},
					player: {
						from: Point.make(62, 46),
						to: Point.make(62, 46),
						percentage: 0,
						direction: Point.make(0, 0),
						size: 16,
						renderScript: 'player'
					}
				}
			});
		}
	}
})();