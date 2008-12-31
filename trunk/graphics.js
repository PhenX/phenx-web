Element.addMethods('area', {
	toPolyArea: function(element, coords, origin) {
	  element = $(element);
	  origin = origin || [0, 0];
	  
		var i, str = [];
		for(i = 0; i < coords.length; i++) {
			str.push(Math.floor(coords[i][0]+origin[0])+','+Math.floor(coords[i][1]+origin[1]));
		}
		
		return element.writeAttribute({
			'coords': str.join(','),
			'shape': 'poly'
		});
	}
});

var $G = Prototype.Graphics = Class.create({
	initialize: function(options){
		this.options = Object.extend({
			width: 400,
			height: 250,
			className: null,
			renderer: this._renderers.first(),
      debug: false
		}, options);
		
		var dimensions = 'height:'+this.options.height+'px;width:'+this.options.width+'px;',
		    style = 'position:absolute;top:0;left:0;margin:0;border:none;'+dimensions;

		this.map      = new Element('map',{style:dimensions});
		this.map.name = this.map.identify();
    this.img      = new Element('img',{style:style, usemap:'#'+this.map.name, src:'pix.gif'});
    this.img.onmousedown = this.img.onmouseup = this.img.onclick = function(){return false};
		
    this.element  = new Element('div',{style:'position:relative;'+dimensions, className:this.options.className});
		this.element.insert(this.img).insert(this.map);
		
		// add the first layer
		this.addLayer(this);
	},
	addLayer: function(options) {
		var layer = new $G.Layer(this, options);
		this.layers.push(layer);
		return layer;
	},
  draw: function() {
    this.layers.invoke('draw');
  },
  getLayer: function(name){
  	if (!name) return this.layers.last();
  	return this.layers.find(function(l){return l.name == name});
  },
	_renderers: ['canvas','svg','vml'],
	layers: []
});

$G.Coord2D = Class.create({
  initialize: function(x, y) {
    this.x = x;
    this.y = y;
  },
  toPolar: function(){
  	var angle, r = Math.sqrt(this.x * this.x + this.y * this.y);
  	if (r == 0) return new $G.CoordPolar(0, 0);
  	if (this.x > 0) {
  		angle = Math.atan(this.y / this.x);
  		if (this.y < 0) angle += Math.PI * 2;
  	}
  	else if (this.x == 0) {
  		angle = Math.PI / 2;
  		if (this.y < 0) angle +=  Math.PI;
  	}
  	else { // x < 0
  		angle = Math.atan(this.y / this.x) + Math.PI;
  	}
  	return new $G.CoordPolar(angle, r);
  },
  to2D: function(){
  	return this;
  },
  toString: function(){
  	return this.x+','+this.y;
  }
});

$G.CoordPolar = Class.create({
  initialize: function(angle, r) {
    this.angle = angle;
    this.r = r;
  },
  to2D: function(){
    return new $G.Coord2D(this.r * Math.cos(this.angle), this.r * Math.sin(this.angle));
  },
  toPolar: function(){
  	return this;
  }
});

/*var i, p1, p2;
for (i = 0; i < 4*Math.PI; i += Math.PI / 8) {
	p1 = new $G.CoordPolar(i, 20).to2D().toPolar();
	p2 = new $G.CoordPolar(i, 20);
	console.debug(p1.x == p2.x && p1.y == p2.y);
}*/

$G.Group = Class.create({
	initialize: function(options){
  	this.options = Object.extend({}, options);
  	this.children = [];
  	this.parent = null;
  },
  draw: function(){
    this.children.invoke('draw');
  },
	insert: function(element){
  	if (element instanceof $G.Shape.Interface || element instanceof $G.Group){
  		element.parent = this;
  		this.children.push(element);
  	}
		return this;
	},
	getLayer: function(){
		return this.container || this.parent.getLayer();
	},
	getCanvas: function(){
		return this.parent.getCanvas();
	}
});

