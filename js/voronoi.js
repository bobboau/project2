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
	
	/*****************\
	|* inner classes *|
	\*****************/
	
	/**
	 *a face of a Voronoi region, this is effectivly a linked list of lines (edges)
	 *though it can represent an unbounded region (no edges) or a partly bouded region (first and last edge have no next/prev)
	function Face(){
	}

	/***************************\
	|* Private Utility Methods *|
	\***************************/
	
	/**
	 *set up the more complex portions of this data structure
	 *this is the highest level of the voronoi diagram algorithm
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
			
			//lots more code goes here
			
			constructHull(left_half, right_half, top, bot, split);
		}
		else{
			//simplest base case
			for(var i=0; i<points.length; i++){
				convex_hull.push(i);
			}
		}
	}
	
	/*-----------------*\
	| general utilities |
	\*-----------------*/
	
	/**
	 *given an array of Vertexes find the point that is the 'most' (could be most negitive, or most close to 0, you define what most means with the cmp function)
	 *@param [Vector] points
	 *@param function(Vector, Vector) cmp -- comparison function, returns true when a is 'more' than b (more can be more small)
	 */
	function findPointExtrema(points, cmp){
		//these are indexes into the points array
		var most = 0;
		
		//find the extrema
		for(var i = 0; i<points.length; i++){
			if(cmp(points[i], points[most])){
				most = i;
			}
		}
		
		return most;
	}
	
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
	 *given a array make a function that will give the next in sequence in a loop by the given ammount
	 *@param [???] array
	 *@param number step
	 *@return function(number) -- given an index return the next index
	 */
	function makeLoopIterator(array, step){
		return function(index){
			//the +array.length followed allows for negitive numbers (note this will only support negitive steps who's magnatude is less than the array length)
			//%array.length makes it a loop
			return (index+array.length+step)%array.length;
		};
	}
	
	/*-----------------*\
	| major subroutines |
	\*-----------------*/
	
	/**
	 *given two Vorinoi find the points on the convex hull of each that represents the top/bottom segments of the hull of the union of them
	 *@param Voronoi left_voronoi
	 *@param Voronoi right_voronoi
	 *@param bool do_top -- if true we are looking for the top, otherwise the bottom
	 *@return object -- {left:number,right:number} number are index into the hull of the respective objects
	 */
	function hullFindCap(left_voronoi, right_voronoi, do_top){
		var left_hull = left_voronoi.getConvexHullPoints();
		var right_hull = right_voronoi.getConvexHullPoints();
		
		//get the starting points
		var extrema = hullFindCapExtrema(left_hull, right_hull);
		var left = extrema.left;
		var right = extrema.right;
		
		//get the iterators
		var next = hullFindCapIterators(left_hull, right_hull, do_top);
		
		//evaluation functions
		var isTangentTo = hullFindCapEvaluation(left_hull, right_hull, do_top);
		
		//the actual line made by these points
		var segment = line(left_hull[left], right_hull[right]);
		
		//anything changed last round
		while(!isTangentTo.left(segment, next.left(left)) || !isTangentTo.right(segment, next.right(right))){
			while(!isTangentTo.left(segment, next.left(left))){
				left = next.left(left);
				segment = line(left_hull[left], right_hull[right]);
			}
			while(!isTangentTo.right(segment, next.right(right))){
				right = next.right(right);
				segment = line(left_hull[left], right_hull[right]);
			}
		}
		
		return {left:left,right:right};
	}
	
	/**
	 *given to hulls and caps on the top and bottom of the gap construct this diagram's hull
	 *the right_hull is completely to the right of left_hull
	 *@param Voronoi right_hull -- array of indexes to points on the boundry of a convex hull in clockwise winding order
	 *@param Voronoi left_hull -- array of indexes to points on the boundry of a convex hull in clockwise winding order
	 *@param object top -- {left:number,right:number} numbers are indexes into the respective hulls hull -- this is the top patch between left and right
	 *@param object bot -- {left:number,right:number} numbers are indexes into the respective hulls hull -- this is the bottom patch between left and right
	 */
	function constructHull(left_half, right_half, top, bot, split){
		var left_hull = left_half.getConvexHull();
		var right_hull = right_half.getConvexHull();
		
		//normalize the right set to use the same index space as we are, left should already be
		for(var i = 0; i<right_hull.length; i++){
			right_hull[i] += left_half.getPoints().length;
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
	
	/*--------------------*\
	| parts of subroutines |
	\*--------------------*/
	
		/*~~~~~~~~~~~*\
		~ hullFindCap ~
		\*~~~~~~~~~~~*/
	
	/**
	 *split off of hullFindCap because it was taking up too much space and being a general distraction
	 *@param [Vector] left_hull
	 *@param [Vector] right_hull
	 *@param bool do_top
	 */
	function hullFindCapIterators(left_hull, right_hull, do_top){
		//set up the iteration functions
		var nextLeft;
		var nextRight;
		if(do_top){
			nextLeft = makeLoopIterator(left_hull, -1);
			nextRight = makeLoopIterator(right_hull, 1);
		}else{
			nextLeft = makeLoopIterator(left_hull, 1);
			nextRight = makeLoopIterator(right_hull, -1);
		}
		return {left:nextLeft, right:nextRight};
	}
	
	/**
	 *split off of hullFindCap because it was taking up too much space and being a general distraction
	 *@param [Vector] left_hull
	 *@param [Vector] right_hull
	 */
	function hullFindCapExtrema(left_hull, right_hull){
		var left = findPointExtrema(
			left_hull,
			function(a,b){ return a.e(1) > b.e(1); }
		);

		var right= findPointExtrema(
			right_hull,
			function(a,b){ return a.e(1) < b.e(1); }
		);
		
		return {left:left, right:right};
	}
	
	/**
	 *split off of hullFindCap because it was taking up too much space and being a general distraction
	 *@param [Vector] left_hull
	 *@param [Vector] right_hull
	 */
	function hullFindCapEvaluation(left_hull, right_hull, do_top){
		var isTangentToLeft = function(segment, next_left){
			return left_hull.length<2 || (toTheLeft(segment, left_hull[next_left]) == do_top)
		};
		var isTangentToRight = function(segment, next_right){
			return right_hull.length<2 || (toTheLeft(segment, right_hull[next_right]) == do_top)
		};
		return {left:isTangentToLeft, right:isTangentToRight};
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