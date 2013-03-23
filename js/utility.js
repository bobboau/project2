Util = {
	copyPointArray : function(points){
		var ret = [];
		for(var i = 0; i<points.length; i++){
			ret.push(points[i].dup());
		}
		return ret;
	},
	
	copyLineArray : function(lines){
		var ret = [];
		for(var i = 0; i<lines.length; i++){
			ret.push(lines[i].dup());
		}
		return ret;
	}
}