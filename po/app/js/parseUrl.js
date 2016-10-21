(function(){
	// parseUrl
	var require = window.require || null;
    
    if(require === null) {
        console.error("非桌機版");
        return;
    }

	var request = require('request'),
		http = require('http'),
		https = require('https');

	var shorthandProperties = {
		"image": "image:url",
		"video": "video:url",
		"audio": "audio:url"
	}

	var paramRegExp = /; *([!#$%&'\*\+\-\.\^_`\|~0-9A-Za-z]+) *= *("(?:[\u000b\u0020\u0021\u0023-\u005b\u005d-\u007e\u0080-\u00ff]|\\[\u000b\u0020-\u00ff])*"|[!#$%&'\*\+\-\.\^_`\|~0-9A-Za-z]+) */g;
	var typeRegExp = /^[!#$%&'\*\+\-\.\^_`\|~0-9A-Za-z]+\/[!#$%&'\*\+\-\.\^_`\|~0-9A-Za-z]+$/;

	parseUrl = function(url, cb, options){
		getHTML(url, function(err, html){

			if (err) return cb(err);

			var domparser = new DOMParser().parseFromString(html, "text/html");
			var tmp = $(domparser).find('meta[http-equiv]');
			var obj = parsecharset(tmp.attr('content'));

			if(obj && obj.parameters && obj.parameters.charset && obj.parameters.charset.toLowerCase() == 'big5'){
				console.log("use open-graph");
				require("open-graph")( encodeURI(url), function(err, data){
					cb(null, data);
		        });
			}else{
				cb(null, parseHTML(html, options));
			}
		});
	}
	
	var getHTML = function(url, cb){
		// console.log(navigator.userAgent);
		var purl = require('url').parse(url);
		if (!purl.protocol)
			purl = require('url').parse("http://"+url);
		
		var httpModule = purl.protocol === 'https:'
			? https
			: http;
		
		url = require('url').format(purl);
		request({
			url: url,
			headers:{
				'User-Agent': navigator.userAgent
			},
			encoding: 'utf8',
			gzip: true,
			jar: true
		},function(err, res, body){
			if (err) return cb(err);
			
			if (res.statusCode === 200) {
				cb(null, body);
			}else {
				cb(new Error("Request failed with HTTP status code: "+res.statusCode));
			}
		})
	}

	var parseHTML = function(html, options){

		options = options || {};
		var domparser = new DOMParser().parseFromString(html, "text/html");
		var namespace,
			$html = $(domparser).find('html');

		var meta = {},
		metaTags = $html.find('meta'),
		description = [];

		metaTags.each(function(){
			var element = $(this);
			propertyAttr = element.attr('property');

			//不是meta og 的 description
			if (!propertyAttr || propertyAttr.substring(0,2) !== "og"){

				var name = element.attr('name');

				if( name && name.toLowerCase()=="description" ){
					description.push( element.attr('content') );
				}
				return;
			}
			
			var property = propertyAttr.substring(3),
				content = element.attr('content');

			// If property is a shorthand for a longer property,
			// Use the full property
			property = shorthandProperties[property] || property;

			var key, tmp,
			ptr = meta,
			keys = property.split(':');

			//meta og 資訊
			while (keys.length > 1) {

				key = keys.shift();
				if (Array.isArray(ptr[key])) {
					// the last index of ptr[key] should become
					// the object we are examining. 
					tmp = ptr[key].length-1; 
					ptr = ptr[key];
					key = tmp;
				}

				if (typeof ptr[key] === 'string') {
					// if it's a string, convert it
					ptr[key] = { '': ptr[key] };
				} else if (ptr[key] === undefined) {
					// create a new key
					ptr[key] = {};
				}

				// move our pointer to the next subnode
				ptr = ptr[key];
			}

			key = keys.shift();

			if (ptr[key] === undefined) {
				ptr[key] = content;
			} else if (Array.isArray(ptr[key])) {
				ptr[key].push(content);
			} else {
				ptr[key] = [ ptr[key], content ];
			}
		});

		//沒有 og 資訊
		if(Object.keys(meta).length == 0){

			var meta = {
				title: [],
				image: {url:[]},
				description: description
			}

			var titleTags = $html.find('title');
			titleTags.each(function() {
				var element = $(this);
				var propertyAttr = element.text();
				if(propertyAttr&&propertyAttr.length>0)	meta.title.push(propertyAttr);
			});

			var imgTags = $html.find('img');
			imgTags.each(function() {
				var element = $(this);
				var propertyAttr = element.attr("src");
				if(propertyAttr&&propertyAttr.length>0)	meta.image.url.push(propertyAttr);
			});
		}
		// console.log("meta: ", meta);
		return meta;

	}

	function parsecharset(string) {
	  	if(!string){
	  		return;
	  	}
	 	var index = string.indexOf(';');
		var type = index !== -1
			? string.substr(0, index).trim()
			: string.trim();
	  	var key;
	  	var match;
	  	var obj = new ContentType(type.toLowerCase());
	  	var value;

	  	paramRegExp.lastIndex = index;

	  	while (match = paramRegExp.exec(string)) {
	    	if (match.index !== index) {
	      		throw new TypeError('invalid parameter format');
	    	}

	    	index += match[0].length;
	    	key = match[1].toLowerCase();
	    	value = match[2];

		    if (value[0] === '"') {
		      // remove quotes and escapes
		    	value = value
		        .substr(1, value.length - 2)
		        .replace(qescRegExp, '$1');
		    }
	    	obj.parameters[key] = value;
		}
	  	return obj;
	}

	function ContentType(type) {
		this.parameters = Object.create(null);
		this.type = type;
	}
	
})();