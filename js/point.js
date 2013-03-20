/**
 *Simple wraper of Sylvester vector to make them a bit more syntacticly pleaseing
 */
function Point(x,y){
	var obj = $V([x,y]);
	
	/**
	 *getter for x
	 *@return number
	 */
	obj.__defineGetter__("X", function(){
		return this.elements[0];
	});
	
	/**
	 *setter for x
	 */
	obj.__defineSetter__("X", function(val){
		this.elements[0] = val;
	});
	
	/**
	 *getter for y
	 *@return number
	 */
	obj.__defineGetter__("Y", function(){
		return this.elements[1];
	});
	
	/**
	 *setter for y
	 */
	obj.__defineSetter__("Y", function(val){
		this.elements[1] = val;
	});
	
	return obj;
}