Point = {};
Point.copyArray = function(points){
	var ret = [];
	for(var i = 0; i<points.length; i++){
		ret.push(points[i].dup());
	}
	return ret;
}