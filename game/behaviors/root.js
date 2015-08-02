var RootBehavior = (function() {
	function getScriptPath(scriptName) {
		return 'game/assets/render-scripts/' + scriptName + '.js';
	}

	function draw(world, context, time) {
		var assets = world.assets;

		world.entities.forEach(function(id, entity) {
			var render = assets.renderScripts[getScriptPath(entity.renderScript)];
			render && render.default && render.default(context, entity, time);
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
	var PLAYER_HIT_COOL_OFF = 1;

	function isPassable(tile) {
		return tile && (tile.value === 0);
	}

	var TILE_HEALTH = {
		0: 0,
		1: 3,
		2: 1
	};
	function initialTileHealth(tileValue) {
		return TILE_HEALTH[tileValue];
	}

	function getTileIndex(grid, gridPos) {
		var columns = grid.columns;
		var rows = Math.ceil(grid.data.length / columns);
		if ((gridPos.x >= columns) || (gridPos.x < 0) || (gridPos.y >= rows) || (gridPos.y < 0)) {
			return -1;
		}
		return Math.floor(gridPos.y) * columns + Math.floor(gridPos.x);
	}

	function getTileAt(grid, gridPos) {
		var index = getTileIndex(grid, gridPos);
		return (index >= 0) ? grid.data[index] : { value: -1, health: 0 };
	}

	function hitTile(grid, gridPos) {
		var index = getTileIndex(grid, gridPos);
		if (index < 0) { return grid; }

		var data = grid.data;
		var tile = data[index];

		var newTileHealth = tile.health - 1;
		if (newTileHealth <= 0) {
			tile = { value: 0, health: 0 };
		} else {
			tile = { value: tile.value, health: newTileHealth };
		}

		return data.slice(0, index).concat([tile]).concat(data.slice(index + 1));
	}

	function getEffectiveGridPos(gridPos, dir) {
		var roundFunc = ((dir.x === -1) || (dir.y === -1)) ? Math.floor : Math.ceil;
		return {
			x: roundFunc(gridPos.x),
			y: roundFunc(gridPos.y)
		}
	}

	function moveToTarget(gridPos, target, deltaTime) {
		if (target) {
			var delta = Vector.sub(target, gridPos);
			var length = Vector.length(delta);

			if (length <= PLAYER_SPEED * deltaTime) {
				return { restTime: deltaTime - length / PLAYER_SPEED };
			} else {
				var pos = Vector.add(gridPos, Vector.mul(delta, PLAYER_SPEED * deltaTime / length));
				return { pos: pos };
			}
		}

		newGridPos = Vector.add(newGridPos, Vector.mul(direction, PLAYER_SPEED * deltaTime));
	}

	function movePlayer(grid, gridPos, direction, target, deltaTime) {
		var newGridPos = gridPos;
		var moveTime = deltaTime;
		if (target) {
			var result = moveToTarget(gridPos, target, deltaTime);
			if (result.pos) {
				moveTime = 0;
				newGridPos = result.pos;
			} else {
				newGridPos = Point.clone(target);
				moveTime = result.restTime;
				target = null;
			}
		}

		newGridPos = Vector.add(newGridPos, Vector.mul(direction, PLAYER_SPEED * moveTime));

		var effectivePos = getEffectiveGridPos(newGridPos, direction);
		if (!isPassable(getTileAt(grid, effectivePos))) {
			return { pos: getEffectiveGridPos(gridPos, direction), hitWallAt: effectivePos };
		}

		return { pos: newGridPos, target: target };
	}

	function update(world, deltaTime, time) {
		var player = world.entities.player;
		var grid = world.entities.grid;
		var tileSize = grid.tileSize;

		var hitCoolOff = Math.max(player.hitCoolOff - deltaTime, 0);
		var result = movePlayer(grid, player.gridPos, player.direction, player.target, deltaTime);

		var newGridPos = result.pos;
		var target = result.target;
		var state = player.state;

		if (result.hitWallAt) {
			if (!state.hit) {
				state = { hit: time };
			}

			if (hitCoolOff === 0) {
				grid = grid.with('data', hitTile(grid, result.hitWallAt));
				hitCoolOff = PLAYER_HIT_COOL_OFF;
			}
		} else if (!state.move) {
			state = { move: time };
		}

		var pos = [
			grid.pos,
			Vector.make(newGridPos.x * tileSize.x, newGridPos.y * tileSize.y),
			Vector.mul(tileSize, 0.5)
		].reduce(Vector.add);

		player = player.merge({
			pos: pos,
			gridPos: newGridPos,
			target: target,
			hitCoolOff: hitCoolOff,
			state: state
		});

		var newEntities = world.entities.merge({
			player: player,
			grid: grid
		});
		return world.with('entities', newEntities);
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

	function main(world) {
		return function(eventType, data) {
			var newWorld = world;

			switch (eventType) {
				case 'keypress': return main(keypress(world, data.keyCode));
				case 'update': return main(update(world, data.deltaTime, data.time));
				case 'draw': draw(world, data.context, data.time); break;
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
							var value = Math.max(Math.floor(Math.random() * 2) + 1, 0);
							return {
								value: value,
								health: initialTileHealth(value)
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
						hitCoolOff: 0,
						state: { stand: 0 }
					}
				}
			});
		}
	}
})();