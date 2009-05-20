(function(){
	function _(obj, prop, css) {
		var d, path = window._data_uri_path || 'd.php';
		if (obj[prop] && (d = obj[prop].match(css ? /^url\(data:(.*)\)/ : /^data:(.*)/))){
			d = d[1].replace(/=/g, '%3D').replace(/\//g, '%2F').replace(/\+/g, '%2B');
			if (d.length >= 2048) {
				// POST Ajax Call
			}
			else obj[prop] = (css ? 'url('+path+'?'+d+')' : path+'?'+d);
			return true;
		}
		return false;
	}
	
	var i, j, ss, tag, list, d = document,
	
	tags = {
		a: 'href',
		//img: 'src',
		object: 'data',
		link: 'href',
		script: 'src'
	};
	
	// Prefered to getElementsByTagName because it is faster
	for(i = 0; i < d.images.length; i++)
		_(d.images[i], 'src');
	
	for (tag in tags) {
		list = d.getElementsByTagName(tag);
		for(i = 0; i < list.length; i++)
			_(list[i], tags[tag]);
	}
	
	for(i = 0; i < d.styleSheets.length; i++) {
		ss = d.styleSheets[i];
		for(j = 0; j < ss.rules.length; j++)
			_(ss.rules[j].style, 'backgroundImage', 1);
	}
})();