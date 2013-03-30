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
		 *the start of the one and only gap if there is one
		 *@var Edge
		 */
		var gap_start = null;
		
		/**
		 *the end of the one and only gap if there is one
		 *@var Edge
		 */
		var gap_end = null;
		
		/**
		 *NOTE: the gap_start and gap_end become orphaned when a face becomes bounded, they are never touched again once the list becomes properly circular
		 */
		
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
			this.prev_intersects = false;
			this.next_intersects = false
			return this;
		}
		
		/**
		 *trying to keep our internals internal
		 */
		function EdgeIterator(edge){
			this.isValid = function(){
				return edge !== null;
			};
			this.getLine = function(){
				//these really need to be imutable from this interface
				return edge.line.dup();
			};
			this.getNext = function(){
				return new EdgeIterator(edge.next);
			};
			this.getPrev = function(){
				return new EdgeIterator(edge.prev);
			};
			this.isLast = function(){
				return edge == null || edge.next == first_edge;
			};
			this.isFirst = function(){
				return edge == first_edge;
			};
			this.getNeighborEdge = function(){
				return new EdgeIterator(edge.neighbor_edge);
			};
			this.getNeighborFace = function(){
				return edge.neighbor_edge.parent_face;
			};
			this.getParent = function(){
				return edge.parent_face;
			};
			//these tests only work because we are dealing with a convex hull
			this.nextIntersects = function(){
				return edge && edge.next_intersects;
			}
			this.prevIntersects = function(){
				return edge && edge.prev_intersects;
			}
			//the edge is only for internal consumption, and that will be enforced
			this.getEdge = function(key){
				if(key == private_key){
					return edge;
				}
				else{
					throw "***ERROR*** cannot access private data in Edge invalid key"
				}
			}
			this.debug_edge = edge;//this is just for debugging
			return this;
		}

		/***************************\
		|* Private Utility Methods *|
		\***************************/
		
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
					before = range.start.getEdge(private_key);
				}
				if(typeof(after) == 'undefined'){
					after = range.end.getEdge(private_key);
				}
			}
			if(before instanceof EdgeIterator){
				before = before.getEdge(private_key);
			}
			if(after instanceof EdgeIterator){
				after = after.getEdge(private_key);
			}
			
			var edge = new Edge(line, this, before, after, neighbor_edge);
						
			//reroot the list at the new edge
			first_edge = edge;
			
			//make unbounded connections	
			if(!after && !before){
				edge.prev = edge;
				edge.next = edge;
				edge.next_intersects = false;
				edge.prev_intersects = false;
				gap_start = gap_end = edge;
			}
			else{
				if(before && !after){
					gap_end.prev = edge;
					edge.next = gap_end;
					edge.next_intersects = false;
					gap_start = edge;
				}
				if(after && !before){
					gap_start.next = edge;
					edge.prev = gap_start;
					edge.prev_intersects = false;
					gap_end = edge;
				}
			}
			
			//make bounded connections
			if(before){
				before.next = edge
				edge.prev_intersects = true;
				before.next_intersects = true;
			}
			if(after){
				after.prev = edge;
				edge.next_intersects = true;
				after.prev_intersects = true;
			}
			
			//chicken or egg
			if(!neighbor_edge){
				neighbor.insertEdge(line.reverseLine(), this, neighbor_before, neighbor_after, edge, before, after);
			}
			else{
				neighbor_edge.neighbor_edge = edge;
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
		
		/**
		 *find first edge that intersects
		 *@param Line line
		 *@return object -- {start:EdgeIterator,end:EdgeIterator} start and end of the intersection
		 */
		this.findIntersectRange = function (line){
			var cur_edge = this.getFirstEdge();
			var start_intersect = new EdgeIterator(null);
			var end_intersect = new EdgeIterator(null);
			if(!cur_edge.isValid()){
				return {start: start_intersect, end: end_intersect};
			}
			
			//go over every edge
			var quit = false;
			var quit_next = cur_edge.isLast();
			
			while(!quit){
				//see how far back an intersection could be
				var last_intersect = null
				if(cur_edge.prevIntersects()){
					last_intersect = cur_edge.getLine().intersectionDistanceWith(cur_edge.getPrev().getLine());
				}
				
				//see how far forward an intersection could be
				var next_intersect = null
				if(cur_edge.nextIntersects()){
					next_intersect = cur_edge.getLine().intersectionDistanceWith(cur_edge.getNext().getLine());
				}
				
				//see where the intersection is
				var this_intersect = cur_edge.getLine().intersectionDistanceWith(line);
				
				//if the intersection is between the intersection with the previous edge and the next, then it did indeed hit this edge
				if((last_intersect === null || last_intersect < this_intersect) && (next_intersect === null || this_intersect < next_intersect)){
					//we have an intersection, we need to figure out if it is coming or going
					//because we have clockwise winding if the test line is to the right, then it is entering, otherwise it's leaving
					if(cur_edge.getLine().direction.cross(line.direction).e(3) > 0){
						//it is the end intersection of the test line (clockwise winding order)
						end_intersect = cur_edge;
					}else{
						start_intersect = cur_edge
					}
				}
				
				quit = quit_next;
				quit_next = cur_edge.isLast();
				cur_edge = cur_edge.getNext();
			}
			
			return {start: start_intersect, end: end_intersect};
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
	
		//make sure we no longer have a reference to something outside our scope
		_points = Util.copyPointArray(_points);

		if(!_sorted){
			_points.sort(function(a,b){return a.e(1)-b.e(1)});
		}
		
		if(_points.length > 2){
			//recursive construction
			var split = ~~(_points.length/2);
			var left_half = new Voronoi(_points.slice(0,split), true);
			var right_half = new Voronoi(_points.slice(split), true);
			
			var bot = hullFindCap(left_half, right_half, false);
			var top = hullFindCap(left_half, right_half, true);
			
			//start the merge
			
			//import all of the edges from the two halves
			//my faces are references to the *half faces, yup, I made them so I can mangle them
			//they won't exist outside this if block anyway so who cares if I stole their internal objects
			//this is the only way to grab the higherarchy state anyway realistically
			for(var i = 0; i<left_half.getFaceCount(); i++){
				faces.push(left_half.getFace(i));
			}
			for(var i = 0; i<right_half.getFaceCount(); i++){
				faces.push(right_half.getFace(i));
				faces[left_half.getFaceCount()+i].idx += left_half.getFaceCount();//this is just for debugging
			}
			debug_faces = faces;//this is so I can see the state of the current node this serves no programatic function, just there so I have a reference in the debugger

			//build our selves up from our children
			merge(left_half, right_half, top, bot);
			
			//build the hull
			constructHull(left_half, right_half, bot, top, split);
		}
		else{
			//simplest base case
			for(var i=0; i<_points.length; i++){
				faces.push(new Face(_points[i]));
				faces[i].idx = i;//this is just for debugging
				convex_hull.push(i);
			}
			if(_points.length == 2){
				var line = Line.createPerpFromSegment(faces[0].getGeneratingPoint(), faces[1].getGeneratingPoint());
				faces[0].insertEdge(line,faces[1]);
			}
		}
	}
	
	/*-----------------*\
	| major subroutines |
	\*-----------------*/
	
	/**
	 *merges the two child diagrams into this
	 *@param Voronoi left_half
	 *@param Voronoi right_half
	 *@param object top -- {left:number,right:number}
	 *@param object bot -- {left:number,right:number}
	 */
	function merge(left_half, right_half, top, bot){
		//start with the top of the hull seam and work our way to the bottom
		//the first intersection has to happen on the end edge of the top fage of the hull
		var left_hull = left_half.getConvexHull();
		var right_hull = right_half.getConvexHull();
		
		var nextLeft = Util.makeLoopIterator(left_hull.length, 1);
		var nextRight = Util.makeLoopIterator(right_hull.length, -1);
		
		var left_face = left_half.getFace(left_hull[top.left]);
		var right_face = right_half.getFace(right_hull[top.right]);
		
		var left_end = left_half.getFace(left_hull[bot.left]);
		var right_end = right_half.getFace(right_hull[bot.right]);
		
		var last_intersect = left_face.getGeneratingPoint().add(right_face.getGeneratingPoint()).multiply(0.5);
					
		while(left_face != left_end || right_face != right_end){
			var dir = right_face.getGeneratingPoint().subtract(left_face.getGeneratingPoint()).cross($V([0,0,1])).toUnitVector();
			var bisector = $L(last_intersect, dir);

			var left_intersections = getIntersectionsFromFace(left_face, bisector);
			var right_intersections = getIntersectionsFromFace(right_face, bisector);
			
			//insert the bisecor into the face pair
			left_face.insertEdge(bisector, right_face, left_intersections.start, left_intersections.end, null, right_intersections.end, right_intersections.start)
			
			//if left intersection higher, incement with left, otherwise right
			if(right_intersections.end_pnt === null || (left_intersections.end_pnt !== null && left_intersections.end_pnt.e(2) > right_intersections.end_pnt.e(2))){
				left_face = left_intersections.end.getNeighborFace()
				last_intersect = left_intersections.end_pnt;
			}else{
				right_face = right_intersections.end.getNeighborFace();
				last_intersect = right_intersections.end_pnt;
			}
		}

		var dir = right_face.getGeneratingPoint().subtract(left_face.getGeneratingPoint()).cross($V([0,0,1])).toUnitVector();
		var bisector = $L(last_intersect, dir);

		var left_intersections = getIntersectionsFromFace(left_face, bisector);
		var right_intersections = getIntersectionsFromFace(right_face, bisector);
		
		//insert the bisecor into the face pair
		left_face.insertEdge(bisector, right_face, left_intersections.start, left_intersections.end, null, right_intersections.end, right_intersections.start)

	}
	
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
	function constructHull(left_half, right_half, bot, top, split){
		var left_hull = left_half.getConvexHull();
		var right_hull = right_half.getConvexHull();
		
		//normalize the right set to use the same index space as we are, left should already be
		for(var i = 0; i<right_hull.length; i++){
			right_hull[i] += left_half.getFaceCount();
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
			nextLeft = Util.makeLoopIterator(left_hull.length, -1);
			nextRight = Util.makeLoopIterator(right_hull.length, 1);
		}else{
			nextLeft = Util.makeLoopIterator(left_hull.length, 1);
			nextRight = Util.makeLoopIterator(right_hull.length, -1);
		}
		return {left:nextLeft, right:nextRight};
	}
	
	/**
	 *split off of hullFindCap because it was taking up too much space and being a general distraction
	 *@param [Vector] left_hull
	 *@param [Vector] right_hull
	 */
	function hullFindCapExtrema(left_hull, right_hull){
		var left = Util.findExtrema(
			left_hull,
			function(a,b){ return a.e(1) > b.e(1); }
		);

		var right = Util.findExtrema(
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
			return left_hull.length<2 || (segment.toTheLeft(left_hull[next_left]) != do_top)
		};
		var isTangentToRight = function(segment, next_right){
			return right_hull.length<2 || (segment.toTheLeft(right_hull[next_right]) != do_top)
		};
		return {left:isTangentToLeft, right:isTangentToRight};
	}
	
	/*~~~~~*\
	~ merge ~
	\*~~~~~*/
	/**
	 *split off of merge, because it was repeted four times
	 *@param Face face
	 *@param Line bisector
	 *@return object -- {start:EdgeIterator,end:EdgeIterator,pnt:Vector}
	 */
	function getIntersectionsFromFace(face, bisector){
		var intersection_range = face.findIntersectRange(bisector);
		intersection_range.start_pnt = null;
		intersection_range.end_pnt = null;
		if(intersection_range.end.isValid()){
			intersection_range.end_pnt = bisector.intersectionWith(intersection_range.end.getLine());
		}
		if(intersection_range.start.isValid()){
			intersection_range.start_pnt = bisector.intersectionWith(intersection_range.start.getLine());
		}
		return intersection_range;
	}
	
	/********************\
	|* simple accessors *|
	\********************/
	
	/**
	 *gets a copy of the array of points
	 *the copy is to prevent client code from messing with it
	 *@return [Vector]
	 */
	this.getPoints = function(){
		return Util.copyPointArray(_points);
	}
	
	/**
	 *gets a face, faces are fairly safe, nothing should be changeable that we are not allowed to change
	 *@param number idx --  which face to get
	 *@return Face
	 */
	this.getFace = function(idx){
		return faces[idx];
	}
	
	/**
	 *returns the number of faces in this diagram
	 *@return number
	 */
	this.getFaceCount = function(idx){
		return faces.length;
	}
	
	/**
	 *gets a copy of the convex hull
	 *@return [number]
	 */
	this.getConvexHull = function(){
		return convex_hull.slice();
	}
	
	/**
	 *the convex hull as a point list
	 *@return [Vector]
	 */
	this.getConvexHullPoints = function(){
		return convex_hull.map(function(i){return faces[i].getGeneratingPoint();});
	}
	
	//call the init code
	init();

	/********************\
	|* Public Interface *|
	\********************/
	return this;
}