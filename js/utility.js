Util = {
	copyPointArray : function(points){
		var ret = [];
		for(var i = 0; i<points.length; i++){
			ret.push(points[i].dup());
		}
		return ret;
	},
		
	/**
	 *given an array of 'something' find the 'thing' that is the 'most' (could be most negative, or most close to 0, you define what most means with the cmp function)
	 *@param [???] things
	 *@param function(???, ???) cmp -- comparison function, returns true when a is 'more' than b (more can be 'more small')
	 *@return index of the thing that was deemed to be the 'most'
	 */
	findExtrema : function(things, cmp){
		//these are indexes into the things array
		var most = 0;
		
		//find the extrema
		for(var i = 0; i<things.length; i++){
			if(cmp(things[i], things[most])){
				most = i;
			}
		}
		
		return most;
	},
	
	/**
	 *given a array make a function that will give the next in sequence in a loop by the given amount
	 *@param number length
	 *@param number step
	 *@return function(number) -- given an index return the next index
	 */
	makeLoopIterator : function(length, step){
		return function(index){
			//the +length followed allows for negitive numbers (note this will only support negitive steps who's magnatude is less than the length)
			//%length makes it a loop
			return (index+length+step)%length;
		};
	}
}