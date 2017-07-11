(function($) {

	$.fn.htmlEntities = function(str) {
    	var encodeHtmlEntity = function(str) {
    		var escape_list = {"10":"\n"};
		  	var buf = [];
		  	for (var i=str.length-1;i>=0;i--) {
			  	var char_code = str[i].charCodeAt();
			  	if(escape_list.char_code){
				    buf.unshift(escape_list.char_code);
				}else{
					buf.unshift(['&#', char_code, ';'].join(''));
				}
			 }
		  return buf.join('');
		};

		var html_entities = encodeHtmlEntity(str);

	    return this.each(function() {
	    	$(this).html(html_entities);
	    });
	};
    

	//localstorage for object
    $.lStorage = function(key,value) {
    	if(key === undefined) return false;

    	if( 0==key.indexOf("U") ){
    		if(value){
				QmiGlobal.groups = value;
			}else{
				return QmiGlobal.groups;
			}
    	} else {
			if(value || value === false){
				if(typeof(value) == "object") value = JSON.stringify(value);
				
				localStorage[key] = value;
			}else{
				if(!localStorage[key]) return false;

				try {
					return $.parseJSON(localStorage[key]);
				} catch(e) {
					return localStorage[key];
				}
			}
		}
    };
    
    //get url query string
    $.extend({
        getUrlVars: function(){
          var vars = [], hash;
          var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
          for(var i = 0; i < hashes.length; i++)
          {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
          }
          return vars;
        },
        getUrlVar: function(name){
          return $.getUrlVars()[name];
        }
      });
    
    //time format
    Date.prototype.customFormat = function(formatString){
	    var YYYY,YY,MMMM,MMM,MM,M,DDDD,DDD,DD,D,hhh,hh,h,mm,m,ss,s,ampm,AMPM,dMod,th;
	    var dateObject = this;
	    YY = ((YYYY=dateObject.getFullYear())+"").slice(-2);
	    MM = (M=dateObject.getMonth()+1)<10?('0'+M):M;
	    MMM = (MMMM=["January","February","March","April","May","June","July","August","September","October","November","December"][M-1]).substring(0,3);
	    DD = (D=dateObject.getDate())<10?('0'+D):D;
	    DDD = (DDDD=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dateObject.getDay()]).substring(0,3);
	    CD=["星期天","星期一","星期二","星期三","星期四","星期五","星期六"][dateObject.getDay()];
	    th=(D>=10&&D<=20)?'th':((dMod=D%10)==1)?'st':(dMod==2)?'nd':(dMod==3)?'rd':'th';
	    formatString = formatString.replace("#YYYY#",YYYY).replace("#YY#",YY).replace("#MMMM#",MMMM).replace("#MMM#",MMM).replace("#MM#",MM).replace("#M#",M).replace("#CD#",CD).replace("#DDDD#",DDDD).replace("#DDD#",DDD).replace("#DD#",DD).replace("#D#",D).replace("#th#",th);

	    h=(hhh=dateObject.getHours());
	    if (h==0) h=24;
	    if (h>12) h-=12;
	    hh = h<10?('0'+h):h;
	    AMPM=(ampm=hhh<12?'am':'pm').toUpperCase();
	    mm=(m=dateObject.getMinutes())<10?('0'+m):m;
	    ss=(s=dateObject.getSeconds())<10?('0'+s):s;
	    return formatString.replace("#hhh#",hhh).replace("#hh#",hh).replace("#h#",h).replace("#mm#",mm).replace("#m#",m).replace("#ss#",ss).replace("#s#",s).replace("#ampm#",ampm).replace("#AMPM#",AMPM);
	}

	Array.prototype.last = function(){
        return this[this.length - 1];
    };

    Array.prototype.unique = function(a){
		return function(){ return this.filter(a) }
    }(function(a,b,c){ return c.indexOf(a,b+1) < 0 });

    /*
    find & parse emoji to image
    */
 //    var emojiRange = [
 //    	'&#55356;&#57(0(8[89]|9[0-9])|[12][0-9]{2}|3([0-3][0-9]|4[0-3]));',
	// 	'&#55357;&#5(6(3[2-9][0-9]|[4-9][0-9]{2})|7([0-2][0-9]{2}|3([0-3][0-9]|4[0-3])));',
	// 	'&#9(6(3[2-9]|[4-9][0-9])|[78][0-9]{2}|9([0-7][0-9]|8[0-3]));&#65039;',
	// 	'&#(99(8[4-9]|9[0-9])|10(0[0-9]{2}|1([0-6][0-9]|7[0-5])));&#65039;',
 //    	'&#(11(0(0[89]|[1-9][0-9])|1[0-9]{2}|2([0-5][0-9]|6[0-3])));&#65039;'
	// ];

	// var emojiRegex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
	var emojiRegex = (/\uD83D\uDC69(?:\u200D(?:(?:\uD83D\uDC69\u200D)?\uD83D\uDC67|(?:\uD83D\uDC69\u200D)?\uD83D\uDC66)|\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC69\u200D(?:\uD83D\uDC69\u200D)?\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69\u200D(?:\uD83D\uDC69\u200D)?\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]\uFE0F|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92])|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC6F\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3C-\uDD3E\uDDD6-\uDDDF])\u200D[\u2640\u2642]\uFE0F|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF6\uD83C\uDDE6|\uD83C\uDDF4\uD83C\uDDF2|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uFE0F\u200D[\u2640\u2642]|(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642])\uFE0F|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2695\u2696\u2708]|\uD83D\uDC69\u200D[\u2695\u2696\u2708]|\uD83D\uDC68(?:(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708]))\uFE0F|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83D\uDC69\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69]))|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|[#\*0-9]\uFE0F\u20E3|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67)\uDB40\uDC7F|\uD83D\uDC68(?:\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:(?:\uD83D[\uDC68\uDC69])\u200D)?\uD83D\uDC66\u200D\uD83D\uDC66|(?:(?:\uD83D[\uDC68\uDC69])\u200D)?\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92])|(?:\uD83C[\uDFFB-\uDFFF])\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]))|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270A-\u270D]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC70\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDCAA\uDD74\uDD7A\uDD90\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD36\uDDD1-\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC68(?:\u200D(?:(?:(?:\uD83D[\uDC68\uDC69])\u200D)?\uD83D\uDC67|(?:(?:\uD83D[\uDC68\uDC69])\u200D)?\uD83D\uDC66)|\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC69\uDC6E\uDC70-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD18-\uDD1C\uDD1E\uDD1F\uDD26\uDD30-\uDD39\uDD3D\uDD3E\uDDD1-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])?|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDEEB\uDEEC\uDEF4-\uDEF8]|\uD83E[\uDD10-\uDD3A\uDD3C-\uDD3E\uDD40-\uDD45\uDD47-\uDD4C\uDD50-\uDD6B\uDD80-\uDD97\uDDC0\uDDD0-\uDDE6])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u2660\u2663\u2665\u2666\u2668\u267B\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEF8]|\uD83E[\uDD10-\uDD3A\uDD3C-\uDD3E\uDD40-\uDD45\uDD47-\uDD4C\uDD50-\uDD6B\uDD80-\uDD97\uDDC0\uDDD0-\uDDE6])\uFE0F/g);
    var emojiRange2 = [
    	'&#(99(8[4-9]|9[0-9])|10(0[0-9]{2}|1([0-6][0-9]|7[0-5])));'
    ]

    String.prototype.replaceEmoji = function () {

		function toCodePoint(unicodeSurrogates, sep) {
		    var r = [],
		      	c = 0,
		      	p = 0,
		      	index = 0;

		    while (index < unicodeSurrogates.length) {
		      	c = unicodeSurrogates.charCodeAt(index++);

		      	if (p) {
		        	r.push((0x10000 + ((p - 0xD800) << 10) + (c - 0xDC00)).toString(16));
		        	p = 0;
		      	} else if (0xD800 <= c && c <= 0xDBFF) {
		        	p = c;
		     	} else {
		     		if (c !== 0x200D) {
		  				r.push(c.toString(16));
		     		}
		      	}
		    }
		    return r.join(sep || '-');
		 }

		return this.replace(emojiRegex, function(match, offset, contents) {
    		return "<img style='max-height:20px' class='emoji' src='../images/emojis/" + 
    			toCodePoint(match) + ".png' alt='" + match + "' " + 
    			"onerror=emojiImgError(this) />";
		});
	};

	// String.prototype.replaceEmoji = function () {
	// 	return this + "";
	// 	// cns.debug( JSON.stringify(this) );
	// 	return this + "";
	// 	var tmpString = this.replace( new RegExp( emojiRange.join('|'), 'g'), function(match, contents, offset, s){
	// 		var tmp = [];
	// 		var n = match.lastIndexOf(";&#");
	// 		if(n<0){
	// 			n = match.lastIndexOf(";");
	// 			tmp.push( parseInt(match.substring(2,n)) );
	// 		} else {
	// 			tmp.push( parseInt(match.substring(2,n)) );
	// 			tmp.push( parseInt(match.substring(n+3,match.length-1)) );
	// 		}
	// 		if( tmp[0] >= 55296 ){
	// 			var oriCode = 0xffffffff;
	// 			oriCode = ((tmp[0]-55296)<<10)>>>0;
	// 			var vl=(tmp[1]-56320)>>>0;
	// 			oriCode = (oriCode | vl | 0x10000);
	// 			return "<img style='max-height:20px' class='emoji' src='../images/emojis/" + oriCode.toString(16) + ".png' alt='emoji' />";
	// 		} else {
	// 			return "<img style='max-height:20px' class='emoji' src='../images/emojis/" + tmp[0].toString(16) + ".png' alt='emoji' />";
	// 		}
	// 		return match;
	// 	});
		
	// 	return tmpString = tmpString.replace( new RegExp( emojiRange2.join('|'), 'g'), function(match, contents, offset, s){
	// 		var n = match.lastIndexOf(";");
	// 		var tmp = parseInt(match.substring(2,n));
	// 		return "<img style='max-height:20px' class='emoji' src='../images/emojis/" + tmp.toString(16) + ".png' alt='emoji' />";
	// 	});
	// };

	//處理未轉成網頁表示的u+code
	String.prototype.replaceOriEmojiCode = function(){
		return this + "";
		return this.replace( new RegExp( '([\u2B00-\u2BFF]\ufe0f|([\u2600-\u26FF])|([\u2700-\u27BF]$)|[\uD800-\uDBFF][\uDC00-\uDFFF])','g'), function(match, contents, offset, s){
			var tmp = [];
			tmp.push( match.charCodeAt(0) );
			tmp.push( match.charCodeAt(1) );
			if( tmp[0] >= 55296 ){
				var oriCode = 0xffffffff;
				oriCode = ((tmp[0]-55296)<<10)>>>0;
				var vl=(tmp[1]-56320)>>>0;
				oriCode = (oriCode | vl | 0x10000);
				return "<img style='max-height:20px' class='emoji' src='../images/emojis/" + oriCode.toString(16) + ".png' alt='emoji' />";
			} else {
				return "<img style='max-height:20px' class='emoji' src='../images/emojis/" + tmp[0].toString(16) + ".png' alt='emoji' />";
			}
			return match;
		});
	}

	//glorialin
	//遇到一個utf-16的"𥚃"字...(&#55381;&#56963; 一般"裡"為&#35041; &#55389;&#56919;祐)
	//不過emoji parse出來會變框框 得另外取代
	//目前只有那個裡要取代兩次好像不是很有效率, 暫時先不套用
	var utf16Range = [	//utf16 surrogate pair range
    	'&#5(5(29[6-9]|[3-9][0-9]{2})|6([0-2][0-9]{2}|3[01][0-9]));&#5(6(3[2-9][0-9]|[4-9][0-9]{2})|7([0-2][0-9]{2}|3([0-3][0-9]|4[0-3])));'
	];
	String.prototype.replaceUtf16 = function () {
		// cns.debug( JSON.stringify(this) );
		return this.replace( new RegExp( emojiRange.join('|'), 'g'), function(match, contents, offset, s){
			var tmp = [];
			var n = match.lastIndexOf(";&#");
			tmp.push( parseInt(match.substring(2,n)) );
			tmp.push( parseInt(match.substring(n+3,match.length-1)) );
			var oriCode = 0xffffffff;
			oriCode = ((tmp[0]-55296)<<10)>>>0;
			var vl=(tmp[1]-56320)>>>0;
			oriCode = (oriCode | vl | 0x10000);
			return String.fromCharCode( tmp[0],tmp[1] );
		});
	};

	String.prototype.format = function() {
		var args = arguments;
		return this.replace(/{(\d+)}/g, function(match, number) { 
			return typeof args[number] != 'undefined'
				? args[number]
				: match
			;
		});
	};

	String.prototype.startsWith = function (str){
		return this.indexOf(str) == 0;
	};

	String.prototype.parseHtmlString = function () {
    	return this.replace(/&#([0-9]{1,5});/gi, function(match, numStr) {
	        var num = parseInt(numStr, 10); // read num as normal number
	        return String.fromCharCode(num);
	    });
	}
})(jQuery);