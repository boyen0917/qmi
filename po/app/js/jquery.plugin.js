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
		if(value){
			if(typeof(value) == "object"){
				value = JSON.stringify(value);
	    	}
			localStorage[key] = value;
		}else{
			if(!localStorage[key]){
				return false;
			}
			return $.parseJSON(localStorage[key])
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
    var emojiRange = [
    	'&#(99(8[4-9]|9[0-9])|10(0[0-9]{2}|1([0-6][0-9]|7[0-5])));',
    	'&#55356;&#57(0(8[89]|9[0-9])|[12][0-9]{2}|3([0-3][0-9]|4[0-3]));',
		'&#55357;&#5(6(3[2-9][0-9]|[4-9][0-9]{2})|7([0-2][0-9]{2}|3([0-3][0-9]|4[0-3])));',
		'&#9(6(3[2-9]|[4-9][0-9])|[78][0-9]{2}|9([0-7][0-9]|8[0-3]));&#65039;'
	];
	String.prototype.replaceEmoji = function () {
		// console.debug( JSON.stringify(this) );
		return this.replace( new RegExp( emojiRange.join('|'), 'g'), function(match, contents, offset, s){
			var tmp = [];
			var n = match.lastIndexOf(";&#");
			if(n<0){
				n = match.lastIndexOf(";");
				tmp.push( parseInt(match.substring(2,n)) );
			} else {
				tmp.push( parseInt(match.substring(2,n)) );
				tmp.push( parseInt(match.substring(n+3,match.length-1)) );
			}
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
	};

	//處理未轉成網頁表示的u+code
	String.prototype.replaceOriEmojiCode = function(){
		return this.replace( new RegExp( '([\u2700-\u27BF]|[\uD800-\uDBFF][\uDC00-\uDFFF])','g'), function(match, contents, offset, s){
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
	//遇到一個utf-16的"𥚃"字...(&#55381;&#56963; 一般"裡"為&#35041;)
	//不過emoji parse出來會變框框 得另外取代
	//目前只有那個裡要取代兩次好像不是很有效率, 暫時先不套用
	var utf16Range = [	//utf16 surrogate pair range
    	'&#5(5(29[6-9]|[3-9][0-9]{2})|6([0-2][0-9]{2}|3[01][0-9]));&#5(6(3[2-9][0-9]|[4-9][0-9]{2})|7([0-2][0-9]{2}|3([0-3][0-9]|4[0-3])));'
	];
	String.prototype.replaceUtf16 = function () {
		// console.debug( JSON.stringify(this) );
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
})(jQuery);