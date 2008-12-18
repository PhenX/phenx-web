var $G = Prototype.Graphics = Class.create({
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
		
		this.layers.push(new $G.Layer(this));
	},
	_renderers: ['canvas','svg','vml'],
	layers: []
});

var $G2d = $G.Point2D = {
	x: null,
	y: null,
	toPolar: function(){}
};

var $Gpol = $G.PointPolar = {
	angle: null,
	d: null,
	to2D: function(){}
};

$G.Layer = Class.create({
	initialize: function(parent, options){
		this.options = Object.extend(Object.extend({}, parent.options), options);
		this.container = parent;
		
		this.canvas = new Element('canvas',{style:'position:absolute;top:0;left:0;margin:0;height:'+this.options.height+'px;width:'+this.options.width+'px;'});
		this.id = this.canvas.identify();
		this.ctx = this.canvas.getContext('2d');
		if (Prototype.IE) {
			this.ctx = $(window.G_vmlCanvasManager.initElement(this.ctx));
		}
		
		this.groups.push(new $G.Group(this));
		this.container.element.insert(this.canvas);
	},
	insert: function(area){
		return this.container.map.insert(area);
	},
	groups: [],
	addShape: function(shape, group){
		group = group || this.groups.last();
		
	}
});

$G.Group = Class.create({
	initialize: function(parent, options){
  	this.options = Object.extend(Object.extend({}, parent.options), options);
  	this.parent = parent;
  },
	shapes: [],
	insert: this.parent.insert
});

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
  	
  },
  Text: {}
};

$G.Shape = {
	Interface: Class.create({ // the shape interface
		group: {},
		_area: {/*html map area*/},
		coords: [],
		
		initialize: function(coords, group){
			this.group = group ? group.addShape(this) : new $G.Group(this);
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
	  observe: getArea().observe,
	  stopObserving: getArea().stopObserving,
	  fire: getArea().fire
	})
};

Object.extend($G.Shape, {
	PolyLine: Class.create($G.Shape.Interface, {
    initialize: function($super) {
			$super();
    	//this._area.writeAttribute('shape', 'poly');
    },
  	points: [],
  	addPoint: function(p){}
  }),
  Rect: Class.create($G.Shape.Interface, {
  	initialize: function($super) {
			$super();
  		//this._area.writeAttribute('shape', 'rect');
  	}
  }),
  Circle: Class.create($G.Shape.Interface, {
  	initialize: function($super) {
			$super();
  		//this._area.writeAttribute('circle', 'circle');
  	}
  }),
  Oval: Class.create($G.Shape.Interface, {
    initialize: function($super) {
			$super();
    	//this._area.writeAttribute('shape', 'poly');
    }
  })
});