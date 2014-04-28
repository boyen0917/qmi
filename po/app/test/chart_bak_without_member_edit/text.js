$(function() {
		var fileInput = document.getElementById('fileInput');
		var fileDisplayArea = document.getElementById('fileDisplayArea');
		fileInput.addEventListener('change', function(e) {
			var file = fileInput.files[0];
			var textType = /text.*/;
			if (file.type.match(textType)) {
				var reader = new FileReader();

				reader.onload = function(e) {
					var file_name = fileInput.files[0].name.slice(0,-4);
					hierachy_arr = treeJsonMake(reader.result,file_name);
					
					visitEachToAddId(hierachy_arr.children);
					console.log(member_arr);
					$("#undo").show();
					$("#redo").show();
					$("h1").next().hide();
					
					var queue = [];
					treeMake(hierachy_arr,queue);
					
				    $(document).on("click",function(){
				    	$(".edit-branch-member").hide();
				    });
				    
				    $(".edit-branch-member").click(function(e){
				    	e.stopPropagation();
				    });
				    
				    $("#undo").click(function(){
				    	if($("#undo-cnt").val() > 0){
				    		$("#tree-container").html("");
				    		treeMake(queue[$("#undo-cnt").val()-1],queue,$("#undo-cnt").val()-1);
				    		$("#undo-cnt").val($("#undo-cnt").val()-1);
				    	}else{
				    		alert("沒上一步");
				    	}
				    });
				    
				    $("#redo").click(function(){
				        if(queue[$("#undo-cnt").val()*1+1]){
				            $("#tree-container").html("");
				            treeMake(queue[$("#undo-cnt").val()*1+1],queue,$("#undo-cnt").val()*1+1);
				            $("#undo-cnt").val($("#undo-cnt").val()*1+1);
				        }else{
				        	alert("沒下一步");
				        }
				    });
				    
					$(document).on("click","circle",function(e){
						e.stopPropagation();
						$(".edit-branch-member").css("top",$(this).offset().top-70);
						$(".edit-branch-member").css("left",$(this).offset().left+40);
						$(".edit-branch-member").show();
						scaleIn($(".edit-branch-member"),8);
						
						
						var branch_member = [];
						branch_name = $(this).parent().find("text").html();
						$.each(member_arr,function(i,val){
							if(val[2] == branch_name){
								temp_arr = [];
								temp_arr[0] = val[0];
								temp_arr[1] = val[1];
								branch_member.push(temp_arr);
							}
						});

						$(".edit-bm-branch-name div").html(branch_name);
						$(".edit-bm-list-area").html("");
						$.each(branch_member,function(i,val){
							$(".edit-bm-list-area").append(
								'<div class="edit-bm-list">'+
						            '<div class="edit-bm-list-chk"><div></div></div>'+
						            '<div class="edit-bm-list-img"><div>照片</div></div>'+
						            '<div class="edit-bm-list-content"><div>'+val[0]+'</div><div>'+val[1]+'</div></div>'+
						        '</div>'
							);
						});
						
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
					});
					
				}

				 reader.readAsText(file, 'BIG5');	
			} else {
				fileDisplayArea.innerText = "File not supported!";
			}
		});
		
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
		
		
		//增加群組的階層id 和 群組成員的所屬群組階層id
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
	                    mem_val["hid"].push(val.hid);
	                    mem_val["id"] = mem_i+1;
	                }
	            });
	            
	            if(val.children){
	                visitEachToAddId(val.children,val.hid,val.branch_path);
	            }
	        });
	    }
		
});
