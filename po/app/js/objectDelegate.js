ObjectDelegateView = {
	mainPage : "",
	mainContainer : "",
	title : "",
	searchElement : "",

	init : function () {
		this.mainPage = $("#page-object");
		this.mainContainer = this.mainPage.find(".obj-cell-area");
		this.searchElement = this.mainPage.find(".obj-selected");
		this.mainPage.find(".header-cp-object span:eq(1)").html(0);
		this.mainContainer.html("");

		this.mainPage.find(".obj-content").show().end()
					 .find(".obj-coach-noMember").hide().end()
					 .find(".obj-done").show();

		return this;
	},

	setHeight : function () {
		var padding_top = this.searchElement.outerHeight();
		this.mainContainer.css("padding-top", padding_top)
    					  .css("height", $(window).height() - 57 - padding_top);

    	return this;
	},

	showNoMember : function () {
		this.mainPage.find(".obj-content").hide().end()
        			 .find(".obj-coach-noMember").show().end()
        			 .find(".obj-done").hide();
	}


}


function ObjectCell () {

	this.html = $('<div class="admin-role"><div class="title"><div class="name">' + this.name
		+ '</div><div class="intro">' + this.brief + '</div><button class="edit-list">編輯名單</button>'
	    + '<button class="edit-role">編輯角色</button></div></div>');
}