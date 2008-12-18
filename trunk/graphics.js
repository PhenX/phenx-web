Prototype.Graphics = Class.create({
	initialize: function(options){
		this.options = Object.extend({
			width: 400,
			height: 250,
			className: null,
			renderer: this._renderers.first()
		}, options);
		
		var dimensions = 'height:'+this.options.height+'px;width:'+this.options.width+'px;',
		    style = 'position:absolute;top:0;left:0;margin:0;border:none;'+dimensions;
		
		this.element  = new Element('div',{style:'position:relative;'+dimensions, className:this.options.className});
		this.map      = new Element('map',{style:style});
		this.map.name = this.map.identify();
		this.img      = new Element('img',{style:style, usemap:'#'+this.map.name, src:'pix.gif'});
		this.element.insert(this.img).insert(this.map);
		
		// add the first layer
		this.layers.push(new Prototype.Graphics.Layer(this));
	},
	addLayer: function(options) {
		this.layers.push(new Prototype.Graphics.Layer(this, options));
		return this.layers.last();
	},
	_renderers: ['canvas','svg','vml'],
	layers: []
});

Prototype.Graphics.Coord2D = {
	x: null,
	y: null,
	toPolar: function(){}
};

Prototype.Graphics.CoordPolar = {
	angle: null,
	d: null,
	to2D: function(){}
};

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
		
		this.groups.push(new Prototype.Graphics.Group(this));
	},
	insert: function(area){
		return this.container.map.insert(area);
	},
	groups: [],
	addShape: function(shape, group){
		group = group || this.groups.last();
	}
});

Prototype.Graphics.Group = Class.create({
	initialize: function(parent, options){
  	this.options = Object.extend(Object.extend({}, parent.options), options);
  	this.parent = parent;
  },
	shapes: [],
	insert: this.parent.insert
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
		group: {},
		_area: {/*html map area*/},
		coords: [],
		
		initialize: function(coords, group){
			this.group = group ? group.addShape(this) : new Prototype.Graphics.Group(this);
			this.group.parent.insert(this._area);
		},
		
		getArea: function(){
			if (!this._area) {
  			this._area = new Element('area', {style:'border:none;',coords:''});
  			this._area.graphicShape = this;
			}
			return this._area;
		},
		
	  transform: function(){},
	  draw: function(){},
	  clear: function(){},
	  getArea: function(){},
	  
	  /** Like HTML Element, but doesn't apply to the map area */
		setStyle: function(){},
		setOpacity: function(){},
		hide: function(){},
		show: function(){},
		toggle: function(){},
		visible: function(){},
		remove: function(){},
	  
	  /** Event handling */
	  observe: function(){
			return this.getArea().observe.curry(this, $A(arguments));
		},
	  stopObserving: function(){
			return this.getArea().stopObserving.curry(this, $A(arguments));
		},
	  fire: function(){
			return this.getArea().fire.curry(this, $A(arguments));
		}
	})
};

Object.extend(Prototype.Graphics.Shape, {
	PolyLine: Class.create(Prototype.Graphics.Shape.Interface, {
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