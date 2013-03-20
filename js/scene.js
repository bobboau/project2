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
	 *clears the scene
	 */
	function reset(){
		points = [];
	}
	
	/**
	 *adds a point to the scene
	 *@param number x
	 *@param number y
	 */
	function addPoint(x, y){
		points.push(new Point(x,y));
	}
	
	/**
	 *retrives all points in the scene
	 *this function is somewhat dangerous as it allows client code to be able to mess with our internal state
	 *we should probably be copying this array and the elements in it, but in javascript that is not as easy as you might think
	 *@return [Vector]
	 */
	function getPoints(){
		return points;
	}
	
	/**
	 *does the calculation
	 *entry point for what our grade will be based on
	 */
	function calculate(){
		//magic
	}
	
	return {
		reset:reset,
		addPoint:addPoint,
		getPoints:getPoints,
		calculate:calculate
	};
})();