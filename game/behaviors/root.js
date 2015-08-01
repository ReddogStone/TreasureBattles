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

		var player = world.entities.player;
		context.font = 'normal 1em Trebuchet';
		context.fillStyle = 'black';
		context.fillRect(0, 0, 300, 70);
		context.fillStyle = 'white';
		context.textAlign = 'left';
		context.textBaseline = 'top';
		context.fillText(JSON.stringify(player.direction), 10, 10);
		context.fillText(JSON.stringify(player.target), 10, 30);
		context.fillText(JSON.stringify(player.gridPos), 10, 50);
	}

	var PLAYER_SPEED = 10;

	function update(world, deltaTime) {
		var player = world.entities.player;
		var tileMap = world.entities.background;
		var tileSize = tileMap.tileSize;

		var direction = player.direction;
		var gridPos = player.gridPos;
		var target = player.target;

		if (target) {
			var delta = Vector.sub(target, gridPos);
			var length = Vector.length(delta);

			if (length <= PLAYER_SPEED * deltaTime) {
				gridPos = Point.clone(target);
				target = null;
				deltaTime -= length / PLAYER_SPEED;
			} else {
				gridPos = Vector.add(gridPos, Vector.mul(delta, PLAYER_SPEED * deltaTime / length));
				deltaTime = 0;
			}
		}

		gridPos = Vector.add(gridPos, Vector.mul(direction, PLAYER_SPEED * deltaTime));

		var pos = [
			tileMap.pos,
			Vector.make(gridPos.x * tileSize.x, gridPos.y * tileSize.y),
			Vector.mul(tileSize, 0.5)
		].reduce(Vector.add);

		var newPlayer = player.merge({
			pos: pos,
			gridPos: gridPos,
			target: target
		});
		return world.with(['entities', 'player'], newPlayer);
	}

	function keypress(world, keyCode) {
		var player = world.entities.player;
		var direction = player.direction;

		switch (keyCode) {
			case 39: direction = Vector.make(1, 0); break;
			case 37: direction = Vector.make(-1, 0); break;
			case 40: direction = Vector.make(0, 1); break;
			case 38: direction = Vector.make(0, -1); break;
		}

		var gridPos = Point.clone(player.gridPos);
		if ((player.direction.x !== 0) && (direction.x === 0)) {
			var targetX = (player.direction.x > 0 ? Math.ceil : Math.floor)(gridPos.x);
			target = Point.make(targetX, gridPos.y);
		} else if ((player.direction.y !== 0) && (direction.y === 0)) {
			var targetY = (player.direction.y > 0 ? Math.ceil : Math.floor)(gridPos.y);
			target = Point.make(gridPos.x, targetY);
		} else {
			target = null;
		}

		var newPlayer = player.merge({
			gridPos: gridPos,
			direction: direction,
			target: target
		});

		return world.with(['entities', 'player'], newPlayer);
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
						gridPos: Point.make(62, 46),
						target: null,
						direction: Point.make(0, 0),
						size: 16,
						renderScript: 'player'
					}
				}
			});
		}
	}
})();