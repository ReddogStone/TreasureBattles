var Vector = (function() {
	var make = Point.make;

	return {
		make: make,
		clone: Point.clone,
		add: function(v1, v2) {
			return make(v1.x + v2.x, v1.y + v2.y);
		},
		neg: function(v) {
			return make(-v.x, -v.y);
		},
		mul: function(v, s) {
			return make(v.x * s, v.y * s);
		}
	}
})();