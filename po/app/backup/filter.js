//filter開合
$(".st-filter-list").click(function(){
     //全關 再開按到的 有內容的按了開再按就關 沒內容的開了馬上關 所以才一直重複開關..
     //關閉的css樣式
     $(".st-filter-list").removeClass("st-filter-list-active");
     $(".st-filter-list img").attr("src","images/timeline/timeline_filter_icon_arrow.png");
     $(".st-filter-list-subarea").slideUp();
     
     //開起的css樣式
     $(this).addClass("st-filter-list-active");
     $(this).children().attr("src","images/timeline/timeline_filter_icon_arrow_click.png");
     
     //images/timeline/timeline_filter_icon_arrow.png
     if($(this).next().html()){
         if($(this).next().is(":visible")){
             $(".st-filter-list").removeClass("st-filter-list-active");
             $(".st-filter-list img").attr("src","images/timeline/timeline_filter_icon_arrow.png");
             $(this).next().slideUp();
         }else{
             open_tag = $(this).eq();
             console.log(open_tag);
             $(this).next().slideDown();
         }
     }else{
         setTimeout(function(){
             $(".st-filter-list").removeClass("st-filter-list-active");
             $(".st-filter-list img").attr("src","images/timeline/timeline_filter_icon_arrow.png");
         },100);
     }
     
 });