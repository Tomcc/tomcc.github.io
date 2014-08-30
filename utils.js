
function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
}

function lerp(a, b, s) {
	return a*(1-s) + b*s;
}

var CP = window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype;
if (CP && CP.lineTo){
  CP.dashedLine = function(x,y,x2,y2,dashArray){
  	
  		var len = Math.sqrt( Math.pow(x-x2, 2) + Math.pow(y-y2, 2) );
  		var dash = dashArray[0] / len;
  		var space = dashArray[1] / len;

  		var ran = 0;
  		var isDash = false;
  		while(ran < 1) {
  			if(isDash)
  				ran += dash;
  			else
  				ran += space;

  			if(ran > 1)
  				ran = 1;

  			var x1 = lerp(x,x2, ran);
  			var y1 = lerp(y,y2, ran);

  			if(isDash)
  				this.lineTo(x1,y1);
  			else
  				this.moveTo(x1,y1)

  			isDash = !isDash;
  		}    
  	}
}
