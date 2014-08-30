
//setup the grid

var startingPoints = [{x:0,y:0}, {x:0,y:1}, {x:0,y:2}, {x:0,y:3}, {x:0,y:4}, {x:0,y:5}, {x:0,y:6}, {x:0,y:7}, {x:0,y:8}, {x:0,y:9}, {x:0,y:10}, {x:0,y:11}, {x:0,y:12}, {x:0,y:13}, {x:0,y:14}, {x:0,y:15}, {x:1,y:0}, {x:1,y:15}, {x:2,y:0}, {x:2,y:15}, {x:3,y:0}, {x:3,y:15}, {x:4,y:0}, {x:4,y:15}, {x:5,y:0}, {x:5,y:15}, {x:6,y:0}, {x:6,y:15}, {x:7,y:0}, {x:7,y:15}, {x:8,y:0}, {x:8,y:15}, {x:9,y:0}, {x:9,y:15}, {x:10,y:0}, {x:10,y:15}, {x:11,y:0}, {x:11,y:15}, {x:12,y:0}, {x:12,y:15}, {x:13,y:0}, {x:13,y:15}, {x:14,y:0}, {x:14,y:15}, {x:15,y:0}, {x:15,y:1}, {x:15,y:2}, {x:15,y:3}, {x:15,y:4}, {x:15,y:5}, {x:15,y:6}, {x:15,y:7}, {x:15,y:8}, {x:15,y:9}, {x:15,y:10}, {x:15,y:11}, {x:15,y:12}, {x:15,y:13}, {x:15,y:14}, {x:15,y:15}]

var grid = 
[
	1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,
	1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,
	1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,
	1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,
	1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,
	1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,
	1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,
	1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,
	0,0,0,0,0,0,1,1,1,1,1,1,0,1,1,1,
	1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,
	1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
	1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,
	1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,
	1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,
	1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,
	1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,
];

var faceVisibility = 
[
	[1,1,1,1,1,1],
	[1,1,1,1,1,1],
	[1,1,1,1,1,1],
	[1,1,1,1,1,1],
	[1,1,1,1,1,1],
	[1,1,1,1,1,1]
]

var floodID;
var touchedByFlood = [];
var touchedByFloodCount = 0;
var toReplace = 1;

function floodFill(x,y) {

	if(x < 0) {
		++touchedByFloodCount;
		touchedByFlood[0] = true;
		return;
	}
	else if(x > 15){
		++touchedByFloodCount;
		touchedByFlood[1] = true;
		return;
	}
	else if(y < 0){
		++touchedByFloodCount;
		touchedByFlood[2] = true;
		return;
	}
	else if(y > 15){
		++touchedByFloodCount;
		touchedByFlood[3] = true;
		return;
	}

	var cur = grid[idx(x,y)];

	if(cur == toReplace) {
		grid[idx(x,y)] = floodID;

		floodFill(x+1,y);
		floodFill(x-1,y);
		floodFill(x,y+1);
		floodFill(x,y-1);
	}
}


function updateVisibility() {

	for( var i = 0; i < grid.length; ++i ) {
		if(grid[i] > 0) {
			grid[i] = 1; //reset the flood fills
		}
	}

	floodID = 2;

	var connections = [
		[0,0,0,0],
		[0,0,0,0],
		[0,0,0,0],
		[0,0,0,0]
	];

	for( var i = 0; i < startingPoints.length; ++i ) {
		var p = startingPoints[i];

		toReplace = 1;
		touchedByFlood = [0,0,0,0];
		touchedByFloodCount = 0;

		floodFill(p.x,p.y);

		if(touchedByFloodCount > 1) { // it did actually touch something
			floodID++;

			//connect the faces
			for(var i = 0; i < 4; ++i) {
				if(touchedByFlood[i] > 0) {
					for(var j = 0; j < 4; ++j) {
						if(touchedByFlood[j] > 0) {
							connections[i][j] = 1;
							connections[j][i] = 1;
						}
					}
				}
			}
		}
		else {
			//it failed
			toReplace = floodID;
			floodID = 1;
			floodFill(p.x, p.y);
			floodID = toReplace;
		}
	}

	return connections;
}

function toggleCell(pos) {

	var x = Math.floor(pos.x / canvas.width * 16);
	var y = Math.floor(pos.y / canvas.height * 16);
	
	grid[idx(x,y)] = (grid[idx(x,y)] == 0 ? 1 : 0);

	return updateVisibility();
}