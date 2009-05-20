(function(){
  var data = new Image();
  data.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
  data.onload = data.onerror = function(){
    window._data_uri_supported = (this.width == 1 && this.height == 1);
  }
})();

function URLDecode(str) {
  var str, binVal, thisString;
  while ((match = /(%[^%]{2})/.exec(str)) != null
             && match.length > 1
             && match[1]) {
    binVal = parseInt(match[1].substr(1), 16);
    thisString = String.fromCharCode(binVal);
    str = str.replace(match[1], thisString);
  }
  return str;
}

function setDataUri(element, attribute) {
  var d;
  if (element[attribute] && (d = element[attribute].match(/^data:(.*)/))){
    var data = d[1].replace('=', '%3D');
    if (data.length >= 2048) {
      // POST Ajax Call
    }
    else element[attribute] = 'd.php?'+data;
    return true;
  }
  return false;
}

function processDataUri(){
  var i, list;
  for(i = 0; i < document.images.length; i++)
    setDataUri(document.images[i], 'src');
    
  list = document.getElementsByTagName('a');
  for(i = 0; i < list.length; i++)
    setDataUri(list[i], 'href');
}

/*if (!window._data_uri_supported){
  document.write('<script type="text/javascript" id="_dom_ready_script" defer="defer" src="javascript:void(0)"><\/script>');
  var script = document.getElementById("_dom_ready_script");
  script.onreadystatechange = function(){
    if (this.readyState == "complete") processDataUri();
  }
}*/
window.onload = processDataUri;