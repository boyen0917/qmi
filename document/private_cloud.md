# 私雲readme
好讀版請丟到這 http://dillinger.io/

## 簡述
* gi: 團體id (eg."G000000102j")
* ci/pri_ci: 私雲id (eg."cloud1")
* cl/pri_cl: 私雲url (eg."caprivateeim1.mitake.com.tw")
#### DB
原本的DB架構為：
```    
	ui	┌ gi1: group1_data 
		├ gi2: group2_data
		├ ....
		└ groupN: groupN_data 
	eg.$.lStorage(ui)["G000000102j"];
```    
	
加入私雲後, 架構修改如下：
```    
	new_pri_gi = #ci#pri_gi#
	eg.#cloud1#G000000109N#

	ui	┌ pub_gi1: pub_group1_data
		├ #ci1#pri_gi1#: pri_cloud1_group1_data
		├ #ci1#pri_gi2#: pri_cloud1_group2_data
		├ #ci2#pri_gi1#: pri_cloud2_group1_data
		├ ....
		└ groupN

	_pri_group	
		┌ ci1: pri_cloud1_data, group_gi_list
		├ ci2: pri_cloud2_data, group_gi_list
		├ ....
		└ ciN: pri_cloudN_data, group_gi_list
		
	eg.$.lStorage("_pri_group")["cloud1"] = {
		at: "mLhKlhyiMDsXW8sKW9zgtQ=="
		atp: 0
		ci: "cloud1"
		cl: "caprivateeim1.mitake.com.tw"
		cn: "私雲1"
		groups: [
			"G000000109N"
		],
		s3: "s3.ctbc.com.tw"
		ui: "U000000406p"
	}
```
分隔符號為_pri_split_chat(#), new_pri_gi可由getPrivateGi(this_ci, this_gi)取得
    eg.getPrivateGi(cloud1, G000000109N) = #cloud1#G000000109N#
    
#### ajax
在ajaxDo中, 若發現api, body.gi, header.gi中有發現含new_pri_gi, 會做以下動作:
1. 把gi還原成pri_gi
2. 用私雲的ui, at取代header.ui, header.at
3. 將api url改為私雲url

另外也可以直接將pri_cl帶入ajax,用此方法只會做以下動作:
1. 將api url改為私雲url

## 相關變數及function
#### _pri_split_chat
```
用來串接pri_ci跟pri_gi的分隔字元
```
#### getPrivateGi(this_ci, this_gi)
```
用來串接ci,gi的function, 回傳串接的新gi
input:
    getPrivateGi("cloud1","G000000109N");
return:
    "#cloud1#G000000109N#"
```
#### parsePrivateGi(str)
```
用來parse含有由getPrivateGi串接的gi
input:
    parsePrivateGi("groups/#cloud1#G000000109N#/timelines/T00000020BF/events")
return:
    {
        ci:"cloud1",
        gi:"G000000109N",
        newStr: "groups/G000000109N/timelines/T00000020BF/events"
    }
```




```
```