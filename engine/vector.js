var Vector = (function() {
	var make = Point.make;

	function add(v1, v2) {
		return make(v1.x + v2.x, v1.y + v2.y);
	}
	function neg(v) {
		return make(-v.x, -v.y);
	}
	function mul(v, s) {
		return make(v.x * s, v.y * s);
	}

	return {
		make: make,
		clone: Point.clone,
		add: add,
		neg: neg,
		mul: mul,
		lerp: function(v1, v2, a) {
			return add(mul(v1, 1 - a), mul(v2, a));
		}
	}
})();