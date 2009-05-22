var _ie_datauri = {
  options: {
    debug: null,
    path: 'd.php'
  },
  fixAll: function(options){
    var o = _ie_datauri.options;
    o.path = o.path || options.path;
    o.debug = o.debug || options.debug;
    
  	if (o.debug) var start = new Date().getTime();
  	
  	var i, j, k, ss, d = document,
  	styles = ['backgroundImage', 'cursor'];

  	// Stylesheets
  	for(i = 0; i < d.styleSheets.length; i++) {
  		ss = d.styleSheets[i];
  		for(j = 0; j < ss.rules.length; j++)
  			for (k = 0; k < styles.length; k++)
  				_ie_datauri.fixElement(ss.rules[j].style, styles[k], true);
  	}
  	
  	// Inline styles
  	var all = document.getElementsByTagName('*'); // document.all
  	for(i = 0; i < all.length; i++)
  		for (j = 0; j < styles.length; j++)
  			_ie_datauri.fixElement(all[i].style, styles[j], true);
  			
  	if (o.debug) {
  		var time = (new Date().getTime() - start);
  		document.getElementById(o.debug).innerHTML += time+'ms';
  	}
  },
  fixElement: function (obj, prop, css) {
    if (!css) obj.runtimeStyle.behavior = "none";
    var d, o = _ie_datauri.options;
  	if (obj[prop] && (d = obj[prop].match(css ? /^url\(data:(.*)\)$/ : /^data:(.*)$/))){
  		d = new String(d[1]).replace(/=/g, '%3D').replace(/\//g, '%2F').replace(/\+/g, '%2B');
  		if (d.length >= 2048) {
  			// POST Ajax Call
  		}
  		else obj[prop] = (css ? 'url('+o.path+'?'+d+')' : o.path+'?'+d);
  	}
  }
};
