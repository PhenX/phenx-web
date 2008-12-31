Prototype.Matrix = Class.create({
  initialize: function() {
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
});