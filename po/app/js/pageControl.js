(function($) {

  var pageControl = {
    animateInterval: 1000,
    history: [],
    currentID: null,
    changePage: function( id, onShow, onDone ) {
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
    popPage: function() {
      var pc = this;
      if( pc.history.length<=0 ) return;

      var oldID = pc.currentID;
      var id = $(pc.history.pop());
      pc.currentID = id;
      $(id).fadeIn( pc.animateInterval );
      $(oldID+", "+oldID + " .fixed").animate({
          marginLeft: "100%",
        }, pc.animateInterval, function() {
          $(oldID).hide();
          cns.debug("onDone");
          var onDone = $(oldID).data( "onDone" );
          if( onDone ) onDone(false);
      });
    },
    onPageBack: null
  };

  $.changePage = function( id, onShow, onDone ){
    pageControl.changePage( id, onShow, onDone );
  }
  // $.setOnPageBack = function( callBack ){
  //   pageControl.onPageBack = callBack;
  // }
  $(document).ready(function(){
    $(document).on('click','.page-back',function(e){
        pageControl.popPage();
    });
  });
})(jQuery);