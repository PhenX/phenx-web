if (!Array.prototype.indexOf) Array.prototype.indexOf = function(item, i) {
  i || (i = 0);
  var length = this.length;
  if (i < 0) i = length + i;
  for (; i < length; i++)
    if (this[i] === item) return i;
  return -1;
};

(function(){
  var ctx = CanvasRenderingContext2D,
      ctxp = ctx.prototype,

      // what is the brower's implementation ?
			moz = false;//!!ctxp.mozDrawText && !ctxp.strokeText,
      whatwg = !!ctxp.strokeText;

  if (whatwg) return;
	
	function getCSSWeightEquivalent(weight) {
		switch(weight) {
			case 'bolder':
      case 'bold':
			case '900':
			case '800':
			case '700': return 'bold';
			case '600':
			case '500':
      case '400':
			case 'normal': return 'normal';
      default: return 'light';
		}
  };
	
	getElementStyle = function(e) {
    if (window.getComputedStyle) {
      return window.getComputedStyle(e, '');
    
    } else if (e.currentStyle) {
      return e.currentStyle;
    }
  };
	
	function getXHR() {
		var methods = [
      function() {return new XMLHttpRequest()},
      function() {return new ActiveXObject('Msxml2.XMLHTTP')},
      function() {return new ActiveXObject('Microsoft.XMLHTTP')}
    ];
		if (!ctx.xhr) {
      for (i = 0; i < methods.length; i++) {
        try {
          ctx.xhr = methods[i](); 
					break;
        } 
        catch (e) {}
      }
    }
		return ctx.xhr;
	};
	
	ctx.getFaceFromStyle = function(style) {
    var face, scale, weight = getCSSWeightEquivalent(style.weight),
        familyName = style.family.toLowerCase();
        
    if (!this.faces[familyName] ||
        !this.faces[familyName][weight] ||
        !this.faces[familyName][weight][style.style]) {
      face = this.getFace(familyName, weight, style.style);
    }
    else {
      face = this.faces[familyName][weight][style.style];
    }
    if (!face) {
      throw 'Unable to load the font ['+style.family+' '+style.weight+' '+style.style+']';
      return false;
    }
		return face;
	};
	
  ctxp.font = "10px sans-serif";
  ctxp.textAlign = "start";
  ctxp.textBaseLine = "alphabetic";
	
	ctx.fallbackCharacter = " ";
	ctx.faces = {};
	ctx._styleCache = {};
	ctx.getFace = function(family, weight, style) {
		var i, libFileName = 'canvas.text.js',
		    faceName = (family+'-'+weight+'-'+style).replace(' ', '_');
		
    if (ctx.faces[family] && 
        ctx.faces[family][weight] && 
        ctx.faces[family][weight][style]) return ctx.faces[family][weight][style];
		
		if (!ctx.basePath){
			var head = document.getElementsByTagName("head")[0],
			    scripts = head.getElementsByTagName("script"), i, j, src, parts;

      for (i = 0; i < scripts.length; i++) {
        src = scripts[i].src;
        if (src.indexOf(libFileName) > 0) {
          parts = src.split("?");
          ctx.basePath = parts[0].replace(libFileName, '');
        }
      }
		}
		
		ctx.xhr = getXHR();
    ctx.xhr.open("get", ctx.basePath+faceName+'.js', false);
    ctx.xhr.send(null);
		if (ctx.xhr.status == 200) {
			window.eval(ctx.xhr.responseText);
			return ctx.faces[family][weight][style];
		}
		return false;
	};
	
	ctx.loadFace = function(data) {
    var familyName = data.familyName.toLowerCase();
    this.faces[familyName] = this.faces[familyName] || {};
    this.faces[familyName][data.cssFontWeight] = this.faces[familyName][data.cssFontWeight] || {};
    this.faces[familyName][data.cssFontWeight][data.cssFontStyle] = data;
		return data;
  };
	window._typeface_js = {faces: ctx.faces, loadFace: ctx.loadFace};
	
  ctxp.parseStyle = function(styleText) {
    styleText = styleText.replace(/^\s\s*/, '').replace(/\s\s*$/, ''); // trim
    
    if (ctx._styleCache[styleText]) return ctx._styleCache[styleText];
    
    var parts, lex = [], i, 
    // Default style
    style = {
      family: 'sans-serif',
      size: 10,
      weight: 'normal',
      style: 'normal'
    };
    
    var computedStyle = getElementStyle(this.canvas, null);
    style.size = parseFloat(computedStyle.fontSize) || style.size;
    
    var possibleValues = {
      weight: ['bold', 'bolder', 'lighter', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
      style: ['italic', 'oblique']
    };
    
    parts = styleText.match(/([\w\%]+|"[^"]+"|'[^']+')*/g);
    for(i = 0; i < parts.length; i++) {
      parts[i] = parts[i].replace(/^["|']/, '').replace(/["|']*$/, '');
      if (parts[i]) lex.push(parts[i]); 
    }
    
    style.family = lex.pop() || style.family;
    var newSize = lex.pop();
    
    // Compute the size
    var number = parseFloat(newSize);
    if (newSize.indexOf('em') != -1)
      style.size = number * style.size;
    else if(newSize.indexOf('%') != -1)
      style.size = (number / 100) * style.size;
    else if (newSize.indexOf('pt') != -1)
      style.size = number * (4/3) * style.size;
    else
      style.size = number;
    
    for (var p in possibleValues) {
      for (i = 0; i < possibleValues[p].length; i++) {
        if (lex.indexOf(possibleValues[p][i]) != -1) {
          style[p] = possibleValues[p][i];
          break;
        }
      }
    }
    
    return ctx._styleCache[styleText] = style;
  };
  
  ctxp.buildStyle = function (style) {
    return style.style+' '+style.weight+' '+style.size+'px "'+style.family.join(',')+'"';
  }

	ctxp.renderText = function(text, style) {
    var face = ctx.getFaceFromStyle(style),
		    scale = (style.size / face.resolution) * (3/4);
		
    this.beginPath();
    this.save();
		this.scale(scale, -scale);

    var i, chars = text.split('');
    for (i = 0; i < chars.length; i++) {
      this.renderGlyph(chars[i], face);
    }
		
		this.restore();
		this.closePath();
	};
	
	ctxp.renderGlyph = function(c, face) {
    var i, cpx, cpy, outline, action, glyph = face.glyphs[c];
    
		if (!glyph) return;
		
    if (glyph.o) {
      outline = glyph._cachedOutline || (glyph._cachedOutline = glyph.o.split(' '));

      for (i = 0; i < outline.length; ) {
        action = outline[i++];

        switch(action) {
          case 'm':
            this.moveTo(outline[i++], outline[i++]);
            break;
          case 'l':
            this.lineTo(outline[i++], outline[i++]);
            break;
          case 'q':
            cpx = outline[i++];
            cpy = outline[i++];
            this.quadraticCurveTo(outline[i++], outline[i++], cpx, cpy);
            break;
        }
      }
    }
    if (glyph.ha) {
      this.translate(glyph.ha, 0);
    }
	};
	
  ctxp.getTextExtents = function(text, style){
    var width = 0, 
		    height = 0, horizontalAdvance = 0, 
				face = ctx.getFaceFromStyle(style),
				i, glyph;
    
    for (i = 0; i < text.length; i++) {
      glyph = face.glyphs[text.charAt(i)] || face.glyphs[this.fallbackCharacter];
      width += Math.max(glyph.ha, glyph.x_max);
      horizontalAdvance += glyph.ha;
    }
		
    return {
      width: width,
      height: height,
      ha: horizontalAdvance
    };
  };
	
  ctxp.beginDraw = function(x, y){
    this.translate(x, y);
    this.beginPath();
  };
	
	ctxp.fillText = function(text, x, y , maxWidth){
		this.save();
    this.beginDraw(x, y);
		
    if (moz) {
      this.mozTextStyle = this.buildStyle(this.parseStyle(this.font));
      this.mozDrawText(text);
    }
		else {
			this.renderText(text, this.parseStyle(this.font));
		}
		
	  this.closePath();
	  this.fill();
	  this.restore();
	};
	
  ctxp.strokeText = function(text, x, y , maxWidth){
    this.save();
    this.beginDraw(x, y);
		
		if (moz) {
			this.mozTextStyle = this.buildStyle(this.parseStyle(this.font));
      this.mozPathText(text);
    }
		else {
			this.renderText(text, this.parseStyle(this.font));
		}
		
	  this.closePath();
    this.stroke();
    this.restore();
	};
	
	ctxp.measureText = function(text){
		var dim = {width: 0};
		if (moz) {
			this.mozTextStyle = this.buildStyle(this.parseStyle(this.font));
			dim.width = this.mozMeasureText(text);
		}
		else {
			dim = this.getTextExtents(text, this.parseStyle(this.font));
		}
		
		return dim;
	};
})();