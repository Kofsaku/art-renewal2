(function($) {
	var token = $("meta[name='_csrf']").attr("content");
	var header = $("meta[name='_csrf_header']").attr("content");
	$(document).ajaxSend(function(e, xhr, options) {
		xhr.setRequestHeader(header, token);
	});
})(jQuery);


window.common = (function() {
	var common = {};

	/*
	 * 引数の変数が空かどうかを判断します
	 * @param  {Object}     variable javascriptの変数
	 */
	common.isNull = function(variable) {
		if (variable == undefined || variable == null) {
			return true;
		}
		return false;
	}

	common.isNullOrEmpty = function(variable) {

		if (common.isNull(variable)) {
			return true;
		} else {
			if (typeof variable == 'string') {
				return variable.trim() == "";
			} else {
				//文字列以外の場合でNull判定チェック済なので、空ではないと判定
				return false;
			}
		}
	}
	
	// 入力値を半角数字のみ許可
	common.allowOnlyHalfWidthDigits = function (e) {
		// `e.target`がイベント発生元（テキストボックス）
		e.target.value = e.target.value.replace(/[^0-9]/g, '');
	};
	
	common.zeroPad = function(num){
		return num.toString().padStart(2, '0');
	};
	
	/*
	 * 非同期通信を行います。
	 * ASP.NETのIdentityの認証のためにトークンを通信のヘッダに設定します。
	 * トークンはセッションストレージ中に設定していることを前提としています。
	 */
	common.ajax = function(url, data, option) {

		var type = "GET";
		var dataType = "json";
		var contentType = "application/json";

		if (option) {
			type = option.type || "GET";
			dataType = option.dataType || "json";
			contentType = option.contentType || "application/json";
		}
		var path = location.pathname;

		return $.ajax({
			type : type,
			data : JSON.stringify(data),
			contentType : contentType,
			cache : false,
			dataType : dataType,
			url : "/TRIDENT" + url
		})
	};

	return common;
})();





$(document).on('input', '.js-inputtype-integer', function() {
	
	$me = $(this);
	var beforeVal = $me.data('before');

	if (beforeVal == null || beforeVal == "") {
		beforeVal = '';
	}
	var toVal = $me.val();
	
	// 数値以外は許可しない
	if (toVal.match(/[^0-9]/gi)) {
		// 数値以外の場合は入力前の値で返す
		alert("0または正数を入力してください");
		// 入力前の値を設定する
		$me.val(beforeVal);
	}
//	$me.blur();
});



