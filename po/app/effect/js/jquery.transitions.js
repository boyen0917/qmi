$(function(){
	$(".te-wrapper").click(function(){
    	$(this).prev().trigger("click");
    });
    
    //換圖片特效
    var $navNext,
    $teWrapper,
    $teCover,
    $teImages,
    imagesCount,
    currentImg,
    $type  = $('#type-trans'),
    type  = $type.val(),
    $teTransition;
    $(".te-next").click(function(){
    	if($navNext){
        	if($navNext.data("index") == $(this).data("index")){
        		return;
        	}
    	}
        $navNext        = $(this);
        $teWrapper      = $navNext.next();
        $teCover        = $teWrapper.find('div.te-cover');
        $teImages       = $teWrapper.find('div.te-images > img');
        imagesCount     = $teImages.length;
        $teTransition   = $teWrapper.find('.te-transition');
     // requires perspective
        wPerspective    = [ 'te-flip1', 'te-flip2', 'te-flip3', 'te-flip4', 
                            'te-rotation1', 'te-rotation2', 'te-rotation3', 'te-rotation4', 'te-rotation5',
                            'te-multiflip1', 'te-multiflip2', 'te-multiflip3', 
                            'te-cube1', 'te-cube2', 'te-cube3', 'te-cube4',
                            'te-unfold1', 'te-unfold2'],
        animated        = false,
        // check for support
        hasPerspective  = Modernizr.csstransforms3d,
        init            = function() {
            $teTransition.addClass( type );
            $navNext.on( 'click', function( event ) {
            if( hasPerspective && animated )
                return false;
                animated = true;    
                showNext();
                return false;
            });
            if( hasPerspective ) {
                $teWrapper.on({
                    'webkitAnimationStart' : function( event ) {
                        $type.prop( 'disabled', true );
                    },
                    'webkitAnimationEnd'   : function( event ) {
                        $teCover.removeClass('te-hide');
                        if( $.inArray( type, wPerspective ) !== -1 )
                            $teWrapper.removeClass('te-perspective');
                        $teTransition.removeClass('te-show');
                        animated = false;
                        $type.prop( 'disabled', false );
                    }
                });
            }
            $type.on( 'change.TransitionEffects', function( event ) {
                type = $(this).val();
                $teTransition.removeClass().addClass('te-transition').addClass(type);
            });
            //when init finished  click itsself
            $navNext.trigger("click");
        },
        showNext        = function() {
            if( hasPerspective ) {
                if( $.inArray( type, wPerspective ) !== -1 ) {
                    $teWrapper.addClass('te-perspective');
                }
                $teTransition.addClass('te-show');
                $teCover.addClass('te-hide');
            }
            updateImages();
        },
        updateImages    = function() {
            var $back   = $teTransition.find('div.te-back'),
                $front  = $teTransition.find('div.te-front'),
                last_img = $teWrapper.find(".last"),
                currentImg = $teWrapper.find(".current");
            ( parseInt(currentImg.html()) === imagesCount - 1 ) ? 
                ( last_img.html(imagesCount - 1), currentImg.html(0) ) : 
                ( last_img.html(currentImg.html()), currentImg.html(parseInt( currentImg.html() )+1) );
            var $last_img   = $teImages.eq( parseInt(last_img.html()) ),
                $currentImg = $teImages.eq( parseInt(currentImg.html()) );
            $front.empty().append('<img src="' + $last_img.attr('src') + '">');
            $back.empty().append('<img src="' + $currentImg.attr('src') + '">');
            $teCover.find('img').attr( 'src', $currentImg.attr('src') );
        };
        init();
    });
    	
    //換圖片特效結束
});