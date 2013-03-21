/**
 *class that describes a voronoi diagram
 *@param [Vector] _points
 *@param bool sorted -- is the above array of points already sorted, default will be equivelent to false
 */
function Voronoi(_points, _sorted){

	/**********************\
	|* Private Properties *|
	\**********************/
	
	/**
	 *list of points
	 *@var [Vector]
	 */
	var points = Util.copyPointArray(_points);

	/**
	 *convex hull of all points represented as indexes to the points
	 *@var [number]
	 */
	var convex_hull = [];
	
	/***************************\
	|* Private Utility Methods *|
	\***************************/
	
	/**
	 *makes a line from a segment
	 *@param Vector start
	 *@param Vector end
	 *@return Line
	 */
	function line(start, end){
		var dir = end.subtract(start).toUnitVector();
		return $L(start,dir);
	}
	
	/**
	 *tells if the point is on the left of the line
	 *@param Line line
	 *@param Vector point
	 *@return bool -- true if to the left
	 */
	function toTheLeft(line, point){
		var rel = point.subtract(line.anchor).toUnitVector();
		return line.direction.cross(rel).e(3) > 0;
	}
	
	/**
	 *set up the more complex portions of this data structure
	 */
	function init(){
		if(!_sorted){
			points.sort(function(a,b){return a.e(1)-b.e(1)});
		}
		
		if(points.length > 2){
			//recursive construction
			var split = ~~(points.length/2);
			var left_half = new Voronoi(points.slice(0,split), true);
			var right_half = new Voronoi(points.slice(split), true);
			
			var top = hullFindCap(left_half, right_half, true);
			var bot = hullFindCap(left_half, right_half, false);
			
			var left_hull = left_half.getConvexHull();
			var right_hull = right_half.getConvexHull();
			//normalize the right set to use the same index space as we are, left should already be
			for(var i = 0; i<right_hull.length; i++){
				right_hull[i] += split;
			}
			
			//copy the points from the left hull
			for( var i = 0; i<left_hull.length; i++){
				var idx = (i+bot.left)%left_hull.length;
				convex_hull.push(left_hull[idx]);
				if(idx == top.left){
					break;
				}
			}
			
			//copy the points from the right hull
			for( var i = 0; i<right_hull.length; i++){
				var idx = (i+top.right)%right_hull.length;
				convex_hull.push(right_hull[idx]);
				if(idx == bot.right){
					break;
				}
			}
		}
		else{
			//simplest base case
			for(var i=0; i<points.length; i++){
				convex_hull.push(i);
			}
		}
	}
	
	/**
	 *given two Vorinoi find the points on the convex hull of each that represents the top/bottom segments of the hull of the union of them
	 *@param left_voronoi
	 *@param right_voronoi
	 *@param bool do_top -- if true we are looking for the top, otherwise the bottom
	 *@return object -- {top:{left:number,right:number}, bot:{left:number,right:number}} number are index into the hull of the respective objects
	 */
	function hullFindCap(left_voronoi, right_voronoi, do_top){
		var left_hull = left_voronoi.getConvexHullPoints();
		var right_hull = right_voronoi.getConvexHullPoints();
		
		//these are indexes into the hull array
		var left = 0;
		var right = 0;
		
		//find the extrema
		for(var i = 0; i<left_hull.length; i++){
			if((left_hull[i].e(1) > left_hull[left].e(1))){
				left = i;
			}
		}
		for(var i = 0; i<right_hull.length; i++){
			if((right_hull[i].e(1) < right_hull[right].e(1))){
				right = i;
			}
		}
		
		//set up the iteration functions
		var nextLeft;
		var nextRight;
		if(do_top){
			nextLeft = function(left){return (left+left_hull.length-1)%left_hull.length;};
			nextRight = function(right){return (right+1)%right_hull.length;};
		}else{
			nextLeft = function(left){return (left+1)%left_hull.length;};
			nextRight = function(right){return (right+right_hull.length-1)%right_hull.length;};
		}
		
		//set up the update function
		var updateSegment = function(left, right){return line(left_hull[left], right_hull[right]);};
		
		//the actual line made by these points
		var segment = updateSegment(left, right);
		
		//evaluation functions
		var isTangentToLeft = function(segment, next_left){
			return left_hull.length<2 || (toTheLeft(segment, left_hull[next_left]) == do_top)
		};
		var isTangentToRight = function(segment, next_right){
			return right_hull.length<2 || (toTheLeft(segment, right_hull[next_right]) == do_top)
		};
		
		//anything changed last round
		while(!isTangentToLeft(segment, nextLeft(left)) || !isTangentToRight(segment, nextRight(right))){
			while(!isTangentToLeft(segment, nextLeft(left))){
				left = nextLeft(left);
				segment = updateSegment(left, right);
			}
			while(!isTangentToRight(segment, nextRight(right))){
				right = nextRight(right);
				segment = updateSegment(left, right);
			}
		}
		
		return {left:left,right:right};
	}
	
	/********************\
	|* simple accessors *|
	\********************/
	
	/**
	 *gets a copy of the array of points
	 *@return [Vector]
	 */
	function getPoints(){
		return Util.copyPointArray(points);
	}
	
	/**
	 *gets a copy of the convex hull
	 *@return [number]
	 */
	function getConvexHull(){
		return convex_hull.slice();
	}
	
	/**
	 *the convex hull as a point list
	 *@return [Vector]
	 */
	function getConvexHullPoints(){
		return convex_hull.map(function(i){return points[i];});
	}
	
	//call the init code
	init();

	/********************\
	|* Public Interface *|
	\********************/
	return {
		getPoints:getPoints,
		getConvexHull:getConvexHull,
		getConvexHullPoints:getConvexHullPoints
	};
}