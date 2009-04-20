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
		
		this.element  = new Element('div',{height:this.options.height, width:this.options.width, style:'position:relative;'+dimensions, className:this.options.className});
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
	toElement: function(){
		return this.element;
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
			if (this.y < 0) angle +=	Math.PI;
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
	},
	toArray: function(){
		return [this.x, this.y];
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
		this.children.invoke('draw');
	},
	insert: function(element){
		if (element instanceof $G.Shape.Base || element instanceof $G.Group){
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
		
		this.canvas = $(document.createElement('canvas'));
    this.canvas.writeAttribute({
      style: 'position:absolute;top:0;left:0;margin:0;width:'+this.options.width+'px;height:'+this.options.height+'px;',
      width: this.options.width,
      height: this.options.height
		});
		this.container.img.insert({before:this.canvas});
		this.id = this.canvas.identify();

    if (Prototype.Browser.IE)
      window.G_vmlCanvasManager.initElement(this.canvas);
      
		this.ctx = this.canvas.getContext('2d');

		// debug
		if (this.options.debug)
			this.ctx.drawText('Hi !! I\'m a canvas :), my ID is ['+this.id+']', 10, 15+15*this.container.layers.length, {color:'#000000'});
	},
	getCanvas: function(){
		return this.ctx;
	},
	getLayer: function(){
		return this;
	},
	clear: function(){
		this.ctx.clearRect(0, 0, this.options.width, this.options.height);
		return this;
	}
});

$G.Style = {
	bindToRenderer: function(renderer, style) {
		style = Object.extend(Object.clone($G.Style.base), style || {});
		
		renderer.fillStyle = Prototype.Color.parse(style.fillColor).toString();
		renderer.strokeStyle = Prototype.Color.parse(style.strokeColor).toString();
		renderer.lineWidth = style.lineWidth;
		renderer.lineCap = style.lineCap;
		renderer.lineJoin = style.lineJoin;
	}, 
	base: {
		fillColor: null,
		fillGradient: null,
		strokeColor: 'rgb(0,0,0)',
		strokeGradient: null,
		lineWidth: 1,
		lineCap: 'round',
		lineJoin: 'miter'
	}
};

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
	Base: Class.create({
		initialize: function(){
			this.coords = $A(arguments) || [];
			this.area = null;
			this.canvas = null;
			this.layer = null;
			this.transformation = [];
			this.points = [];
			
			var p = this.coords[0].to2D ? this.coords[0].to2D().toArray() : this.coords[0];
			this.origin = p;
			
			this.style = Object.clone($G.Style.base);
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
		
		getCanvas: function(layer){
			if (layer) return layer.getCanvas();
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
		applyTransform: function(layer){
			var i, tC, tA,
			    ctx = this.getCanvas(layer), 
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
			if (this.area) this.area.toPolyArea(this.points, this.origin);
		},
		draw: function(layer, style){
			$G.Style.bindToRenderer(this.getCanvas(layer), style);
			this.getCanvas(layer).translate(this.origin[0], this.origin[1]);
			this.applyTransform(layer);
		},
		clear: function(){
			return this;
		},
		
		/** Like HTML Element */
		setStyle: function(style){
			Object.extend(this.style, style);
			return this;
		},
		setOpacity: function(){},
		hide: function(){},
		show: function(){},
		toggle: function(){},
		visible: function(){},
		remove: function(){}
	})
};

Object.extend($G.Shape, {
	Polyline: Class.create($G.Shape.Base, {
		calculatePoints: function(){
			var i, p;
			this.points = [];
			for(i = 1; i < this.coords.length; i++) {
				p = this.coords[i].to2D ? this.coords[i].to2D().toArray() : this.coords[i];
				this.points.push(p);
			}
			return this.points;
		},
		draw: function($super, layer, style){
			var i, p = this.coords[1].to2D ? this.coords[1].to2D().toArray() : this.coords[1], 
			    ctx = this.getCanvas(layer);
				
			style = style || this.style;
			
			ctx.save();
			$super(layer, style);
			
			ctx.beginPath();
			ctx.moveTo(p[0], p[1]);
			for(i = 2; i < this.coords.length; i++) {
				p = this.coords[i].to2D ? this.coords[i].to2D().toArray() : this.coords[i];
				ctx.lineTo(p[0], p[1]);
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
	Rect: Class.create($G.Shape.Base, {
		calculatePoints: function(){
			var w = this.coords[1],
			    h = this.coords[2];
			return this.points = [[0, 0], [0, h], [w, h], [w, 0]];
		},
		draw: function($super, layer, style){
			var w = this.coords[1],
			    h = this.coords[2],
			    ctx = this.getCanvas(layer);

			style = style || this.style;
			
			ctx.save();
			$super(layer, style);
			
			if (style.fillColor)   ctx.fillRect(0, 0, w, h);
			if (style.strokeColor) ctx.strokeRect(0, 0, w, h);

			ctx.restore();
		}
	}),
	Circle: Class.create($G.Shape.Base, {
		calculatePoints: function() {
			var i, steps = 50, points = [], p = new $G.CoordPolar(0, this.coords[1]), p2d;
			for (i = steps; i > -1; --i) {
				p.angle += Math.PI*2/steps;
				p2d = p.to2D();
				points.push([p2d.x, p2d.y]);
			}
			return this.points = points;
		},
		draw: function($super, layer, style){
			var ctx = this.getCanvas(layer);
			style = style || this.style;
			
			ctx.save();
			$super(layer, style);
			
			ctx.beginPath();
			ctx.arc(0, 0, this.coords[1], 0, Math.PI*2, true);
			ctx.closePath();
			
			if (style.fillColor)   ctx.fill();
			if (style.strokeColor) ctx.stroke();

			ctx.restore();
		}
	}),
	Oval: Class.create($G.Shape.Base, {}),
	Text: Class.create($G.Shape.Base, {})
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