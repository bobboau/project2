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

	/**
	 *collection of all faces
	 *@var [Face]
	 */
	var faces = [];
	
	/*****************\
	|* inner classes *|
	\*****************/
	
	/**
	 *a face of a Voronoi diagram, this is effectivly a doubly linked list of lines (Edges)
	 *though it can represent an unbounded region (no edges)
	 *or a partaly bouded region (first and last do not intersect in the correct direction)
	 *edges are in clockwise winding order and intersections with other edges should be to (see partaly bounded)
	 *new Faces will be created with no Edges
	 *the Edge data structure is very much intended to eb strictly internal to Face, there is a itterator object made for the purpose of exposing the Edge data in a safeish way
	 *@param Vector _generating_point -- the point from which this face is defined
	 */
	function Face(_generating_point){
		
		/**********************\
		|* Private Properties *|
		\**********************/
	
		/**
		 *the point at the center of the region
		 *@var Vector
		 */
		var generating_point = _generating_point.dup();
		
		/**
		 *@var Edge
		 */
		var first_edge = null;
		
		/**
		 *used to access internal data from external sources
		 *will not be given properties or anything, this is just a sectret object only this face has that will never change
		 *@var object
		 */
		var private_key = {};
		
		/*****************\
		|* inner classes *|
		\*****************/
	
		/**
		 *basicly a node in a linked list of lines
		 *@param Line _line
		 *@param Face _parent
		 *@param Edge _prev
		 *@param Edge _next
		 *@param Edge _neighbor_edge -- the edge in the neighboring face that points in the other direction but is colinear
		 */
		function Edge(_line, _parent, _prev, _next, _neighbor_edge){
			this.line = _line;
			this.parent_face = _parent;
			this.next = _next;
			this.prev = _prev;
			this.neighbor_edge = _neighbor_edge;
			return this;
		}
		
		/**
		 *trying to keep our internals internal
		 */
		function EdgeIterator(edge){
			this.getLine = function(){
				//these really need to be imutable from this interface
				return edge.line.dup();
			};
			this.getNext = function(){
				return EdgeIterator(edge.next);
			};
			this.getPrev = function(){
				return EdgeIterator(edge.prev);
			};
			this.getNeighborEdge = function(){
				return EdgeIterator(edge.neighbor_edge);
			};
			this.getNeighborFace = function(){
				return edge.neighbor_edge.parent;
			};
			this.getParent = function(){
				return edge.parent;
			};
			//the edge is only for internal consumption, and that will be enforced
			this.getEdge = function(key){
				if(key == private_key){
					return edge;
				}
				else{
					throw "***ERROR*** cannot access private data in Edge invalid key"
				}
			}
			return this;
		}

		/***************************\
		|* Private Utility Methods *|
		\***************************/
		
		/**
		 *find first edge that intersects
		 *@param Line line
		 *@return object -- {start:Edge,end:Edge} start and end of the intersection
		 */
		function findIntersectRange(line){
			var cur_edge = first_edge;
			var start_intersect = null;
			var end_intersect = null;
			while(cur_edge){
				var last_intersect = cur_edge.line.intersectionDistanceWith(cur_edge.prev.line);
				var next_intersect = cur_edge.line.intersectionDistanceWith(cur_edge.next.line);
				var this_intersect = cur_edge.line.intersectionDistanceWith(line);
				
				if(last_intersect < this_intersect && this_intersect < next_intersect){
					//we have an intersection
					if(cur_edge.line.direction.cross(line).e(3) < 0){
						//it is the end intersection of the test line (clockwise winding order)
						end_intersect = cur_edge;
					}else{
						start_intersect = cur_edge
					}
				}
			}
			return {start:start_intersect, end:end_intersect}
		}
		
		/********************\
		|* Public Interface *|
		\********************/
	
		/**
		 *adds a new edge, 
		 *@param Line edge
		 *@param Face neighbor -- what is on the other side of this edge
		 *@param Edge before -- (Optional) if you happen to know which edge comes before this one
		 *@param Edge after -- (Optional) if you happen to know which edge comes after this one
		 *@param Edge neighbor_edge -- (Optional) if you happen to know which edge is the neighbor
		 *@param Edge neighbor_before -- (Optional) if you happen to know which edge comes before the neighbor
		 *@param Edge neighbor_after -- (Optional) if you happen to know which edge comes after the neighbor
		 *@return Edge
		 */
		this.insertEdge = function(line, neighbor, before, after, neighbor_edge, neighbor_before, neighbor_after){
			//note a distinction between undefined and null is verymuch being made here
			//undefined meaning "no value given, you'll have to figure it out", null meaning "I have given you the value and it is none"
			if(typeof(before) == 'undefined' || typeof(after) == 'undefined'){
				var range = this.findIntersectRange(line);
				if(typeof(before) == 'undefined'){
					before = range.start;
				}
				if(typeof(after) == 'undefined'){
					after = range.end;
				}
			}
			if(typeof(before) == 'EdgeIterator'){
				before = before.getEdge(private_key);
			}
			if(typeof(after) == 'EdgeIterator'){
				after = after.getEdge(private_key);
			}
			
			var edge = new Edge(line, this, before, after, neighbor_edge);
			if(before){
				before.next = edge;
			}
			if(after){
				after.prev = edge;
			}
			
			
			//if the first_edge is null is the only situation where a double null from findIntersectRange will result in the line getting added
			if(first_edge == edge.next){
				first_edge = edge;
			}
			
			//chicken or egg
			if(!neighbor_edge){
				neighbor.insertEdge(line.reverseLine(), this, neighbor_before, neighbor_after, edge, before, after);
			}
			else{
				neighbor_edge.neighbor_edge = this;
			}
			
			return new EdgeIterator(edge);
		}
		
		/**
		 *@return EdgeIterator
		 */
		this.getFirstEdge = function(){
			return new EdgeIterator(first_edge);
		}
		
		/**
		 *@return Vector
		 */
		this.getGeneratingPoint = function(){
			return generating_point.dup();
		}
		
		return this;
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
		var segment = Line.createFromSegment(left_hull[left], right_hull[right]);
		
		//anything changed last round
		while(!isTangentTo.left(segment, next.left(left)) || !isTangentTo.right(segment, next.right(right))){
			while(!isTangentTo.left(segment, next.left(left))){
				left = next.left(left);
				segment = Line.createFromSegment(left_hull[left], right_hull[right]);
			}
			while(!isTangentTo.right(segment, next.right(right))){
				right = next.right(right);
				segment = Line.createFromSegment(left_hull[left], right_hull[right]);
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
			return left_hull.length<2 || (segment.toTheLeft(left_hull[next_left]) == do_top)
		};
		var isTangentToRight = function(segment, next_right){
			return right_hull.length<2 || (segment.toTheLeft(right_hull[next_right]) == do_top)
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
	this.getPoints = function(){
		return Util.copyPointArray(points);
	}
	
	/**
	 *gets a copy of the convex hull
	 *@return [number]
	 */
	this.getConvexHull = function (){
		return convex_hull.slice();
	}
	
	/**
	 *the convex hull as a point list
	 *@return [Vector]
	 */
	this.getConvexHullPoints = function (){
		return convex_hull.map(function(i){return points[i];});
	}
	
	//call the init code
	init();

	/********************\
	|* Public Interface *|
	\********************/
	return this;
}