
var base_url = "https://apserver.mitake.com.tw/apiv1/";

function loginFun(pno,pwd){
    var id = "+886" + pno.substring(1);
    //登入認證
    var api_name = "login";
    var headers = {
        "li":"zh_TW"
    };
    var body={};
    body.id=id;
    body.pw=toSha1Encode(pwd);
    body.tp="0"
    var method = "post";
    return result = ajaxDo(api_name,headers,method,true,JSON.stringify(body));
                    

}

//sha1 and base64 encode
function toSha1Encode(string){
    var hash = CryptoJS.SHA1(string);
    var toBase64 = hash.toString(CryptoJS.enc.Base64);
    return toBase64;
}

function ajaxDo(api_name,headers,method,async,body){
    //console.log(api_url);
    var api_url = base_url + api_name;
    var myRand = Math.floor((Math.random()*1000)+1);
    
    if(async){
    	var result = $.ajax ({
            url: api_url,
            type: method,
            headers:headers,
            data:body
        });/* ajax結束 */
    }else{
    	var result = $.ajax ({
            url: api_url,
            type: method,
            headers:headers,
            async:false,
            dataType: "JSON",
            data:body
        });/* ajax結束 */
    }
    
    return result;
}


function createBranchTree(orgTree,members){
    //alert(JSON.stringify(orgTree));
    prepareMembersData(orgTree,members);

    //
    //members=mapMembersList(members);
    //console.log(members);
    
}

function mapMembersList(orgTree,members){
    var groupId = $.jStorage.get("currnetGroupId");
    var api_name = "groups/"+ groupId+"/users";
    var userId=$.jStorage.get("userId");
    var accessToken=$.jStorage.get("accessToken");
    var headers = {
        "ui":userId,
        "at":accessToken,
        "li":"zh_TW"
        };
    var method = "get";
    
    var result = ajaxDo(api_name,headers,method,false);
    
    result.complete(function(data){
        if(data.status != 200){
                    //$.mobile.changePage("#page-helper");三個人
        }else{
            var resp=$.parseJSON(data.responseText);
            $.each(resp.ul,function(i,val){
                
                $.each(members,function(j,member){


                    if(member.mail == val.em){

                        member.groupUserId=val.gu;
                        members[j]=member;
                        
                    }
                    
                });
            });

            $.each(orgTree,function(i,val){
                createBranchNode("",val,members);
            });
            return members;
        }
    });

    
}

function prepareMembersData(orgTree,members){
    $.each(members,function(i,val){
        val["mail"]=val["mail"].replace("mail: ","");
        val["mobile"]=val["mobile"].replace(/\-/g,"");
        if(val["mobile"].indexOf("0")==0 && val["mobile"].length==10){
            val["mobile"]=val["mobile"].substring(1);
        }
        val["ext"]=val["phone"].substring(val["phone"].indexOf("p")+1);
        val["phone"]=val["phone"].substring(0,val["phone"].indexOf("p"));
        members[i]=val;
        //console.log(members[i]["nickname"]+"   mail="+ members[i]["mail"]+"  phone="+members[i]["phone"]+" ext="+members[i]["ext"]+" mail="+members[i]["mail"]);
    });

    inviteMemberApi(orgTree,members);
    
    return members;
}

function createBranchNode(parendId,jsonlist,members){
    var branchId;
    var groupId = $.jStorage.get("currnetGroupId");
    var api_name = "groups/"+ groupId+"/branches";
    var userId=$.jStorage.get("userId");
    var accessToken=$.jStorage.get("accessToken");
    var headers = {
        "ui":userId,
        "at":accessToken,
        "li":"zh_TW"
        };
    var method = "post";
    var body={};
    body.bpi=parendId;
    body.bn=jsonlist.name;
    body.st=1;
    var result = ajaxDo(api_name,headers,method,false,JSON.stringify(body));
    
    result.complete(function(data){
        if(data.status != 200){
                    //$.mobile.changePage("#page-helper");三個人
        }else{
            var resp=$.parseJSON(data.responseText);
            console.log(resp);
            branchId=resp.bi;
            console.log("branchId="+branchId);
            if(branchId!=undefined){
                //console.log("create "+(node.name)+ "  " +node.hid + " "+ node.branch_path+" bi="+branchId);
                $.each(members,function(mem_i,mem_val){
                    //console.log(mem_val.nickname+"  "+mem_val.groupUserId );
                    //console.log(mem_val);
                    if(mem_val[2]==jsonlist.branch_path && mem_val.groupUserId != undefined){
                        console.log("create account "+(mem_val[0])+ " "+ jsonlist.branch_path+ " "+ mem_val.branch  +" api mem_val.gu="+mem_val.groupUserId);
                        
                        setMemberBranch(branchId,mem_val.groupUserId);
                    }
                });
            }
            //return branchId;
        }
        if( branchId!=undefined && jsonlist.children!=undefined){
            console.log(jsonlist.children);
            $.each(jsonlist.children,function(i,val){
                if(val.name!=undefined){
                   createBranchNode(branchId,val,members);
                }
            });
        }

    });


    //var branchId=createBranchMember(parendId,jsonlist,members);
    //console.log("createBranchNode = "+branchId+  "    jsonlist.children="+jsonlist.children);
    /*if( branchId!=undefined && jsonlist.children!=undefined){
        console.log(jsonlist.children);
        $.each(jsonlist.children,function(i,val){
            if(val.name!=undefined){
               createBranchNode(branchId,val,members);
            }
        });
    }*/
}

