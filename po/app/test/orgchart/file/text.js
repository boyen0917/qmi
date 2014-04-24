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
					hierachy_arr = orgChartMake(reader.result,file_name);
					console.log(hierachy_arr);
				}

				reader.readAsText(file);	
			} else {
				fileDisplayArea.innerText = "File not supported!";
			}
		});
		
		
		function orgChartMake(data,file_name){
			hierachy_arr = {"name": "root","children": [{"name": file_name,"children": []}]};
		    max_group_cnt=0,group_str_arr=[],relation_arr=[];
		    var split_arr = data.split('\n');
		    //先做第一次的篩選
		    $.each(split_arr,function(i,val){
		        if(val.split(',')[3]){
		            if($.inArray(val.split(',')[3], group_str_arr) < 0){
		                group_str_arr.push(val.split(',')[3]);
		            }
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
		
});
