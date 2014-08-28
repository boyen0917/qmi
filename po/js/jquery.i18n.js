/*!
 * jQuery i18n plugin
 * @requires jQuery v1.1 or later
 *
 * See https://github.com/recurser/jquery-i18n
 *
 * Licensed under the MIT license.
 *
 * Version: 1.1.1 (Sun, 05 Jan 2014 05:26:50 GMT)
 */
(function($) {
  /**
   * i18n provides a mechanism for translating strings using a jscript dictionary.
   *
   */

  var __slice = Array.prototype.slice;

  /*
   * i18n property list
   */
  var i18n = {

  	dict: null,

    /**
     * load()
     *
     * Load translations.
     *
     * @param  property_list i18n_dict : The dictionary to use for translation.
     */
  	

    load: function(lang_path) {
      var this_i18n = this;
      $.get(lang_path,function(load_dict){

        if (this_i18n.dict !== null) {
          $.extend(this_i18n.dict, load_dict);
        } else {
          this_i18n.dict = load_dict;
        }
      });
      
    },

    load: function(lang, callback) {
      var this_i18n = this;
      $.ajaxSetup({
        async: false,
        timeout: 2000
      });

      $.get('lan/'+lang+'.json',function(load_dict){

        if (this_i18n.dict !== null) {
          $.extend(this_i18n.dict, load_dict);
        } else {
          this_i18n.dict = load_dict;
        }

        $.ajaxSetup({
          async: true,
          timeout: 30000,
        });
        callback();
      });
    },
/*
    load: function(lang_path){
      var this_i18n = this;
      var lang = normalizeLang(language);
      var opts = { async: false, cache: false, dataType: 'text', timeout: 500 };
      var query;
      var file = "";

      // Load the language file and degrade along the way...
      query = $.ajax($.extend(opts, { url: lingua__path + lingua__name + '.txt' }));
      if (query.status == 200){
        if (this_i18n.dict !== null) {
          $.extend(this_i18n.dict, load_dict);
        } else {
          this_i18n.dict = load_dict;
        }
      } file = query.responseText;
}
*/
    /**
     * _()
     *
     * Looks the given string up in the dictionary and returns the translation if
     * one exists. If a translation is not found, returns the original word.
     *
     * @param  string str           : The string to translate.
     * @param  property_list params.. : params for using printf() on the string.
     *
     * @return string               : Translated word.
     */
  	_: function (str) {
      dict = this.dict;
  		if (dict && dict.hasOwnProperty(str)) {
  			str = dict[str];
  		}
      args = __slice.call(arguments);
      args[0] = str;
  		// Substitute any params.
  		return this.printf.apply(this, args);
  	},

    getString: function (str) {
      dict = this.dict;
      if (dict && dict.hasOwnProperty(str)) {
        str = dict[str];
      }
      args = __slice.call(arguments);
      args[0] = str;
      // Substitute any params.
      return this.printf.apply(this, args);
    },

    /*
     * printf()
     *
     * Substitutes %s with parameters given in list. %%s is used to escape %s.
     *
     * @param  string str    : String to perform printf on.
     * @param  string args   : Array of arguments for printf.
     *
     * @return string result : Substituted string
     */
  	printf: function(str, args) {
  		if (arguments.length < 2) return str;
      args = $.isArray(args) ? args : __slice.call(arguments, 1);
      return str.replace(/([^%]|^)%(?:(\d+)\$)?s/g, function(p0, p, position) {
        if (position) {
          return p + args[parseInt(position)-1];
        }
        return p + args.shift();
      }).replace(/%%s/g, '%s');
  	}

  };

  /*
   * _t()
   *
   * Allows you to translate a jQuery selector.
   *
   * eg $('h1')._t('some text')
   *
   * @param  string str           : The string to translate .
   * @param  property_list params : Params for using printf() on the string.
   *
   * @return element              : Chained and translated element(s).
  */
  $.fn._t = function(str, params) {
    return $(this).html(i18n._.apply(i18n, arguments));
  };

  $.i18n = i18n;

  $.i18n._t = function(str, params) {
    return i18n._.apply(i18n, arguments);
  };
})(jQuery);