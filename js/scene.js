/**
 *module for managing the abstract representation of the set of points and lines and everything, this is where our improtaint code lives
 */

 Scene = (function(){ 
	/**
	 *the defining points
	 *@var [Vector]
	 */
	var points = []
	
	/**
	 *the computed Voronoi diagram (or null if one hasn't been calculated yet)
	 *@var Voronoi
	 */
	var diagram = null;
	
	/**
	 *clears the scene
	 */
	function reset(){
		points = [];
		diagram = null;
	}
	
	/**
	 *adds a point to the scene
	 *@param number x
	 *@param number y
	 */
	function addPoint(x, y){
		points.push($V([x,y,0]));
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
	
	/**
	 *does the calculation
	 *entry point for what our grade will be based on
	 */
	function calculate(){
		//magic
		diagram = new Voronoi(points);
	}
	
	return {
		reset:reset,
		addPoint:addPoint,
		getPoints:getPoints,
		getDiagram:getDiagram,
		calculate:calculate
	};
})();