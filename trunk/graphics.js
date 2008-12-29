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
    console.info('$G', 'draw');
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

$G.Group = Class.create({
	initialize: function(options){
  	this.options = Object.extend({}, options);
  	this.children = [];
  	this.parent = null;
  },
  draw: function(){
    console.info('$G.Group', 'draw');
    this.children.invoke('draw');
  },
	insert: function(element){
  	if (element instanceof $G.Shape.Interface || element instanceof $G.Group){
  		element.parent = this;
  		this.children.push(element);
  		console.info('$G.Group.insert()');
  	}
		return this;
	},
	getAncestor: function(){
		return this.container || this.parent.getAncestor();
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
  		this.ancestor = null;
      this.transformation = [];
      
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
  			this.area = new Element('area', {style:'cursor:pointer;', 'shape':this.areaShape, coords:this.buildAreaCoords(), href:'#1'});
  			this.area.onmousedown = this.area.onmouseup = this.area.onclick = function(){return false};
        this.area.graphicShape = this;
    	  this.getAncestor().map.insert(this.area);
			}
			return this.area;
		},
		
		getAncestor: function(){
			return this.ancestor || (this.ancestor = this.parent.getAncestor());
		},
		
		getCanvas: function(){
			return this.canvas || (this.canvas = this.parent.getCanvas());
		},
		
		buildAreaCoords: function(){},
		
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
      this.transformation.push(['translate', x, y || x]);
      return this;
    },
	  applyTransform: function(){
    	var i, ctx = this.getCanvas(), t, ts = this.transformation;
      for(i = ts.length-1; i > -1; --i) {
        t = ts[i];
        ctx[t[0]](t[1], t[2]);
      }
    },
    
    
	  draw: function(){
    	console.info('$G.Shape', 'draw');
    	$G.Style.bindToRenderer(this.style, this.getCanvas());
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
	Polygon: Class.create($G.Shape.Interface, {
    initialize: function($super, coords, style){ /* [p1{Point|Curve}, p2{Point|Curve} ... pn{Point|Curve}] */
      this.areaShape = 'poly';
      return $super(coords, style);
    },
  	addPoint: function(p){
    	this.coords.push(p);
    	return this;
    }
  }),
  Rect: Class.create($G.Shape.Interface, {
    initialize: function($super, coords, style){ /* [start{Point}, end{Point}] */
  		$super(coords, style);
      this.areaShape = 'rect';
  	},
		buildAreaCoords: function(){
  		var p = this.coords[0].to2D(), 
  		    d = this.coords[1].to2D();
			return p.x+','+p.y+','+p.x+d.x+','+p.y+d.y;
		},
  	draw: function($super){
  		var s = this.coords[0].to2D(), 
	        e = this.coords[1].to2D(),
	        ctx = this.getCanvas(),
	        style = this.style;
  		
  		ctx.save();
  		
  		$super();
  		ctx.translate(s.x, s.y);
  		this.applyTransform();
  		
  		if (style.strokeColor) ctx.strokeRect(0, 0, e.x, e.y);
  		if (style.fillColor)   ctx.fillRect(0, 0, e.x, e.y);

  		ctx.restore();
  	}
  }),
  Circle: Class.create($G.Shape.Interface, {
    initialize: function($super, coords, style){ /* [center{Point}, radius{float}] */
  	  $super(coords, style);
      this.areaShape = 'circle';
  	},
		buildAreaCoords: function(){
  		var center = this.coords[0].to2D();
			return center.toString()+','+this.coords[1];
		},
  	draw: function($super){
			var center = this.coords[0].to2D(),
			    ctx = this.getCanvas(),
	        style = this.style;
			
			ctx.save();
			$super();
  		ctx.translate(center.x, center.y);
  		this.applyTransform();
  		
			ctx.beginPath();
			ctx.arc(0, 0, this.coords[1], 0, Math.PI*2, true);
			
			if (style.strokeColor) ctx.stroke();
  		if (style.fillColor)   ctx.fill();

			ctx.restore();
  	}
  }),
  Oval: Class.create($G.Shape.Interface, {
    initialize: function($super, coords, style){ /* [p1{Point|Curve}, p2{Point|Curve} ... pn{Point|Curve}] */
      $super(coords, style);
      this.areaShape = 'poly';
    },
  }),
  Text: Class.create($G.Shape.Interface, {
    initialize: function($super, coords, style){ /* [p1{Point|Curve}, p2{Point|Curve} ... pn{Point|Curve}] */
      $super(coords, style);
      this.areaShape = 'rect';
    },
  })
});                        