Prototype.Graphics = Class.create({
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

		this.map      = new Element('map',{style:style});
		this.map.name = this.map.identify();
    this.img      = new Element('img',{style:style, usemap:'#'+this.map.name, src:'pix.gif'});
		
    this.element  = new Element('div',{style:'position:relative;'+dimensions, className:this.options.className});
		this.element.insert(this.img).insert(this.map);
		
		// add the first layer
		this.addLayer(this);
	},
	addLayer: function(options) {
		this.layers.push(new Prototype.Graphics.Layer(this, options));
		return this.layers.last();
	},
  draw: function() {
    console.debug('Prototype.Graphics', 'draw');
    this.layers.invoke('draw');
  },
	_renderers: ['canvas','svg','vml'],
	layers: []
});

Prototype.Graphics.Coord2D = Class.create({
  initialize: function(x, y) {
    this.x = x;
    this.y = y;
  },
  toPolar: function(){}
});

Prototype.Graphics.CoordPolar = Class.create({
  initialize: function(angle, d) {
    this.angle = angle;
    this.d = d;
  },
  to2D: function(){
    return new $G.Point2D(this.d * Math.cos(this.angle), this.d * Math.sin(this.angle));
  }
});

Prototype.Graphics.Layer = Class.create({
	initialize: function(container, options){
		this.options = Object.extend(Object.extend({}, container.options), options);
		this.container = container;
		
		this.canvas = new Element('canvas', {
			style: 'position:absolute;top:0;left:0;margin:0;width:'+this.options.width+'px;height:'+this.options.height+'px;',
			width: this.options.width,
			height: this.options.height
		});
		this.container.element.insert(this.canvas);
		
		this.id = this.canvas.identify();
		
		if (Prototype.Browser.IE) {
			this.canvas = $(window.G_vmlCanvasManager.initElement(this.canvas));
		}
		this.ctx = this.canvas.getContext('2d');
		CanvasText.enable(this.ctx);

    // debug
    if (container.options.debug)
      this.ctx.drawText('Hi !! I\'m a canvas :), my ID is ['+this.id+']', 10, 15+15*container.layers.length, {color:'#666666'});

		this.groups.push(new Prototype.Graphics.Group(this));
	},
	insert: function(area){
		return this.container.map.insert(area);
	},
	groups: [],
	addShape: function(shape, group){
		group = group || this.groups.last();
	},
  draw: function() {
    console.debug('Prototype.Graphics.Layer', 'draw');
    this.groups.invoke('draw');
  }
});

Prototype.Graphics.Group = Class.create({
	initialize: function(parent, options){
  	this.options = Object.extend({}, options);
  	this.parent = parent;
    this.children = [];
  },
  draw: function() {
    console.debug('Prototype.Graphics.Group', 'draw');
    this.children.invoke('draw');
  },
	insert: function(child) {
    return this.parent.insert(child);
  }
});

Prototype.Graphics.Curve = {
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

Prototype.Graphics.Shape = {
	Interface: Class.create({ // the shape interface
		initialize: function(coords, group){
			this.group = group ? group.addShape(this) : new Prototype.Graphics.Group(this);
			this.group.parent.insert(this.area);
      
      this.coords = coords || [];
			
  	  this.getArea();
      this.observe = this.area.observe.bind(this.area);
      this.stopObserving = this.area.stopObserving.bind(this.area);
      this.fire = this.area.fire.bind(this.area);
		},
		
		getArea: function(){
			if (!this.area) {
  			this.area = new Element('area', {style:'border:none;', coords:''});
  			this.area.graphicShape = this;
			}
			return this.area;
		},
		
	  transform: function(){},
	  draw: function(){},
	  clear: function(){},
	  getArea: function(){},
	  
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

Object.extend(Prototype.Graphics.Shape, {
	Polygon: Class.create(Prototype.Graphics.Shape.Interface, {
    initialize: function($super) {
			$super();
    	//this._area.writeAttribute('shape', 'poly');
    },
  	points: [],
  	addPoint: function(p){}
  }),
  Rect: Class.create(Prototype.Graphics.Shape.Interface, {
  	initialize: function($super) {
			$super();
  		//this._area.writeAttribute('shape', 'rect');
  	}
  }),
  Circle: Class.create(Prototype.Graphics.Shape.Interface, {
  	initialize: function($super) {
			$super();
  		//this._area.writeAttribute('circle', 'circle');
  	}
  }),
  Oval: Class.create(Prototype.Graphics.Shape.Interface, {
    initialize: function($super) {
			$super();
    	//this._area.writeAttribute('shape', 'poly');
    }
  }),
  Text: Class.create(Prototype.Graphics.Shape.Interface, {
    initialize: function($super) {
			$super();
    	//this._area.writeAttribute('shape', 'rect');
    }
  })
});