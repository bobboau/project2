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
	 *@var object {left:Line, right:Line, top:Line, bottom:Line}
	 */
	var borders = {};
	
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
		},
		face:{
			stroke_style: '#000000',
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
			context.scale(1,-1);
			context.translate(0, -canvas.height);
			
			//attach the handlers and init the system
			$('#calculate_button').click(calculate);
			$('#clear_button').click(clear);
			$('#random_button').click(random);
			$('#import_button').click(importPoints);
			$('#export_button').click(exportPoints);
			$('#display').click(addPoint);
			$('#display').mousemove(displayPoint);
			
			borders = {
				left:$L( $V([0,0,0]), $V([0,1,0])),
				right:$L( $V([canvas.width,canvas.height,0]), $V([0,-1,0])),
				top:$L( $V([0,canvas.height,0]), $V([1,0,0])),
				bottom:$L( $V([canvas.width,0,0]), $V([-1,0,0]))
			};
			
			borders.left.next = borders.top;
			borders.top.next = borders.right;
			borders.right.next = borders.bottom;
			borders.bottom.next = borders.left;
		}
	);

	/*****************************\
	|* Private Utility Functions *|
	\*****************************/
	
	/**
	 *given a line find the canvas border line that has an intersection
	 *@param Line line
	 *@return Line
	 */
	function getCanvasIntersectionLine(line){
		
		var x_line;
		if(line.direction.e(1) < 0){
			//left
			x_line = borders.left;
		}
		else
		{
			//right
			x_line = borders.right;
		}
		
		var y_line;
		if(line.direction.e(2) < 0){
			//bottom
			y_line = borders.bottom;
		}
		else
		{
			//top
			y_line = borders.top;
		}
		
		var x_dist = line.intersectionDistanceWith(x_line);
		var y_dist = line.intersectionDistanceWith(y_line);
		if(x_dist < y_dist){
			return x_line;
		}else
		{
			return y_line;
		}
	}
	
	/**
	 *look at the scene and make the display look like it
	 */
	function updateDisplay(){
		
		//clear what was ever there before
		context.clearRect(0, 0, canvas.width, canvas.height);
		
		var voronoi = Scene.getDiagram();
		if(voronoi){
			//draw the convex hull
			var voronoi_hull = voronoi.getConvexHullPoints();
			
			if(voronoi_hull.length > 0){
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
			
			context.fillStyle = config.face.fill_style;
			context.lineWidth = config.face.edge_width;
			context.strokeStyle = config.face.stroke_style;
			//draw the faces
			for(var i = 0; i<voronoi.getFaceCount(); i++){
//context.clearRect(0, 0, canvas.width, canvas.height);
				context.beginPath();
				var face = voronoi.getFace(i);
				var edge = face.getFirstEdge();
				if(!edge.isValid()){
					continue;
				}
				
				//to start things off we need to move to the intersection of the first line and the line before it
				var line = edge.getLine();
				var last_line = edge.getPrev().getLine();
				if(!edge.prevIntersects()){
					//if the last edge is across an unbounded segment then we need to use the border instead
					last_line = getCanvasIntersectionLine(edge.getLine().reverseLine());
				}
				var point = last_line.intersectionWith(line);
				context.moveTo(point.e(1), point.e(2));

				var quit = false;
				var quit_next_time = edge.isLast();
				last_line = line;
				edge = edge.getNext();
				
				
				//each iteration of this loop draws from the last line to the curent line
				while(!quit){
					//before we do anything we need to handle border intersections
					if(!edge.prevIntersects()){
						//if the previous edge does not intersect we need to draw part of the border
						//first draw from the last line to the border edge it intersects
						border_line = getCanvasIntersectionLine(last_line);
						var point = last_line.intersectionWith(border_line);
						context.lineTo(point.e(1), point.e(2));
//context.stroke();
						last_line = border_line;
						
						//now find which border we intersect with
						border_line = getCanvasIntersectionLine(edge.getLine().reverseLine());
						//if we dont intersect with the same line then we have to draw from the last border to this border
						while(border_line != last_line){
							var point = last_line.intersectionWith(last_line.next);
							context.lineTo(point.e(1), point.e(2));
//context.stroke();
							last_line = last_line.next;
						}
					}
					
					//get the current line
					line = edge.getLine();
					var point = last_line.intersectionWith(line);
					context.lineTo(point.e(1), point.e(2));
//context.stroke();
					last_line = line;
					quit = quit_next_time;
					quit_next_time = edge.isLast();
					edge = edge.getNext();
				}
				
				context.stroke();
			}
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
		Scene.addPoint(x, canvas.width-y);
		updateDisplay();
	}
	
	/**
	 *event handler for the canvas's mousemove event
	 *@param eventObject event -- the triggering event
	 */
	function displayPoint(event){
		var offset = $(event.target).offset();
		var x = event.pageX - offset.left;
		var y = event.pageY - offset.top;
		$('#coords_x').text(x);
		$('#coords_y').text(canvas.width-y);
	}
	
	/**
	 *allows the textual input of points
	 */
	function importPoints(){
		var points = JSON.parse($("#import_input").val());
		$.each(
			points,
			function(idx, point){
				Scene.addPoint(point[0], point[1]);
			}
		);
		updateDisplay();
	}
	
	/**
	 *allows the textual input of points
	 */
	function exportPoints(){
		var points = Scene.getPoints();
		var export_points = [];
		$.each(
			points,
			function(idx, point){
				export_points.push([point.e(1),point.e(2)]);
			}
		);
		$("#export_output").text(JSON.stringify(export_points));
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
