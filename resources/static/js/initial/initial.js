// 処理後メッセージを表示
$(document).ready(function(){
	var message = $("#message").val();
	if(message !=null  && message != ""){	
		alert(message);	
//	} else{
//		alert("メッセージなし");
	}
});

$(function(){

	// 休日データ初期化ボタン押下
	$("#holidayInitialization").on("click",　initialInfo.holidayInitialization);
	
	// 初期化ボタン押下
	$("#initialization").on("click",　initialInfo.initialization);	
		
	// 登録ボタン押下
	$("#regist").on("click",　initialInfo.regist);
	
	// 詳細設定登録ボタン押下
	$(document).on("click", ".advancedsettingsRegist", advancedsettings.regist);	

	// 削除時刻(時間)が入力された場合
	$("#zaideltime").on("focusout",　function(){
		// 前0付加する
		var zaideltime = $("#zaideltime").val();
		if (!zaideltime.match(/^[0-9]+$/)){
			return;			
		}
		if(zaideltime.length < 2 && zaideltime !=""){
			$("#zaideltime").val(String(zaideltime).padStart(2, '0'));
		}
	});
	
	// 削除時刻(分)が入力された場合
	$("#zaideltimeM").on("focusout",　function(){
		// 前0付加する
		var zaideltimeM = $("#zaideltimeM").val();
		if (!zaideltimeM.match(/^[0-9]+$/)){
			return;			
		}
		if(zaideltimeM.length < 2 && zaideltimeM !=""){
			$("#zaideltimeM").val(String(zaideltimeM).padStart(2, '0'));
		}
	});
	
	// アップロード時刻(時間)が入力された場合
	$("#autouptimeHour").on("focusout",　function(){
		// 前0付加する
		var autouptimeHour = $("#autouptimeHour").val();
		if (!autouptimeHour.match(/^[0-9]+$/)){
			return;			
		}
		if(autouptimeHour.length < 2 && autouptimeHour !=""){
			$("#autouptimeHour").val(String(autouptimeHour).padStart(2, '0'));
		}
	});
	
});

