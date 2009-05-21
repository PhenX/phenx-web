function _process_datauri(debug){
	function _(obj, prop, css) {
		var d;
		if (obj[prop] && (d = obj[prop].match(css ? /^url\(data:(.*)\)$/ : /^data:(.*)$/))){
			d = new String(d[1]).replace(/=/g, '%3D').replace(/\//g, '%2F').replace(/\+/g, '%2B');
			if (d.length >= 2048) {
				// POST Ajax Call
			}
			else obj[prop] = (css ? 'url('+o.path+'?'+d+')' : o.path+'?'+d);
			return 1;
		}
		return 0;
	}
	
	if (debug) var start = new Date().getTime();
	
	var total = 0, i, j, k, ss, tag, list, d = document, o = window._ie_datauri || {},
	
	tags = {
		a: 'href',
		img: 'src',
		object: 'data',
		link: 'href',
		script: 'src'
	},
	styles = ['backgroundImage', 'cursor'];
	
	o.path = o.path || 'd.php';
		
	// HTML tags
	for (tag in tags) {
		list = d.getElementsByTagName(tag);
		for(i = 0; i < list.length; i++)
			total += _(list[i], tags[tag]);
	}
	
	// Stylesheets
	for(i = 0; i < d.styleSheets.length; i++) {
		ss = d.styleSheets[i];
		for(j = 0; j < ss.rules.length; j++)
			for (k = 0; k < styles.length; k++)
				total += _(ss.rules[j].style, styles[k], true);
	}
	
	// Inline styles
	var all = document.getElementsByTagName('*'); // document.all
	for(i = 0; i < all.length; i++)
		for (j = 0; j < styles.length; j++)
			total += _(all[i].style, styles[j], true);
			
	if (debug) {
		var time = (new Date().getTime() - start);
		document.getElementById(debug).innerHTML += time+'ms to process '+total+' data URIs ('+(time/total).toFixed(3)+'ms per data URI)';
	}
}
