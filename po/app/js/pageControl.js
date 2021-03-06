(function($) {

  var pageControl = {
    animateInterval: 300,
    history: [],
    currentID: null,
    changePage: function( id, onShow, onDone ) {
      cns.debug("[changePage] ", id, onShow);
      var tmp = $(id);
      var pc = this;
      if( tmp.length>0 ){
        if( pc.currentID ){
          var isSend = false;
          pc.history.push(pc.currentID);
          $(pc.currentID).fadeOut( pc.animateInterval);
          $(id+", "+id + " .fixed").css("display","fixed").css("margin-left","100%").show().animate({
              marginLeft: "0%",
            }, pc.animateInterval, function() {
              if( !isSend && onShow ){
                cns.debug("transition done");
                isSend = true;
                onShow();
              }
          });
        } else {
          $(id).show();
          if( onShow ) onShow();
        }
        pc.currentID = id;
      }
      $(id).data( "onDone", onDone);
    },
    popPage: function(isForward) {
      var pc = this;
      if( pc.history.length<=0 ) return;

      var oldID = pc.currentID;
      var id = pc.history.pop();
      var dom = $(id);
      pc.currentID = id;
      cns.debug("onDone");
      $(dom).fadeIn( pc.animateInterval );
      var isSend = false;
      $(oldID+", "+oldID + " .fixed").animate({
          marginLeft: "100%",
        }, pc.animateInterval, function() {
          if( !isSend ){
            isSend = true;
            $(oldID).hide();
            cns.debug("[popPage] ", id, oldID);
            var onDone = $(oldID).data( "onDone" );
            if( onDone ) onDone(isForward);
          }
      });
    },
    popAllPage: function() {
      var pc = this;
      if( pc.history.length<=0 ) return;

      var oldID = pc.currentID;
      var id = pc.history[0];
      pc.history = [];
      var dom = $(id);
      pc.currentID = id;
      cns.debug("onDone");
      $(dom).fadeIn( pc.animateInterval );
      var isSend = false;
      $(oldID+", "+oldID + " .fixed").animate({
          marginLeft: "100%",
        }, pc.animateInterval, function() {
          if( !isSend ){
            isSend = true;
            $(oldID).hide();
            cns.debug("[popPage] ", id, oldID);
            var onDone = $(oldID).data( "onDone" );
            if( onDone ) onDone(false);
          }
      });
    },
    onPageBack: null
  };

  $.changePage = function( id, onShow, onDone ){
    pageControl.changePage( id, onShow, onDone );
  }
  $.popPage = function(){
    pageControl.popPage();
  }
  $.popAllPage = function(){
    pageControl.popAllPage();
  }
  // $.setOnPageBack = function( callBack ){
  //   pageControl.onPageBack = callBack;
  // }
  $(document).ready(function(){
    $(document).on('click','.page-back',function(e){
        pageControl.popPage(false);
    });
  });
})(jQuery);