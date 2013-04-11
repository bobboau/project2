/**
 *module for managing the abstract representation of the set of points and lines and everything, this is where our important code lives
 */

 Scene = (function(){
	/*********************\
	|* privte attributes *|
	\*********************/
	
	/**
	 *the defining points
	 *@var [Vector]
	 */
	var points = [];
	
	/**
	 *the computed Voronoi diagram (or null if one hasn't been calculated yet)
	 *@var Voronoi
	 */
	var diagram = null;

	/**
	 *the history of recursively computed Voronoi diagrams
	 *@var [Vector]
	 */
	var diagram_history = [];
	
	/*****************************\
	|* private utility functions *|
	\*****************************/
	
	/**
	 *checks to see if adding the given point would be ok (it won't be a degeneracy)
	 *@param Vertex point
	 *@return bool
	 */
	function isPointValid(point){
		for(var i = 0; i<points.length; i++){
			if(points[i].e(1) == point.e(1) || points[i].e(2) == point.e(2)){
				return false;
			}
		}
		return true;
	}
	
	/******************\
	|* public methods *|
	\******************/
	
	/**
	 *clears the scene
	 */
	function reset(){
		points = [];
		diagram = null;
		diagram_history = [];
	}
	
	/**
	 *adds a point to the scene
	 *@param number x
	 *@param number y
	 */
	function addPoint(x, y){
		var new_point = $V([x,y,0]);
		while(!isPointValid(new_point)){
			new_point = $V([x+Math.random(),y+Math.random(),0]);
		}
		points.push(new_point);
	}
	
	/**
	 *moves the most recently added point on the screen, adds one if there was none
	 *@param number x
	 *@param number y
	 */
	function updatePoint(x, y){
		var new_point = $V([x,y,0]);
		while(!isPointValid(new_point)){
			new_point = $V([x+Math.random(),y+Math.random(),0]);
		}
		if(points.length < 1){
			points.push(new_point);
		}
		else{
			points[points.length-1] = new_point;
		}
		calculate();
	}
	
	/**
	 *retrives all points in the scene
	 *@return [Vector]
	 */
	function getPoints(){
		return Util.copyPointArray(points);
	}
	
	/**
	 *retrives the calculated voronoi diagram or null if one hasn't been calculated yet
	 *this thing should be returning a copy, but for now that's low priority
	 *@return Voronoi|null
	 */
	function getDiagram(){
		return diagram;
	}

	function getDiagramHistory(){
		return diagram_history;
	}

	/**
	 *does the calculation
	 *entry point for what our grade will be based on
	 */
	function calculate(){
		//magic
		diagram = new Voronoi(points, diagram_history);
	}
	
	return {
		reset:reset,
		addPoint:addPoint,
		getPoints:getPoints,
		getDiagram:getDiagram,
		getDiagramHistory:getDiagramHistory,
		calculate:calculate,
		updatePoint:updatePoint
	};
})();