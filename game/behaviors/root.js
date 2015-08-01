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

	function isPassable(tile) {
		return (tile.value === 0);
	}

	var TILE_HEALTH = {
		0: 0,
		1: 3,
		2: 10
	};
	function tileHealth(tileValue) {
		return TILE_HEALTH[tileValue];
	}

	function getTileAt(grid, gridPos) {
		var columns = grid.columns;
		var rows = Math.ceil(grid.data.length / columns);
		if ((gridPos.x >= columns) || (gridPos.x < 0) || (gridPos.y >= rows) || (gridPos.y < 0)) {
			return -1;
		}
		return grid.data[Math.floor(gridPos.y) * columns + Math.floor(gridPos.x)];
	}

	function getEffectiveGridPos(gridPos, dir) {
		var roundFunc = ((dir.x === -1) || (dir.y === -1)) ? Math.floor : Math.ceil;
		return {
			x: roundFunc(gridPos.x),
			y: roundFunc(gridPos.y)
		}
	}

	function update(world, deltaTime) {
		var player = world.entities.player;
		var grid = world.entities.grid;
		var tileSize = grid.tileSize;

		var direction = player.direction;
		var gridPos = player.gridPos;
		var target = player.target;

		var newGridPos = gridPos;
		if (target) {
			var delta = Vector.sub(target, gridPos);
			var length = Vector.length(delta);

			if (length <= PLAYER_SPEED * deltaTime) {
				newGridPos = Point.clone(target);
				target = null;
				deltaTime -= length / PLAYER_SPEED;
			} else {
				newGridPos = Vector.add(gridPos, Vector.mul(delta, PLAYER_SPEED * deltaTime / length));
				deltaTime = 0;
			}
		}

		newGridPos = Vector.add(newGridPos, Vector.mul(direction, PLAYER_SPEED * deltaTime));

		var effectivePos = getEffectiveGridPos(newGridPos, direction);
		if (!isPassable(getTileAt(grid, effectivePos))) {
			newGridPos = getEffectiveGridPos(gridPos, direction);
		}

		var pos = [
			grid.pos,
			Vector.make(newGridPos.x * tileSize.x, newGridPos.y * tileSize.y),
			Vector.mul(tileSize, 0.5)
		].reduce(Vector.add);

		var newPlayer = player.merge({
			pos: pos,
			gridPos: newGridPos,
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
		var target = null;
		if ((player.direction.x !== 0) && (direction.x === 0)) {
			var targetX = Math.round(gridPos.x);
			target = Point.make(targetX, gridPos.y);
		} else if ((player.direction.y !== 0) && (direction.y === 0)) {
			var targetY = Math.round(gridPos.y);
			target = Point.make(gridPos.x, targetY);
		}

		var newPlayer = world.entities.player.merge({
			direction: direction,
			target: target
		});
		return world.with(['entities', 'player'], newPlayer);
	}

	function changePlayerDirection(world, direction, target) {
		var grid = world.entities.grid;

		var newPlayer = world.entities.player.merge({
			direction: direction,
			target: target
		});
		return world.with(['entities', 'player'], newPlayer);
	}

	function main(world) {
		return function(eventType, data) {
			var newWorld = world;

			switch (eventType) {
				case 'keypress': return main(keypress(world, data.keyCode));
				case 'update': return main(update(world, data));
				case 'draw': draw(world, data); break;
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
					grid: {
						pos: Point.make(0, 0),
						tileSize: Size.make(16, 16),
						columns: 64,
						data: Array.apply(null, Array(64 * 48)).map(function() {
							var value = Math.max(Math.floor(Math.random() * 10) - 7, 0);
							return {
								value: value,
								health: tileHealth(value)
							};
						}),
						renderScript: 'tile-map'
					},
					player: {
						gridPos: Point.make(62, 46),
						target: null,
						direction: Point.make(0, 0),
						size: 16,
						renderScript: 'player',
						hitCoolOff: 0
					}
				}
			});
		}
	}
})();