$G.Layer = Class.create($G.Group, {
	initialize: function($super, container, options){
		$super(options);
		
		this.container = container;
		this.options = Object.extend(this.container.options, this.options);
		this.name = '';
		
		this.canvas = new Element('canvas', {
			style: 'position:absolute;top:0;left:0;margin:0;width:'+this.options.width+'px;height:'+this.options.height+'px;',
			width: this.options.width,
			height: this.options.height
		});
		this.container.img.insert({before:this.canvas});
		this.id = this.canvas.identify();
		
		if (Prototype.Browser.IE) {
			this.canvas = $(window.G_vmlCanvasManager.initElement(this.canvas));
		}
		this.ctx = this.canvas.getContext('2d');
		CanvasText.enable(this.ctx);

    // debug
    if (this.options.debug)
      this.ctx.drawText('Hi !! I\'m a canvas :), my ID is ['+this.id+']', 10, 15+15*this.container.layers.length, {color:'#000000'});
	},
	getCanvas: function(){
		return this.ctx;
	},
	getLayer: function(){
		return this;
	}
});

$G.Style = {
	bindToRenderer: function(style, renderer) {
    renderer.fillStyle = Prototype.Color.parse(style.fillColor || 'rgba(0,0,0,0)').toString();
  	renderer.strokeStyle = Prototype.Color.parse(style.strokeColor || 'rgba(0,0,0,0)').toString();
  	renderer.lineWidth = style.lineWidth;
  	renderer.lineCap = style.lineCap;
  	renderer.lineJoin = style.lineJoin;
	}
}

$G.Curve = {
	Line: {
		start: null, // start
		end: null // end
  },
  Arc: {
		center: null,
		start: null,
		end: null
  },
  Bezier: {
  	
  }
};

$G.Shape = {
	Interface: Class.create({ // the shape interface
		initialize: function(coords, style){
      this.coords = coords || [];
  		this.area = null;
  		this.canvas = null;
  		this.layer = null;
      this.transformation = [];
      this.points = [];
      
      var p2d = this.coords[0].to2D();
      this.origin = [p2d.x, p2d.y];
      
      this.style = Object.extend({
      	fillColor: null, //fillStyle
      	fillGradient: null,             //fillStyle
      	strokeColor: 'rgba(0,0,0,1)',   //strokeStyle
      	strokeGradient: null,           //strokeStyle
      	lineWidth: 1,
      	lineCap: 'butt',
      	lineJoin: 'miter'
      }, style);
		},
		
		constructArea: function(){
			if (!this.area) {
  			this.area = new Element('area', {shape:'poly', style:'cursor:pointer;', href: '#1'});
  			this.area.toPolyArea(this.calculatePoints(), this.origin);
  			this.area.onmousedown = this.area.onmouseup = this.area.onclick = function(){return false};
        this.area.graphicShape = this;
    	  this.getLayer().container.map.insert(this.area);
			}
			return this.area;
		},
		
		getLayer: function(){
			return this.layer || (this.layer = this.parent.getLayer());
		},
		
		getCanvas: function(){
			return this.canvas || (this.canvas = this.parent.getCanvas());
		},
		calculatePoints: function(){},
		
	  /** Events **/
    observe: function(eventName, handler){
    	this.constructArea().observe(eventName, handler);
      return this;
    },
    stopObserving: function(eventName, handler){
    	this.constructArea().stopObserving(eventName, handler);
      return this;
    },
    fire: function(eventName, memo){
    	this.constructArea().fire(eventName, memo);
      return this;
    },
    
    /** Transformations **/
    scale: function(x, y) {
      this.transformation.push(['scale', x, y || x]);
      return this;
    },
    rotate: function(angle) {
      this.transformation.push(['rotate', angle, null]);
      return this;
    },
    translate: function(x, y) {
      this.transformation.push(['translate', x, y]);
      return this;
    },
    // @todo: do it with a transformation matrix
    applyTransform: function(){
    	var i, tC, tA,
    	    ctx = this.getCanvas(), 
    	    ts = this.transformation;

      for(i = ts.length-1; i > -1; --i) {
        tC = ts[i];
        tA = ts[ts.length-1-i];
        
        ctx[tC[0]](tC[1], tC[2]);

        if (tA[0] == 'translate')
        	$G.Coords.translate([this.origin], tA[1], tA[2]);
        else 
        	$G.Coords[tA[0]](this.points, tA[1], tA[2]);
      }
      this.area.toPolyArea(this.points, this.origin);
    },
	  draw: function(){
    	$G.Style.bindToRenderer(this.style, this.getCanvas());
    	this.getCanvas().translate(this.origin[0], this.origin[1]);
    	this.applyTransform();
    },
	  clear: function(){},
	  
	  /** Like HTML Element */
		setStyle: function(){},
		setOpacity: function(){},
		hide: function(){},
		show: function(){},
		toggle: function(){},
		visible: function(){},
		remove: function(){}
	})
};

