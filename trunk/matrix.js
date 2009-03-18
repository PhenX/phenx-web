var Matrix = function(a, b, c, d, e, f) {
	this.a = a || 1;  this.c = c || 0;  this.e = e || 0;
	this.b = b || 0;  this.d = d || 1;  this.f = f || 0;

	this.prototype = {
		x: function(m) {
			var 
			a = this.a * m.a + this.c + m.b,
			b = this.b * m.a + this.d + m.b,
			c = this.a * m.c + this.c + m.d,
			d = this.b * m.c + this.d + m.d,
			e = this.a * m.e + this.c + m.f + this.e,
			f = this.b * m.e + this.d + m.f + this.f;
			
			this.a = a;  this.c = c;  this.e = e;
			this.b = b;  this.d = d;  this.f = f;
		},
		
		rotate: function(angle) {
			var m = new Matrix(Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0);
			this.x(m);
		},
		
		translate: function(x, y) {
			y = y || 0;
			var m = new Matrix(1, 0, 0, 1, x, y);
			this.x(m);
		},
		
		scale: function(x, y) {
			y = y || x;
			var m = new Matrix(x, 0, 0, y, 0, 0);
			this.x(m);
		},
		
		skewX: function(a) {
			var m = new Matrix(1, 0, Math.tan(a), 1, 0, 0);
			this.x(m);
		},
		
		skewY: function(a) {
			var m = new Matrix(1, Math.tan(a), 0, 1, 0, 0);
			this.x(m);
		}
	}
}

/*var SVG_TRANSFORM_UNKNOWN   = 0,
    SVG_TRANSFORM_MATRIX    = 1,
    SVG_TRANSFORM_TRANSLATE = 2,
    SVG_TRANSFORM_SCALE     = 3,
    SVG_TRANSFORM_ROTATE    = 4,
    SVG_TRANSFORM_SKEWX     = 5,
    SVG_TRANSFORM_SKEWY     = 6;

var SVGTransform = function(type, angle, matrix) {
	this.type = type || SVG_TRANSFORM_MATRIX;
	this.angle = angle;
	this.matrix = matrix;
	
	this.prototype = {
		setMatrix: function(m) {
			this.matrix = m;
			this.type = SVG_TRANSFORM_MATRIX;
		},
		setTranslate: function(x, y) {
			y = y || 0;
			this.matrix = new SVGMatrix(1, 0, 0, 1, x, y);
			this.type = SVG_TRANSFORM_TRANSLATE;
		},
		setTranslate: function(x, y) {
			y = y || 0;
			this.matrix = new SVGMatrix(1, 0, 0, 1, x, y);
			this.type = SVG_TRANSFORM_TRANSLATE;
		},
		setTranslate: function(x, y) {
			y = y || 0;
			this.matrix = new SVGMatrix(1, 0, 0, 1, x, y);
			this.type = SVG_TRANSFORM_TRANSLATE;
		}
		
		
		//   void setRotate ( float angle , float cx , float cy )   void setScale ( float sx , float sy )   void setSkewX ( float angle )   void setSkewY ( float angle )   void setTranslate ( float tx , float ty ) 
}

/*


/*  initialize: function() {
    this.m = this.getIdentity();
  },
  setCoords: function(x, y, z) {
  	this.m[0][0] = x;
  	this.m[1][1] = y;
  	this.m[2][2] = z;
  },
  getIdentity: function() {
    return [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ];
  },
  getNull: function() {
    return [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ];
  },
  multiply: function(m) {
    var result = this.getIdentity();

    for (var x = 0; x < 3; x++) {
      for (var y = 0; y < 3; y++) {
        var sum = 0;

        for (var z = 0; z < 3; z++)
          sum += this.m[x][z] * m[z][y];

        result[x][y] = sum;
      }
    }
    this.m = result;
    return this;
  },
  add: function(m) {
    var x, y, result = this.getNull();

    for (x = 0; x < 3; x++) {
      for (y = 0; y < 3; y++) {
        result[x][y] = this.m[x][y] + m[x][y];
      }
    }
    this.m = result;
    return this;
  },
  rotate: function(angle) {
    var c = Math.cos(angle), 
        s = Math.sin(angle),
        m = [
      [c,  s, 0],
      [-s, c, 0],
      [0,  0, 1]
    ];
    return this.multiply(m);
  },
  translate: function(x, y) {
    var m = [
      [1, 0, 0],
      [0, 1, 0],
      [x, y, 1]
    ];
    return this.multiply(m);
  },
  scale: function(x, y) {
    var m = [
      [x, 0, 0],
      [0, y, 0],
      [0, 0, 1]
    ];
    return this.multiply(m);
  }
});*/