!function() {
	
	var initialInfo = {
		
		// 休日データ初期化ボタンを押下した場合
		holidayInitialization : function(e){
			
			e.preventDefault();// フォーム送信を防ぐ
			
			// 操作履歴を残す
			var data = {"opecode" : "0102002"}
			var deferred = common.ajax("/initial/operate", data, { "type" : "POST" });
			
			deferred.done(function(result) {
					if (result.success) {
					}else{
						alert("error");
						return false;
					}
			}).fail(function(jqXHR, textStatus, errorThrown) {
					alert($("#serverErrorMessage").val());
					return false;
			});			

			//var res = confirm("休日設定を初期化します。" + "\n" +  "現在の休日マスタは無効になります。");
			var res = confirm($("#holidayInitializationConfirm").val());
			
			// グレーアウト項目を入力可能に変更する
			if( res == true ) {
				$("#holidayInitializationFlg").val("1");	// 休日データ初期化ボタンを押下判定フラグ		
				$('#holidaySun').removeAttr('disabled');
				$('#holidayMon').removeAttr('disabled');
				$('#holidayTue').removeAttr('disabled');
				$('#holidayWed').removeAttr('disabled');
				$('#holidayThu').removeAttr('disabled');
				$('#holidayFri').removeAttr('disabled');
				$('#holidaySat').removeAttr('disabled');
			}			
		},
		// 初期化ボタンを押下した場合
		initialization : function(e){
			e.preventDefault();// フォーム送信を防ぐ
			
			// 操作履歴を残す
			var data = {"opecode" : "0102001"}
			var deferred = common.ajax("/initial/operate", data, { "type" : "POST" });

			deferred.done(function(result) {
					if (result.success) {
					}else{
						alert("error");
						return false;
					}
			}).fail(function(jqXHR, textStatus, errorThrown) {
					alert($("#serverErrorMessage").val());
					return false;
			});	
			
			//var res = confirm("初期化します。" + "\n" +  "現在のデータとマスターはすべて無効になります。");
			var res = confirm($("#initializationConfirm").val());
			// グレーアウト項目を入力可能に変更する
			if( res == true ) {
				$("#initializationFlg").val("1");	// 初期化ボタンを押下判定フラグ
				// 各コードサイズ設定
				$('#codesize').removeAttr('disabled');
				$('#scodesize').removeAttr('disabled');
				$('#pcodesize').removeAttr('disabled');
				$('#kcodesize').removeAttr('disabled');
				// 休日設定				
				$('#holidaySun').removeAttr('disabled');
				$('#holidayMon').removeAttr('disabled');
				$('#holidayTue').removeAttr('disabled');
				$('#holidayWed').removeAttr('disabled');
				$('#holidayThu').removeAttr('disabled');
				$('#holidayFri').removeAttr('disabled');
				$('#holidaySat').removeAttr('disabled');
				// バイオリーダー
				$('#bioflag').removeAttr('disabled');
				$('#biosize').removeAttr('disabled');
				// 発行回数あり
				$('#upcntflag').removeAttr('disabled');
				$('#upcntsize').removeAttr('disabled');
			}
		},
		regist : function(e){
			e.preventDefault();// フォーム送信を防ぐ
		
			//////////////
			// 入力チェック //
			//////////////
			// パソリログイン
			// 読取1～3全て未入力の場合
			var pasorireadstart1 = $("#pasorireadstart1").val();
			var pasorireadend1 = $("#pasorireadend1").val();
			var pasorireadstart2 = $("#pasorireadstart2").val();
			var pasorireadend2 = $("#pasorireadend2").val()
			var pasorireadstart3 = $("#pasorireadstart3").val();
			var pasorireadend3 = $("#pasorireadend3").val();				
			
			if(pasorireadstart1 == "" && pasorireadend1 !=""){
				//alert('読取開始1を設定して下さい。');
				alert($("#pasorireadstart1Error").val());
				return;	
			}
			if(pasorireadstart1 != "" && pasorireadend1 ==""){
				//alert('読取終了1を設定して下さい。');
				alert($("#pasorireadend1Error").val());
				return;	
			}			
			
			if(pasorireadstart2 == "" && pasorireadend2 !=""){
				//alert('読取開始2を設定して下さい。');
				alert($("#pasorireadstart2Error").val());
				return;	
			}
			if(pasorireadstart2 != "" && pasorireadend2 ==""){
				//alert('読取終了2を設定して下さい。');
				alert($("#pasorireadend2Error").val());
				return;	
			}
			
			if(pasorireadstart3 == "" && pasorireadend3 !=""){
				//alert('読取開始3を設定して下さい。');
				alert($("#pasorireadstart3Error").val());
				return;	
			}
			if(pasorireadstart3 != "" && pasorireadend3 ==""){
				//alert('読取終了3を設定して下さい。');
				alert($("#pasorireadend3Error").val());
				return;	
			}			

			// 読取1～3のいずれか設定されているか確認
			if(pasorireadstart1 == "" && pasorireadstart2 == "" && pasorireadstart3 == ""){
				//alert('読取開始1～3のいずれかを設定して下さい。');
				alert($("#pasorireadstartError").val());
				return;			
			}
//			if(pasorireadend1 == "" && pasorireadend2 == "" && pasorireadend3 == ""){
//				//alert('読取終了1～3のいずれかを設定して下さい。');
//				alert($("#pasorireadendError").val());
//				return;			
//			}	

			// 大小関係チェック
			if(pasorireadstart1 != "" && pasorireadend1 !="" && Number(pasorireadstart1) > Number(pasorireadend1)){
				//alert('読取1で開始>終了となっています。設定しなおして下さい。');
				alert($("#pasoriread1sizeRelationshipError").val());
				return;					
			}
			if(pasorireadstart2 != "" && pasorireadend2 !="" && Number(pasorireadstart2) > Number(pasorireadend2)){
				//alert('読取2で開始>終了となっています。設定しなおして下さい。');
				alert($("#pasoriread2sizeRelationshipError").val());
				return;					
			}
			if(pasorireadstart3 != "" && pasorireadend3 !="" && Number(pasorireadstart3) > Number(pasorireadend3)){
				//alert('読取3で開始>終了となっています。設定しなおして下さい。');
				alert($("#pasoriread3sizeRelationshipError").val());
				return;					
			}			
			
			// 機関の重複チェック
			let pasoriread = [];
			if(pasorireadstart1 != "" && pasorireadend1 !=""){
				for (let i = Number(pasorireadstart1) ;i <= Number(pasorireadend1); i++){
					pasoriread.push(i);
				}				
			}

			if(pasorireadstart2 != "" && pasorireadend2 !=""){
				for (let i = Number(pasorireadstart2) ;i <= Number(pasorireadend2); i++){
					pasoriread.push(i);
				}
			}
			if(pasorireadstart3 != "" && pasorireadend3 !=""){
				for (let i = Number(pasorireadstart3) ;i <= Number(pasorireadend3); i++){
					pasoriread.push(i);
				}
			}
			
			var duplicates = pasoriread.filter(function(value, index) {
			    return pasoriread.indexOf(value) !== index;
			});
			
			if(duplicates.length > 0){
				//alert("読取1～3のデータが重複しています。" + duplicates);
				alert($("#pasorireadduplicatesError").val() + duplicates);
				return;	
			}
			
			// データ存在チェック
			var data = {}
			var deferred = common.ajax("/initial/exist", data, { "type" : "POST" });
			
			deferred.done(function(result) {
		    		if (result.success) {
						// データが存在する
						if (result.content == true){
							//var res = confirm("初期設定データはすでに存在します。" + "\n" +  "更新しますか？");
							var res = confirm($("#initialRegistConfirm").val());
							if( res == true ) {
								// 登録処理							
								$("#InitialForm").attr("action", "/TRIDENT/initial/regist");
								$("#InitialForm").submit();								
							} else {
								return false;
							}
						} else {
							// 初期データが存在しない場合、必須入力の関係で登録できない
							//alert("システム管理者へ連絡し、初期設定マスタにデフォルトデータを登録してもらって下さい。");
							alert($("#noDataError").val());							
							return false;
						}
		    		}else{
						alert("error");
		    		}
			}).fail(function(jqXHR, textStatus, errorThrown) {
					alert($("#serverErrorMessage").val());
					return false;
			});								
		}
	};
	
	var advancedsettings = {
		regist :function(e){
			
			e.preventDefault();// フォーム送信を防ぐ
	
			//////////////
			// 入力チェック //
			//////////////
			// ウエイト
			var waittime = $("#waittime").val();	
			if(waittime == ""){
				//alert('通信異常設定ウエイトを入力してください。');
				alert($("#waittimeEmptyError").val());
				return;
			}
			if (!waittime.match(/^[0-9]+$/)){
				//alert('通信異常設定ウエイトは「1」～「100」の値を入力してください。');
				alert($("#waittimeRangeError").val());
				return;			
			}	
			var inputValue = parseInt(waittime, 10);	
			if(inputValue < 1 || inputValue > 100){
				//alert('通信異常設定ウエイトは「1」～「100」の値を入力してください。');
				alert($("#waittimeRangeError").val());
				return;	
			}
			// リトライ
			var retrycnt = $("#retrycnt").val();	
			if(retrycnt == ""){
				//alert('通信異常設定リトライを入力してください。');
				alert($("#retrycntEmptyError").val());
				return;
			}
			if (!retrycnt.match(/^[0-9]+$/)){
				//alert('通信異常設定リトライは「1」～「100」の値を入力してください。');
				alert($("#retrycntRangeError").val());
				return;			
			}	
			var inputValue = parseInt(retrycnt, 10);	
			if(inputValue < 1 || inputValue > 100){
				//alert('通信異常設定リトライは「1」～「100」の値を入力してください。');
				alert($("#retrycntRangeError").val());
				return;	
			}			
			// LANウエイト
			var lanwaittime = $("#lanwaittime").val();	
			if(lanwaittime == ""){
				//alert('LANアダプター接続設定ウエイトを入力してください。');
				alert($("#lanwaittimeEmptyError").val());
				return;
			}
			if (!lanwaittime.match(/^[0-9]+$/)){
				//alert('LANアダプター接続設定ウエイトは「1」～「100」の値を入力してください。');
				alert($("#lanwaittimeRangeError").val());
				return;			
			}	
			var inputValue = parseInt(lanwaittime, 10);	
			if(inputValue < 1 || inputValue > 1000){
				//alert('LANアダプター接続設定ウエイトは「1」～「1000」の値を入力してください。');
				alert($("#lanwaittimeRangeError").val());
				return;	
			}			
			// LANリトライ
			var lanretrycnt = $("#lanretrycnt").val();	
			if(lanretrycnt == ""){
				//alert('LANアダプター接続設定リトライを入力してください。');
				alert($("#lanretrycntEmptyError").val());
				return;
			}
			if (!lanretrycnt.match(/^[0-9]+$/)){
				//alert('LANアダプター接続設定リトライは「1」～「100」の値を入力してください。');
				alert($("#lanretrycntRangeError").val());
				return;			
			}	
			var inputValue = parseInt(lanretrycnt, 10);	
			if(inputValue < 1 || inputValue > 100){
				//alert('LANアダプター接接続設定リトライは「1」～「100」の値を入力してください。');
				alert($("#lanretrycntRangeError").val());
				return;	
			}	
			// 保存期間
			var zaikeepterm = $("#zaikeepterm").val();	
			if(zaikeepterm == ""){
				//alert('保存期間を入力してください。');
				alert($("#zaikeeptermEmptyError").val());
				return;
			}
			if (!zaikeepterm.match(/^[0-9]+$/)){
				//alert('保存期間は「0」～「999」の値を入力してください。');
				alert($("#zaikeeptermRangeError").val());
				return;			
			}	
			var inputValue = parseInt(zaikeepterm, 10);	
			if(inputValue < 0 || inputValue > 999){
				//alert('保存期間は「0」～「999」の値を入力してください。');
				alert($("#zaikeeptermRangeError").val());
				return;	
			}			
			// 削除時間(時間)
			var zaideltimeHour = $("#zaideltimeHour").val();	
			if(zaideltimeHour == ""){
				//alert('削除時刻(時)を入力してください。');
				alert($("#zaideltimeHourEmptyError").val());
				return;
			}
			if (!zaideltimeHour.match(/^[0-9]+$/)){
				//alert('削除時刻(時)は「00」～「23」の値を入力してください。');
				alert($("#zaideltimeHourRangeError").val());
				return;			
			}	
			var inputValue = parseInt(zaideltimeHour, 10);	
			if(inputValue < 0 || inputValue > 23){
				//alert('削除時刻(時)は「00」～「23」の値を入力してください。');
				alert($("#zaideltimeHourRangeError").val());
				return;	
			}			
			// 削除時間(分)
			var zaideltimeMinutes = $("#zaideltimeMinutes").val();	
			if(zaideltimeMinutes == ""){
				//alert('削除時刻(分)を入力してください。');
				alert($("#zaideltimeMinutesEmptyError").val());
				return;
			}
			if (!zaideltimeMinutes.match(/^[0-9]+$/)){
				//alert('削除時刻(分)は「00」～「59」の値を入力してください。');
				alert($("#zaideltimeMinutesRangeError").val());
				return;			
			}	
			var inputValue = parseInt(zaideltimeMinutes, 10);	
			if(inputValue < 0 || inputValue > 59){
				//alert('削除時刻(分)は「00」～「59」の値を入力してください。');
				alert($("#zaideltimeMinutesRangeError").val());
				return;	
			}					
			// データモニター表示件数
			var datamoncnt = $("#datamoncnt").val();	
			if(datamoncnt == ""){
				//alert('データモニター表示件数を入力してください。');
				alert($("#datamoncntEmptyError").val());
				return;
			}
			if (!datamoncnt.match(/^[0-9]+$/)){
				//alert('データモニター表示件数は「1」～「100」の値を入力してください。');
				alert($("#datamoncntRangeError").val());
				return;			
			}	
			var inputValue = parseInt(datamoncnt, 10);	
			if(inputValue < 1 || inputValue > 100){
				//alert('データモニター表示件数は「1」～「100」の値を入力してください。');
				alert($("#datamoncntRangeError").val());
				return;	
			}
			// アップロード時刻(時間)	
			var autouptimeHour = $("#autouptimeHour").val();	
			if(autouptimeHour == ""){
				//alert('アップロード時刻(時)を入力してください。');
				alert($("#autouptimeHourEmptyError").val());
				return;
			}
			if (!autouptimeHour.match(/^[0-9]+$/)){
				//alert('アップロード時刻(時)は「00」～「23」の値を入力してください。');
				alert($("#autouptimeHourRangeError").val());
				return;			
			}	
			var inputValue = parseInt(autouptimeHour, 10);	
			if(inputValue < 0 || inputValue > 23){
				//alert('アップロード時刻(時)は「00」～「23」の値を入力してください。');
				alert($("#autouptimeHourRangeError").val());
				return;	
			}
			// アップロード時刻(分)	
			var autouptimeMinutes = $("#autouptimeMinutes").val();	
			if(autouptimeMinutes == ""){
				//alert('アップロード時刻(分)を入力してください。');
				alert($("#autouptimeMinutesEmptyError").val());
				return;
			}
			if (!autouptimeMinutes.match(/^[0-9]+$/)){
				//alert('アップロード時刻(分)は「00」～「59」の値を入力してください。');
				alert($("#autouptimeMinutesRangeError").val());
				return;			
			}	
			var inputValue = parseInt(autouptimeMinutes, 10);	
			if(inputValue < 0 || inputValue > 59){
				//alert('アップロード時刻(分)は「00」～「59」の値を入力してください。');
				alert($("#autouptimeMinutesRangeError").val());
				return;	
			}			
			// リアルタイム読込み間隔
			var autouprealtime = $("#autouprealtime").val();	
			if(autouprealtime == ""){
				//alert('リアルタイム読込み間隔を入力してください。');
				alert($("#autouprealtimeEmptyError").val());
				return;
			}
			if (!autouprealtime.match(/^[0-9]+$/)){
				//alert('リアルタイム読込み間隔は「1」～「10」の値を入力してください。');
				alert($("#autouprealtimeRangeError").val());
				return;			
			}	
			var inputValue = parseInt(autouprealtime, 10);	
			if(inputValue < 1 || inputValue > 10){
				//alert('リアルタイム読込み間隔は「1」～「10」の値を入力してください。');
				alert($("#autouprealtimeRangeError").val());
				return;	
			}			
			// データ格納場所
			var autouppath = $("#autouppath").val();	
			if(autouppath == ""){
				//alert('データ格納場所を入力してください。');
				alert($("#autouppathEmptyError").val());
				return;
			}
			// ファイル名称
			var autoupfname = $("#autoupfname").val();	
			if(autoupfname == ""){
				//alert('ファイル名称を入力してください。');
				alert($("#autoupfnameEmptyError").val());
				return;
			}
			const pattern = /[\/:*?<>|]/;
			if (autoupfname.match(pattern)){
				// 禁止文字チェック
				//alert('ファイル名称に\\\/:*?"<>|は入力できません。');
				alert($("#autoupfnamePatternError").val());
				return;			
			}
			// 消去データ格納場所		
			var autoupoutpath = $("#autoupoutpath").val();	
			if(autoupoutpath == ""){
				//alert('消去データ格納場所を入力してください。');
				alert($("#autoupoutpathEmptyError").val());
				return;
			}	
			// 履歴データ出力場所		
			var recvoutpath = $("#recvoutpath").val();	
			if(recvoutpath == ""){
				//alert('履歴データ出力場所を入力してください。');
				alert($("#recvoutpathEmptyError").val());
				return;
			}	
			
			// データ存在チェック
			var data = {}
			var deferred = common.ajax("/initial/exist", data, { "type" : "POST" });

			deferred.done(function(result) {
					if (result.success) {
						// データが存在する
						if (result.content == true){
							//var res = confirm("初期設定データはすでに存在します。" + "\n" +  "更新しますか？");
							var res = confirm($("#initialRegistConfirm").val());
							if( res == true ) {			
								// 登録処理
								$("#advancedsettingsFrom").attr("action", "/TRIDENT/initial/advancedsettings/regist");
								$("#advancedsettingsFrom").submit();								
							} else {
								return false;
							}
						} else {
							// 初期データが存在しない場合、必須入力の関係で登録できない
							// alert("システム管理者へ連絡し、初期設定マスタにデフォルトデータを登録してもらって下さい。");
							alert($("#noDataError").val());	
							return false;
						}
					}else{
						alert("error");
					}
			}).fail(function(jqXHR, textStatus, errorThrown) {
					alert($("#serverErrorMessage").val());
					return false;
			});	
		}
	};	
	this.initialInfo = initialInfo;
	this.advancedsettings = advancedsettings;	

}();	


