$(function() {
		var fileInput = document.getElementById('fileInput');
		var fileDisplayArea = document.getElementById('fileDisplayArea');
		fileInput.addEventListener('change', function(e) {
			var file = fileInput.files[0];
			var textType = /text.*/;
			if (file.type.match(textType)) {
				var reader = new FileReader();

				reader.onload = function(e) {
					console.log(reader.result);
					var file_name = fileInput.files[0].name.slice(0,-4);
					hierachy_arr = treeJsonMake(reader.result,file_name);
					
					visitEachToAddId(hierachy_arr.children);
					$(".edit-outside-area").show();
					$("h1").next().hide();
					
					var queue = [];
					treeMake(hierachy_arr,queue);
					
					function visitEachToAddId(arr,hid,branch_path){
				        this_hid = hid;
				        $.each(arr,function(i,val){
				            if(hid && branch_path){
				                val.hid = hid+"-"+(i+1);
				                val.branch_path = branch_path+"/"+val.name;
				            }else{
				                val.hid = i+1;
				                val.branch_path = val.name;
				            }
				            
				            //更新成員所屬部門
				            $.each(member_arr,function(mem_i,mem_val){
				                if(mem_val[2] == val.branch_path){
				                	if(!mem_val["hid"]){
				                		mem_val["hid"] = [];
				                	}
				                    mem_val["hid"].push(val.hid.toString());
				                    mem_val["id"] = mem_i+1;
				                }
				            });
				            
				            if(val.children){
				                visitEachToAddId(val.children,val.hid,val.branch_path);
				            }
				        });
				    }
				    
					function treeJsonMake(data,file_name){
						file_name = "三竹資訊";
						
						hierachy_arr = {"name": "root","children": [{"name": file_name,"children": []}]};
					    max_group_cnt=0,group_str_arr=[],relation_arr=[],member_arr = [];
					    var split_arr = data.split('\n');
					    //先做第一次的篩選
					    $.each(split_arr,function(i,val){
					        if(val.split(',')[3]){
					        	temp_arr = [];
						    	temp_arr[0] = val.split(',')[1];
						    	temp_arr[1] = val.split(',')[2];
						    	temp_arr[2] = null;
						    	
					    		temp_arr[2] = val.split(',')[3];
					            if($.inArray(val.split(',')[3], group_str_arr) < 0){
					                group_str_arr.push(val.split(',')[3]);
					            }
					            member_arr.push(temp_arr);
					        }
					    });
					    
					    //製作各節點關聯
					    $.each(group_str_arr,function(i,val){
					        base_arr = val.split("/");
					        $.each(base_arr,function(i,val){
					            result_val = val;
					            chk = 0;
					            $.each(relation_arr,function(i,val){
					                if(val[0] == result_val){
					                    chk = 1;
					                    return false;
					                }
					            });
					            
					            if(chk == 0){
					                result_child_arr = [];
					                if(i == 0){
					                    result_child_arr[1] = file_name;
					                }else{
					                    result_child_arr[1] = base_arr[i-1];
					                }
					                result_child_arr[0] = val;
					                relation_arr.push(result_child_arr);
					            }
					        });
					    });

					    $.each(relation_arr,function(i,val){
					        dup_chk=0;
					        doEach(hierachy_arr.children,val);
					        
					    });

					    return hierachy_arr.children[0];
					}
					
					function doEach(arr,target_arr){
			            
			            if(!target_arr){
			                return false;
			            }
			            
			            $.each(arr,function(i,val){
			                
			                if(val.name == target_arr[1]){
			                    
			                    //排除重複
			                    if(val.children){
			                        $.each(val.children,function(i,val){
			                            if(val.name == target_arr[0]){
			                                dup_chk = 1;
			                            }
			                        });
			                    }
			                    
			                    if(dup_chk != 0){
			                        return false;    
			                    }
			                    
			                    if(!val.children){
			                        val.children = [];
			                    }
			                    val.children.push({"name":target_arr[0]+""});
			                    return false;
			                }
			                if(val.children){
			                    doEach(val.children,target_arr);   
			                }
			            });
			        }
					
					
				    $("#undo").click(function(){
				        if($("#undo-cnt").val() > 0){
				            $("#tree-container").html("");
				            treeMake(queue[$("#undo-cnt").val()-1],queue,$("#undo-cnt").val()-1);
				            $("#undo-cnt").val($("#undo-cnt").val()-1);
				        }else{
				            console.log("最舊");
				        }
				    });
				    
				    $("#redo").click(function(){
				        if(queue[$("#undo-cnt").val()*1+1]){
				            $("#tree-container").html("");
				            treeMake(queue[$("#undo-cnt").val()*1+1],queue,$("#undo-cnt").val()*1+1);
				            $("#undo-cnt").val($("#undo-cnt").val()*1+1);
				        }else{
				            console.log("最新");
				        }
				    });
				    
				    $( ".edit-branch-member" ).draggable();
				    
				    $(".edit-bm-branch-cancel").click(function(){
				    	$(".edit-bm-bottom-cancel").trigger("click");
				    });
				    
				    $(document).on("click","svg rect",function(e){
				    	//判斷是否開啟popup視窗
				        edit_chk = false;
				    	
				        $(".edit-bm-search input").val("");
				        branch_name = $(this).parent().find("text").html();
				        hid = $(this).parent()[0].attributes.hid.value;

				        e.stopPropagation();
				        //成員視窗的左右位置調整
				        x = memberListAdj($(this).offset().left+30);
				        $(".edit-branch-member").css("top",($(document).height() - $(".edit-branch-member").height())/2);
				        $(".edit-branch-member").css("left",x);
				        $(".edit-branch-member").show();
				        
				        scaleIn($(".edit-branch-member"),8);
				        
				        //現在按下的群組成員陣列
				        branch_member = [];
				        $.each(member_arr,function(i,val){
				        	if($.inArray(hid, val["hid"]) >= 0){
				                branch_member.push(val);
				            }
				        });
				        //成員名單 編輯
				        branch_member_ori = branch_member.slice();
				        
				        $(".edit-branch-id").val(hid);
				        
				        $(".edit-bm-classify-box[data-bm-class=all]").removeClass("edit-bm-classify-box-blue");
				        $(".edit-bm-classify-box[data-bm-class=this]").addClass("edit-bm-classify-box-blue");
				        
				        $(".edit-bm-branch-name input").val(branch_name);
				        $(".edit-bm-list-area").html("");
				        
				        memberListMake(branch_member,$(".edit-bm-list-area"));
				        memberListMake(member_arr,$(".edit-bm-list-area-all"));
				        $(".edit-bm-list-area-all").find(".edit-bm-list-chk div").removeClass("edit-chk-pic");
				        $(".edit-bm-list-area-all").hide();
				        
				        $(".edit-bm-classify-box[data-bm-class=this] span").html(branch_member.length);
				        $(".edit-bm-classify-box[data-bm-class=all] span").html(member_arr.length);
				        
				        $(".edit-bm-bottom-save").attr("data-branch-add","0");
				            
				    });
				    
				    
				    $(document).on("click","svg image",function(e){
				    	e.stopPropagation();
				    	if($(this).attr("class") == "svg-edit-add"){
				    		//判斷是否開啟popup視窗
				            edit_chk = false;
				            
				            $(".edit-bm-search input").val("");
				            hid = $(this).parent()[0].attributes.hid.value;
				            
				            $(".edit-bm-branch-name input").val("");
				            
				            //成員視窗的左右位置調整
				            x = memberListAdj($(this).offset().left+30);
				            $(".edit-branch-member").css("top",($(document).height() - $(".edit-branch-member").height())/2);
				            $(".edit-branch-member").css("left",x);
				            $(".edit-branch-member").show();
				            
				            scaleIn($(".edit-branch-member"),8);
				            
				            $(".edit-branch-id").val(hid);
				            
				            $(".edit-bm-classify-box[data-bm-class=this]").removeClass("edit-bm-classify-box-blue");
				            $(".edit-bm-classify-box[data-bm-class=all]").addClass("edit-bm-classify-box-blue");
				            
				            $(".edit-bm-list-area").html("");
				            
				            memberListMake(member_arr,$(".edit-bm-list-area-all"));
				            
				            branch_member = [];
				            branch_member_ori = []
				            
				            $(".edit-bm-classify-box[data-bm-class=this] span").html(branch_member.length);
				            $(".edit-bm-classify-box[data-bm-class=all] span").html(member_arr.length);
				            
				            $(".edit-bm-list-area-all").find(".edit-bm-list-chk div").removeClass("edit-chk-pic");
				            
				            $(".edit-bm-list-area").hide();
				            $(".edit-bm-list-area-all").show();
				            
				            $(".edit-bm-bottom-save").attr("data-branch-add","1");
				            
				            
				    	}else{
				    		var hid = $(this).parent().attr("hid");
				            popupShowAdjust("確定刪除","取消");
				            popupConfirmDel(hierachy_arr,hid);
				    	}
				    });
				    
				    //勾選、取消勾選成員
				    $(document).on("click",".edit-bm-list",function(){
				        edit_chk = true;
				        //群組成員 點選刪除
				        var this_memid = $(this).data("member-id");
				        
				        //有打勾的
				        if($(this).find("div").hasClass("edit-chk-pic")){
				            //判斷是群組成員 取消打勾就刪除
				            if($(this).parent().hasClass("edit-bm-list-area")){
				                $(this).remove();
				            }
				        	
				            //取消打勾就是 從群組成員陣列剔除
				        	$.each(branch_member,function(i,val){
				                if(val["id"] == this_memid){
				                    branch_member.splice(i,1);
				                    return false;
				                }
				            });
				            $(this).find(".edit-bm-list-chk div").removeClass("edit-chk-pic");
				        }else{
				        	//進行打勾動作只在所有成員中會發生 將此成員加入 群組成員陣列
				        	$.each(member_arr,function(i,val){
				                if(val["id"] == this_memid){
				                    branch_member.push(val);
				                    return false;
				                }
				            });
				            $(this).find(".edit-bm-list-chk div").addClass("edit-chk-pic");
				        }
				        
				        //計算總數
				        $(".edit-bm-classify-box[data-bm-class=this] span").html(branch_member.length);
				    });
				    
				    //成員編輯 確定
				    $(".edit-bm-bottom-save").click(function(){
				    	
				    	if(!$(".edit-bm-branch-name input").val()){
				    		popupShowAdjust("群組名稱未填","確定",true);
				    		return false;
				    	}
				    	
				    	if($(".edit-bm-bottom-save").data("branch-add") == 1){
				    		console.log(1);
				    		return false;
				    	}
				    	
				    	
				    	//判斷刪除 原本的群組成員陣列id  有無在新的群組成員陣列id中
				    	var this_hid = $(".edit-branch-id").val();
				    	$.each(branch_member_ori,function(ori_i,ori_val){
				    		var chk = false;
				    		//判斷群組成員有沒有減少 即刪除
				            $.each(branch_member,function(bran_i,bran_val){
				                if(ori_val["id"] == bran_val["id"]){
				                	chk = true;
				                    return false;
				                }
				            });
				    		//表示有要刪除
				    		if(!chk){
				    			$.each(member_arr,function(mem_i,mem_val){
				    				if(mem_val["id"] == ori_val["id"]){
				    					$.each(mem_val["hid"],function(h_i,h_val){
				    						if(h_val == this_hid){
				    							mem_val["hid"].splice(h_i,1);
				    							return false;
				    						}
				    					});
				    				    return false;
				    				}
				    			});
				    		}
				        });
				    	
				    	//判斷增加
				        $.each(member_arr,function(mem_i,mem_val){
				        	$.each(branch_member,function(bran_i,bran_val){
				                if(mem_val["id"] == bran_val["id"]){
				                	if($.inArray(this_hid, mem_val["hid"]) < 0){
				                		mem_val["hid"].push(this_hid);
				                	}
				                	return false;
				                }
				            });
				        });
				    	
				    	
				    	//更改階層json 群組名稱
				    	var new_name = $(".edit-bm-branch-name input").val();
				    	branchNameChange(hierachy_arr.children,this_hid,new_name);

				        //更改g tag 群組名稱
				        $.each($("svg g g"),function(i,val){
				        	if($(this).attr("hid") == this_hid){
				        		$(this).find("text").html(new_name);
				        	}
				        });
				        console.log(hierachy_arr);
				        popupShowAdjust("編輯完成");
				    });
				    
				    //成員編輯 取消
				    $(".edit-bm-bottom-cancel").click(function(){
				    	if(edit_chk){
				    		popupShowAdjust("確定放棄編輯","取消");	
				    	}else{
				    		$(".edit-branch-member").hide();
				    	}
				    });
				    
				    //群組成員 所有成員 切換
				    $(".edit-bm-classify-box").click(function(){

				        $(".edit-bm-classify-box").removeClass("edit-bm-classify-box-blue");
				        $(this).addClass("edit-bm-classify-box-blue");
				        
				        $(".edit-bm-list-area").hide();
				        $(".edit-bm-list-area-all").hide();
				        if($(this).data("bm-class") == "all"){
				            $(".edit-bm-list-area-all").show();
				            
				            //存在此群組的成員 打勾
				            $(".edit-bm-list-area-all").find(".edit-bm-list-chk div").removeClass("edit-chk-pic");
				            $.each($(".edit-bm-list-area-all .edit-bm-list"),function(i,val){
				                var this_member = $(this);
				                $.each(branch_member,function(bran_i,bran_val){
				                    if(bran_val["id"] == this_member.data("member-id")){
				                        this_member.find(".edit-bm-list-chk div").addClass("edit-chk-pic");
				                    }
				                });
				            });
				            
				        }else{
				            memberListMake(branch_member,$(".edit-bm-list-area"));
				            $(".edit-bm-list-area").show();
				        }
				        
				        $(".edit-bm-search input").trigger("input");
				    });
				    
				    $(".edit-bm-search input").bind('input',function(){
				    	var this_bm = $(this).parent().parent();
				    	var input_content = $(this).val();
				    	var this_search = this_bm.find(".edit-bm-list-area .edit-bm-list");
				    	if($(".edit-bm-classify-box[data-bm-class=all]").hasClass("edit-bm-classify-box-blue")){
				    		this_search = this_bm.find(".edit-bm-list-area-all .edit-bm-list");
				    	}
				    	
				    	//搜尋成員
				        branchSearch(this_search,input_content);	
				    });
				    
				    
				    $("#upload").click(function(){
				    	// modified_arr 記錄已被更改過的g tag 、 member index
				        g_modified_arr = [];
				        member_modified_arr = [];
				    	visitEachToUpdateId(hierachy_arr.children);
				    	
				    	console.log(member_arr);
				    	console.log(hierachy_arr);
				    });
				    
				    function branchNameChange(arr,hid,new_name){
				        $.each(arr,function(i,val){
				            if(val.hid == hid){
				                val.name = new_name;
				                return false;
				            }
				            
				            if(val.children){
				                branchNameChange(val.children,hid,new_name);
				            }
				        });
				    }
				    
				    function branchSearch(this_search,input_content){
				        $.each(this_search,function(i,val){
				            if(!$(this).find(".edit-bm-list-content div").html().match(input_content)){
				                $(this).hide();
				            }else{
				                $(this).show();
				            }
				        });
				    }
				    
				    function visitEachToUpdateId(arr,hid,branch_path){
				        $.each(arr,function(i,val){
				        	var ori_val_hid = val.hid;
				        	
				            if(hid && branch_path){
				                val.hid = hid+"-"+(i+1);
				                val.branch_path = branch_path+"/"+val.name;
				            }else{
				                val.hid = i+1;
				                val.branch_path = val.name;
				            }
				            
				           //找出member_arr裡面舊的群組hid 換成新的
				            $.each(member_arr,function(mem_i,mem_val){
				                if(!member_modified_arr[mem_i]){
				                	member_modified_arr[mem_i]=[];
				                }
				                
				                
				                
				                $.each(mem_val["hid"],function(h_i,h_val){
				                	
				                    if($.inArray(h_i,member_modified_arr[mem_i])  < 0){
				                    	if(ori_val_hid == h_val){
				                    		if(mem_val["id"] == 1){
				                    			console.log(mem_i);
				                    			console.log(mem_val);
				                    			console.log(member_modified_arr[mem_i]);
				                    			console.log(h_i);
				                    			console.log(mem_val["hid"]);
				                    		}
				                    		
				                    		//更新
				                            mem_val["hid"][h_i] = val.hid.toString(); 
				                            member_modified_arr[mem_i].push(h_i);
				                    	}
					                        
				                    }
				                });
				            });
				            
				            //更新circle的hid
				            $.each($("svg g g"),function(c_i,c_val){
				            	if($(this).attr("hid") == ori_val_hid && $.inArray(c_i, g_modified_arr) < 0){
				            		g_modified_arr.push(c_i);
				            		$(this).attr("hid",val.hid);
				            		return false;
				            	}
				            });
				            
				            if(val.children){
				            	visitEachToUpdateId(val.children,val.hid,val.branch_path);
				            }
				        });
				        
				    }
				    
				    function memberListMake(arr,target){
				        target.html("");
				        target.show();
				        $.each(arr,function(i,val){
				            target.append(
				                '<div class="edit-bm-list" data-member-id="' + val["id"] + '">'+
				                    '<div class="edit-bm-list-chk"><div class="edit-chk-pic"></div></div>'+
				                    '<div class="edit-bm-list-img"><div>照片</div></div>'+
				                    '<div class="edit-bm-list-content"><div>'+val[0]+'</div><div>'+val[1]+'</div></div>'+
				                    '<input type="hidden">' +
				                '</div>'
				            );
				        });
				    }
				    
				    
				    //成員視窗的左右位置調整
				    function memberListAdj(x){
				        document_width = $(document).width();
				        list_width = $(".edit-branch-member").width();
				        
				        if(x+list_width+50  > document_width && document_width > list_width*3){
				            return x-list_width-40;
				        }
				        return x+40;
				    }
				    
				//----------------------- popup --------------------------------------  
				    
				    $(".popup-screen").click(function(e){
				    	e.stopPropagation();
				        $(".popup").hide();
				        $(".popup-screen").hide();
				    });

				    $(".popup-close").click(function(){
				        $(".popup-screen").trigger("click");
				        $(".popup-close").trigger("pageChange");
				        $(".popup-close").trigger("memberDelete");
				        $(".edit-branch-member").hide();
				    });
				    
				    $(".popup-close-cancel").click(function(e){
				    	e.stopPropagation();
				        $(".popup-screen").trigger("click");
				    });
				    
				    //計算彈出對話框置中
				    function popupShowAdjust(desc,cancel,opt){
				        if(cancel){
				            $(".popup-close-cancel").html(cancel);
				        }else{
				        	$(".popup-close-cancel").hide();
				        }
				        
				        if(desc){
				            $('.popup-text').html(desc);
				        }
				        
				        if(opt){
				        	$(".popup-close").hide();
				        }
				        
				        $(".popup-frame").css("margin-left",0);
				        $(".popup-screen").show();
				        $(".popup").show();
				        $(".popup-frame").css("margin-left",($(document).width() - $(".popup-frame").width())/2-15);
				    }

				    //確認刪除
				    function popupConfirmDel(hierachy_arr,hid){
				        $(".popup-close").bind("memberDelete",function(){
				            deleteNode(hierachy_arr,hid);
				            $("#tree-container").html("");
				            treeMake(hierachy_arr,queue);
				            $(".popup-close").unbind("memberDelete");
				        });
				    }
				    
				    function deleteNode(arr,hid){
				        $.each(arr.children,function(i,val){
				            
				            if(val.hid == hid){
				                arr.children.splice(i,1);
				                return false;
				            }else{
				                if(val.children){
				                    deleteNode(val,hid);   
				                }
				            }            
				        });
				    }
				    
				    function scaleIn(target,scale_out_cnt)
				    {
				        target.css("transform","scale("+(scale_out_cnt/100)+")");
				        if(scale_out_cnt < 100){
				            scale_out_cnt+=4;
				            setTimeout(function(){
				                scaleIn(target,scale_out_cnt);
				            }, 1);
				        }
				    }
					
				}

				 reader.readAsText(file, 'BIG5');	
			} else {
				fileDisplayArea.innerText = "File not supported!";
			}
		});
		
});