Object.extend($G.Shape, {
	Polyline: Class.create($G.Shape.Interface, {
		calculatePoints: function(){
  		var i, p;
  		this.points = [];
  		for(i = 1; i < this.coords.length; i++) {
  			p = this.coords[i].to2D();
  			this.points.push([p.x, p.y]);
  		}
  		console.debug(this.points);
  		return this.points;
		},
  	draw: function($super){
  		var i, 
  		    p = this.coords[1].to2D(), 
  		    ctx = this.getCanvas(),
	        style = this.style;
  		
  		ctx.save();
  		$super();

  		ctx.moveTo(p.x, p.y);
  		for(i = 2; i < this.coords.length; i++) {
  			p = this.coords[i].to2D();
  			ctx.lineTo(p.x, p.y);
  		}
  		ctx.closePath();
  		
  		if (style.fillColor)   ctx.fill();
  		if (style.strokeColor) ctx.stroke();

  		ctx.restore();
  	},
  	addLine: function(p){
    	this.coords.push(p);
    	return this;
    }
  }),
  Rect: Class.create($G.Shape.Interface, {
		calculatePoints: function(){
  		var w = this.coords[1],
  		    h = this.coords[2];
  		return this.points = [[0, 0], [0, h], [w, h], [w, 0]];
		},
  	draw: function($super){
  		var w = this.coords[1],
	        h = this.coords[2],
	        ctx = this.getCanvas(),
	        style = this.style;
  		
  		ctx.save();
  		$super();
  		
  		if (style.fillColor)   ctx.fillRect(0, 0, w, h);
  		if (style.strokeColor) ctx.strokeRect(0, 0, w, h);
  		

  		ctx.restore();
  	}
  }),
  Circle: Class.create($G.Shape.Interface, {
  	calculatePoints: function() {
  		var i, steps = 100, points = [], p = new $G.CoordPolar(0, this.coords[1]), p2d;
  		for (i = steps; i > -1; --i) {
  			p.angle += Math.PI*2/steps;
  			p2d = p.to2D();
  			points.push([p2d.x, p2d.y]);
  		}
  		return this.points = points;
  	},
  	draw: function($super){
			var ctx = this.getCanvas(),
	        style = this.style;
			
			ctx.save();
			$super();
  		
			ctx.beginPath();
			ctx.arc(0, 0, this.coords[1], 0, Math.PI*2, true);
			
			if (style.fillColor)   ctx.fill();
			if (style.strokeColor) ctx.stroke();

			ctx.restore();
  	}
  }),
  Oval: Class.create($G.Shape.Interface, {
  }),
  Text: Class.create($G.Shape.Interface, {
  })
});


$G.Coords = {
  translate: function(coords, x, y) {
    var i;
    for (i = coords.length-1; i > -1; --i) {
      coords[i][0] += x;
      coords[i][1] += y;
    }
    return coords;
  },
  scale: function(coords, x, y) {
    var i;
    y = y || x;
    for (i = coords.length-1; i > -1; --i) {
      coords[i][0] *= x;
      coords[i][1] *= y;
    }
    return coords;
  },
  rotate: function(coords, angle) {
    var i, polar;
    for (i = coords.length-1; i > -1; --i) {
      polar = new $G.Coord2D(coords[i][0], coords[i][1]).toPolar();
      polar.angle += angle;
      polar = polar.to2D();
      coords[i][0] = polar.x;
      coords[i][1] = polar.y;
    }
    return coords;
  }
}