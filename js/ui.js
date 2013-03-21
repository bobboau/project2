/**
 *module for managing UI related code, first step event handlers etc
 *using basic module patern
 *http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth
 */
var UI = (function(){
	
	/**
	 *set during init
	 *@var DOMelement -- reference to the HTML element
	 */
	var canvas = null
	
	/**
	 *set during init
	 *this is probably the single most important variable in this module
	 *@var 2dContext -- reference to the drawing context
	 */
	var context = null;
	
	/**
	 *these are a bunch of configuration values
	 *they should be constant, but js does not have an understanding of this concept
	 *so, just don't ever change them please
	 *@var object
	 */
	var config = {
		point:{//point drawing stuff
			size:5,	//displayed size (radius) of points in pixels
			stroke_style: '#000000',
			fill_style: '#FF0000',
			edge_width: 1
		},
		hull:{
			stroke_style: '#FFFF00',
			fill_style: 'none',
			edge_width: 2
		}
	}

	/**
	 *init code
	 */
	$(document).ready(
		function(){
			canvas = $('#display')[0];
			context = canvas.getContext('2d');
			
			//attach the handlers and init the system
			$('#calculate_button').click(calculate);
			$('#clear_button').click(clear);
			$('#random_button').click(random);
			$('#display').click(addPoint);
		}
	);

	/*****************************\
	|* Private Utility Functions *|
	\*****************************/
	
	/**
	 *look at the scene and make the display look like it
	 */
	function updateDisplay(){
		
		//clear what was ever there before
		context.clearRect(0, 0, canvas.width, canvas.height);
		
		//draw the convex hull
		var voronoi = Scene.getDiagram();
		if(voronoi){
			var voronoi_hull = voronoi.getConvexHullPoints();
			
			context.fillStyle = config.hull.fill_style;
			context.lineWidth = config.hull.edge_width;
			context.strokeStyle = config.hull.stroke_style;
			
			context.beginPath();
			$.each(
				voronoi_hull,
				function(i, point){
					if(i>0){
						context.lineTo(point.e(1), point.e(2));
					}
					else{
						context.moveTo(point.e(1), point.e(2));
					}
				}
			);
			context.lineTo(voronoi_hull[0].e(1), voronoi_hull[0].e(2));
			context.stroke();
		}
		
		//draw all the points
		context.fillStyle = config.point.fill_style;
		context.lineWidth = config.point.edge_width;
		context.strokeStyle = config.point.stroke_style;
				
		var points = Scene.getPoints();
		$.each(
			points,
			function(i, point){
				context.beginPath();
				context.arc(point.e(1), point.e(2), config.point.size, 0 , 2 * Math.PI, false);
				context.fill();
				context.stroke();
			}
		);
		
	}
	
	/******************\
	|* Event Handlers *|
	\******************/
	
	/**
	 *function that initializes the system back to it's starting state
	 */
	function clear(){
		Scene.reset();
		updateDisplay();
	}
	
	/**
	 *does the computation, this is where our moneymaker gets called from
	 */
	function calculate(){
		Scene.calculate();
		updateDisplay();
	}
	
	/**
	 *event handler for the canvas's onclick event
	 *@param eventObject event -- the triggering event
	 */
	function addPoint(event){
		var offset = $(event.target).offset();
		var x = event.pageX - offset.left;
		var y = event.pageY - offset.top;
		Scene.addPoint(x, y);
		updateDisplay();
	}
	
	/**
	 *adds a bunch of random points
	 */
	function random(){
		var number = prompt('How many?');
		for(var i = 0; i<number; i++){
			Scene.addPoint(
				(Math.random()*0.9+0.05)*canvas.width,  //give a 5% buffer for asthetics, its nicer if you can see the ones going off into infinity a little
				(Math.random()*0.9+0.05)*canvas.height
			);
		}
		updateDisplay();
	}
	
	/********************\
	|* public interface *|
	\********************/
	/**
	 *so far we don't need anything because so far we have been unobtrusively assigning event handlers
	 */
	return {
	};
})();