function createBranchMember(parendId,node,members){
    var branchId = createBranchApi(parendId,node,members);
    console.log("branchIdbranchIdbranchId"+branchId);
    /*if(branchId!=undefined){
        console.log("create "+(node.name)+ "  " +node.hid + " "+ node.branch_path+" bi="+branchId);
        $.each(members,function(mem_i,mem_val){
            if(mem_val[2]==node.branch_path){
                console.log("create account "+(mem_val[0])+ " "+ node.branch_path+ " "+ mem_val[2]  +" api");
                setMemberBranch(branchId,mem_val.gu);
        });
    }*/
    return branchId;
}


function setMemberBranch(branchId,groupUserId){
    var branchId;
    var groupId = $.jStorage.get("currnetGroupId");
    var api_name = "groups/"+ groupId+"/branches/"+branchId+"/users";
    var userId=$.jStorage.get("userId");
    var accessToken=$.jStorage.get("accessToken");
    var headers = {
        "ui":userId,
        "at":accessToken,
        "li":"zh_TW"
        };
    var method = "post";
    var body={};
    var user={};
    var ul=[];
    user.gu=groupUserId
    console.log("setMemberBranch branchId= "+branchId+ "  groupUserId="+groupUserId);

    ul[0]=user;
    body.ul=ul;
    console.log(JSON.stringify(body));
    var result = ajaxDo(api_name,headers,method,false,JSON.stringify(body));
    
    result.complete(function(data){
        if(data.status != 200){
                    //$.mobile.changePage("#page-helper");三個人
        }else{
            var resp=$.parseJSON(data.responseText);
            console.log(resp);
            //branchId=resp.bi;

        }
    });
    return branchId;
}

function createBranchApi(parendId,node,members){
    var branchId;
    var groupId = $.jStorage.get("currnetGroupId");
    var api_name = "groups/"+ groupId+"/branches";
    var userId=$.jStorage.get("userId");
    var accessToken=$.jStorage.get("accessToken");
    var headers = {
        "ui":userId,
        "at":accessToken,
        "li":"zh_TW"
        };
    var method = "post";
    var body={};
    body.bpi=parendId;
    body.bn=node.name;
    body.st=1;
    var result = ajaxDo(api_name,headers,method,false,JSON.stringify(body));
    
    result.complete(function(data){
        if(data.status != 200){
                    //$.mobile.changePage("#page-helper");三個人
        }else{
            var resp=$.parseJSON(data.responseText);
            console.log(resp);
            branchId=resp.bi;
            console.log("branchId="+branchId);
            if(branchId!=undefined){
                //console.log("create "+(node.name)+ "  " +node.hid + " "+ node.branch_path+" bi="+branchId);
                $.each(members,function(mem_i,mem_val){
                    //console.log(mem_val.nickname+"  "+mem_val.groupUserId );
                    //console.log(mem_val);
                    if(mem_val[2]==node.branch_path && mem_val.groupUserId != undefined){
                        console.log("create account "+(mem_val[0])+ " "+ node.branch_path+ " "+ mem_val.branch  +" api mem_val.gu="+mem_val.groupUserId);
                        
                        setMemberBranch(branchId,mem_val.groupUserId);
                    }
                });
            }
            return branchId;
        }
    });
    
}

