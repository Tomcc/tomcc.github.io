
//setup the grid
function idx(x,y) {
	return x + y * 16;
};

var startingPoints = [{x:0,y:0}, {x:0,y:1}, {x:0,y:2}, {x:0,y:3}, {x:0,y:4}, {x:0,y:5}, {x:0,y:6}, {x:0,y:7}, {x:0,y:8}, {x:0,y:9}, {x:0,y:10}, {x:0,y:11}, {x:0,y:12}, {x:0,y:13}, {x:0,y:14}, {x:0,y:15}, {x:1,y:0}, {x:1,y:15}, {x:2,y:0}, {x:2,y:15}, {x:3,y:0}, {x:3,y:15}, {x:4,y:0}, {x:4,y:15}, {x:5,y:0}, {x:5,y:15}, {x:6,y:0}, {x:6,y:15}, {x:7,y:0}, {x:7,y:15}, {x:8,y:0}, {x:8,y:15}, {x:9,y:0}, {x:9,y:15}, {x:10,y:0}, {x:10,y:15}, {x:11,y:0}, {x:11,y:15}, {x:12,y:0}, {x:12,y:15}, {x:13,y:0}, {x:13,y:15}, {x:14,y:0}, {x:14,y:15}, {x:15,y:0}, {x:15,y:1}, {x:15,y:2}, {x:15,y:3}, {x:15,y:4}, {x:15,y:5}, {x:15,y:6}, {x:15,y:7}, {x:15,y:8}, {x:15,y:9}, {x:15,y:10}, {x:15,y:11}, {x:15,y:12}, {x:15,y:13}, {x:15,y:14}, {x:15,y:15}]

function Chunk(grid) {

	this.faceVisibility = 
	[
		[1,1,1,1,1,1],
		[1,1,1,1,1,1],
		[1,1,1,1,1,1],
		[1,1,1,1,1,1],
		[1,1,1,1,1,1],
		[1,1,1,1,1,1]
	];

	this.grid = grid;

	this.floodID = 0;
	this.touchedByFlood = [];
	this.touchedByFloodCount = 0;
	this.toReplace = 1;
	this.connections = [
		[0,0,0,0],
		[0,0,0,0],
		[0,0,0,0],
		[0,0,0,0]
	];

	this.empty = false;

	this.floodFill = function(x,y) {

		if(x < 0) {
			++this.touchedByFloodCount;
			this.touchedByFlood[0] = true;
			return;
		}
		else if(x > 15){
			++this.touchedByFloodCount;
			this.touchedByFlood[1] = true;
			return;
		}
		else if(y < 0){
			++this.touchedByFloodCount;
			this.touchedByFlood[2] = true;
			return;
		}
		else if(y > 15){
			++this.touchedByFloodCount;
			this.touchedByFlood[3] = true;
			return;
		}

		var cur = this.grid[idx(x,y)];

		if(cur == this.toReplace) {
			this.grid[idx(x,y)] = this.floodID;

			this.floodFill(x+1,y);
			this.floodFill(x-1,y);
			this.floodFill(x,y+1);
			this.floodFill(x,y-1);
		}
	};

	this.updateVisibility = function() {
		this.empty = true;

		for( var i = 0; i < grid.length; ++i ) {
			if(this.grid[i] > 0)
				this.grid[i] = 1; //reset the flood fills
			
			else
				this.empty = false;
		}

		this.floodID = 2;

		this.connections = [
			[0,0,0,0],
			[0,0,0,0],
			[0,0,0,0],
			[0,0,0,0]
		];

		for( var i = 0; i < startingPoints.length; ++i ) {
			var p = startingPoints[i];

			this.toReplace = 1;
			this.touchedByFlood = [0,0,0,0];
			this.touchedByFloodCount = 0;

			this.floodFill(p.x,p.y);

			if(this.touchedByFloodCount > 1) { // it did actually touch something
				this.floodID++;

				//connect the faces
				for(var i = 0; i < 4; ++i) {
					if(this.touchedByFlood[i] > 0) {
						for(var j = 0; j < 4; ++j) {
							if(this.touchedByFlood[j] > 0) {
								this.connections[i][j] = 1;
								this.connections[j][i] = 1;
							}
						}
					}
				}
			}
			else {
				//it failed
				this.toReplace = this.floodID;
				this.floodID = 1;
				this.floodFill(p.x, p.y);
				this.floodID = this.toReplace;
			}
		}
	};

	this.toggleCell = function(pos, canvas) {

		var x = Math.floor(pos.x / canvas.width * 16);
		var y = Math.floor(pos.y / canvas.height * 16);
		
		this.grid[idx(x,y)] = (this.at(x,y) == 0 ? 1 : 0);

		this.updateVisibility();
	};
	
	this.at = function(x,y) {
		return this.grid[idx(x,y)];
	};

	this.canSee = function(face) {
		return this.connections[face.comingFrom][face.to] > 0;
	}
}
