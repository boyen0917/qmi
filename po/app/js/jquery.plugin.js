(function($) {

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
})(jQuery);