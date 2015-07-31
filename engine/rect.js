var Rect = (function() {
	function make(x, y, sx, sy) {
		return { x: x, y: y, sx: sx, sy: sy };
	}

	return {
		coords: make,
		corners: function(topLeft, bottomRight) {
			return make(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
		},
		posSize: function(topLeft, size) {
			return make(topLeft.x, topLeft.y, size.x, size.y);
		}
	};
})();