function inviteMemberApi(orgTree,members){
    var branchId;
    var groupId = $.jStorage.get("currnetGroupId");
    var api_name = "groups/"+ groupId+"/invitations";
    var userId=$.jStorage.get("userId");
    var accessToken=$.jStorage.get("accessToken");
    var headers = {
        "ui":userId,
        "at":accessToken,
        "li":"zh_TW"
        };
    var method = "post";
    
    var ul=[];
    $.each(members,function(i,val){
        var member={};
        //member.cc="+886";
        member.pn="+886"+val.mobile;
        member.pn2=val.phone;
        member.ext=val.ext;
        member.em=val.mail;
        member.nk=val.name;
        ul[i]=(member);
    });
    var body={};
    body.ul=ul;
    console.log(JSON.stringify(body));

    
    var result = ajaxDo(api_name,headers,method,false,JSON.stringify(body));
    
    result.complete(function(data){
        if(data.status != 200){

        }else{
            var resp=$.parseJSON(data.responseText);
            console.log(resp);
            //branchId=resp.bi;
        }
        mapMembersList(orgTree,members);

    });
    return branchId;
}

function createMemberApi(parendId,branchName){
    var branchId;
    var groupId = $.jStorage.get("currnetGroupId");
    var api_name = "groups/"+ groupId+"/branches";
    var userId=$.jStorage.get("userId");
    var accessToken=$.jStorage.get("accessToken");
    var headers = {
        "ui":userId,
        "at":accessToken,
        "li":"zh_TW"
        };
    var method = "post";
    var body=[];
    body["bpi"]=parendId;
    body["bn"]=branchName;
    body["tp"]=0;
    body["st"]=1;
    var result = ajaxDo(api_name,headers,method,false,body);
    
    result.complete(function(data){
        if(data.status != 200){
                    //$.mobile.changePage("#page-helper");三個人
        }else{
            var resp=$.parseJSON(data.responseText);
            console.log(resp);
            branchId=resp.bi;
        }
    });
    return branchId;
}

function addGroupFun(){
    $("#mainTitle").text("新增團體");
    html="<div class='col-lg-6'> ";
    html+="<label>請輸入團體名稱</label>";                          
    html+="<input id='groupName' type='text' class='form-control' placeholder='Please input group name'>";
    html+="<label>請輸入團體簡介</label>"; 
    html+="<input id='groupDesc' type='text' class='form-control' placeholder='Please input group description'></input><BR>";
    html+="<button id='addGroupButton' type='button' class='btn btn-primary'>建立</button>";
    html+="</div>";
    $("#content").html(html);

    $("#addGroupButton").click(function(){

        var groupName=$("#groupName").val();
        var groupDesc=$("#groupDesc").val();
        
    
        var api_name = "groups";
        var userId=$.jStorage.get("userId");
        var accessToken=$.jStorage.get("accessToken");
        var headers = {
            "ui":userId,
            "at":accessToken,
            "li":"zh_TW"
            };
        var method = "post";
        var body={};
        body.gn=groupName;
        body.gd=groupDesc;
        var result = ajaxDo(api_name,headers,method,false,JSON.stringify(body));
        
        result.complete(function(data){
            if(data.status != 200){
                        //$.mobile.changePage("#page-helper");三個人
            }else{
                alert("["+groupName+"] 建立成功");
                loadGroupList(userId,accessToken);
            }
        });
    });


}

function loadGroupList(userId, accessToken){

            //取得團體列表
            var api_name = "groups";
            var headers = {
                "ui":userId,
                "at":accessToken,
                "li":"zh_TW"
            };
            var method = "get";
            var result = ajaxDo(api_name,headers,method,true);
            result.complete(function(data){
                if(data.status != 200){
                    //$.mobile.changePage("#page-helper");三個人
                }else{

                    var groupList=$.parseJSON(data.responseText);
                    $("#groupList").empty(); 

                    if(groupList.gl.length==0){
                        $("#groupList").append('<li><a>目前尚無群組</a></li>');
                    }else{
                        for(i=0;i<groupList.gl.length;i++){
                            $("#groupList").append("<li id='"+i+"'><a>"+groupList.gl[i].gn+"</a></li>");
                        }
                    }
                    $('#groupList').on('click', 'li', function(event){
                        $("#mainTitle").text("聯絡人編輯 - "+groupList.gl[this.id].gn);
                        $("#memberEditor").show();
                        $("#content").html("");
                        $.jStorage.set("currnetGroupName",groupList.gl[this.id].gn);
                        $.jStorage.set("currnetGroupId",groupList.gl[this.id].gi);
                    });

                    //製作timeline
                    
                    //預設團體暫定為第一個團體
                    /*default_group = $.parseJSON(data.responseText).gl[0];
                    group_id = default_group.gi
                    group_name = default_group.gn;
                    timeline_id = default_group.tl[0].ti;
                    */
                    //製作timeline
                    //timelineListWrite();
                    //$.mobile.changePage("#page-group-main", {transition: "pop"});
                }
            });
        }




