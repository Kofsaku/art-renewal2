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
	
	// アンチパスタブを選択した場合
	$("#antipassTab").on("click", function(e){
		// 入力チェック
		var gateno = $("#antipassGateno").val();

		if(gateno == ""){
			// alert('アンチパス送信設定を行うゲート番号を一覧から選択してください。');
			alert($("#antipassTabMessage").val());
			// 元タブを選択しておく			
			var gateInfoTab = document.querySelector("#gateInfoTab");
			bootstrap.Tab.getInstance(gateInfoTab).show();
		}			
	});	

	// ゲート番号が入力された場合
	$("#gateno").on("change", gateData.searchGateData);
			
 	// ゲート一覧のゲート番号を選択
 	$("#gateDataListTbl .selectItem").on("click", gateData.setdata);

	// 装置タイプ変更時のチェックボックス設定処理
	$("#hosttype").on("change", function() {
	    const selectedValue = $(this).val(); // 選択値を取得

	    // 条件に応じてチェックON/OFF(既存データの場合もチェックを切り替える)
	    if (["0", "1", "2", "3"].includes(selectedValue)) {
			// 以下の装置タイプの場合
			// XA-01/02(12) (WA-01/02(12))
			// XA-01/02(20) (WA-01/02(20))
			// XA-08(12) (WA-08/16(12))
			// XA-08(20) (WA-08/16(20))
			
			// チェックON
	        $("#gatetype_0").prop("checked", true);
			$("#gatetype_1").prop("checked", true);
			$("#gatetype_2").prop("checked", true);
			$("#gatetype_3").prop("checked", true);
			$("#gatetype_4").prop("checked", true);
			$("#gatetype_5").prop("checked", true);
			
			// チェックOFF
			$("#gatetype_8").prop("checked", false);
			$("#gatetype_9").prop("checked", false);
			
	    } else if (["4", "5"].includes(selectedValue)) {
			// 以下の装置タイプの場合
			// XS-06 (WSENS-06)
			// XS-24 (WSENS-24)
			
			// チェックON
		    $("#gatetype_0").prop("checked", true);
			$("#gatetype_2").prop("checked", true);
			$("#gatetype_3").prop("checked", true);
			
			// チェックOFF
			$("#gatetype_1").prop("checked", false);
			$("#gatetype_4").prop("checked", false);
			$("#gatetype_5").prop("checked", false);
			$("#gatetype_8").prop("checked", false);
			$("#gatetype_9").prop("checked", false);
			
		} else if (["6", "7", "8", "9"].includes(selectedValue)) {
			// 以下の装置タイプの場合
			// ELV-08(12)
			// ELV-08(20)
			// ELV-24(12)
			// ELV-24(20)
			
			// チェックON
			$("#gatetype_0").prop("checked", true);
			$("#gatetype_1").prop("checked", true);
			$("#gatetype_2").prop("checked", true);
			$("#gatetype_3").prop("checked", true);
			$("#gatetype_4").prop("checked", true);

			// チェックOFF
			$("#gatetype_5").prop("checked", false);
			$("#gatetype_8").prop("checked", false);
			$("#gatetype_9").prop("checked", false);
		}
	});
	
	// ホスト番号が入力された場合
	$("#hostno").on("focusout",　function(){
		// 前0付加する
		var hostno = $("#hostno").val();
		if (!hostno.match(/^[0-9]+$/)){
			return;			
		}
		if(hostno.length < 3 && hostno !=""){
			$("#hostno").val(String(hostno).padStart(3, '0'));
		}
	});	

	// アドレス番号が入力された場合
	$("#addressno").on("focusout",　function(){
		// 前0付加する
		var addressno = $("#addressno").val();
		if (!addressno.match(/^[0-9]+$/)){
			return;			
		}
		if(addressno.length < 2 && addressno !=""){
			$("#addressno").val(String(addressno).padStart(2, '0'));
		}
	});
	
	// 装置内回線番号が入力された場合
	$("#rgateno").on("focusout",　function(){
		// 前0付加する
		var rgateno = $("#rgateno").val();
		if (!rgateno.match(/^[0-9]+$/)){
			return;			
		}
		if(rgateno.length < 2 && rgateno !=""){
			$("#rgateno").val(String(rgateno).padStart(2, '0'));
		}
	});

	// 在室番号が入力された場合
	$("#zaino").on("focusout",　function(){
		// 前0付加する
		var zaino = $("#zaino").val();
		if (!zaino.match(/^[0-9]+$/)){
			return;			
		}
		if(zaino.length < 4 && zaino !=""){
			$("#zaino").val(String(zaino).padStart(4, '0'));
		}
	});
			
	// 登録ボタン押下
	$("#regist").on("click",　gateData.regist);
	
	// クリアボタン押下
	$("#clear").on("click",　gateData.clear);
	
	// 削除ボタン押下
	$("#delete").on("click",　gateData.delete);

	// ダウンロードボタン押下
	$("#download").on("click",　gateData.download);

	// データ出力ボタン押下
	$("#outputData").on("click",　gateData.outputData);
		
	// アップロードボタン押下
	$("#upload").on("click",　gateData.fileDialog);
	
	// アップロードボタン押下後、ファイルを入力した場合
	$("#uploadFile").on("change",　gateData.upload);

	// アップロード結果モーダルでOK押下
	$("#uploadOK").on("click",　gateData.uploadDialogClose);
			
	// 印刷ボタン押下
	$("#print").on("click",　gateData.print);	
	
	// アンチパス送信登録ボタン押下
	$(document).on("click", ".antipassRegist", antipass.regist);	
	
	// アンチパス送信クリアボタン押下
	//$("#antipassclear").on("click", antipass.clear);
	$(document).on("click", ".antipassclear", antipass.clear);
	
	// アップロードのエラー内容表示
	$("#errorLink").on("click", gateData.uploadError);

	// アップロードのエラー内容モーダルでOK押下
	$("#uploadErrorOK").on("click",　gateData.uploadErrorModalClose);	

	// 印刷モーダル閉じる
	$(".btn-close").on("click",　function(){
		$("#printModal").hide();
	});
});

!function() {
	
	var gateData = {
		
		// ゲート番号を選択した時
		searchGateData : function(e){

			//　ゲート番号
			var gateno = $("#gateno").val();
			
			if(gateno == ""){
				return;
			}

			if (!gateno.match(/^[0-9]+$/)){
				return;			
			}
			
			var gateno = $("#gateno").val();
			var data = {"gateno" : gateno}
			var deferred = common.ajax("/gateRegistration/getGateData", data, { "type" : "POST" });
			
			deferred.done(function(result) {
		    		if (result.success) {

						// 画面に取得した値を設定
						if(result.content !=null){
							$("#gateno").val(result.content.gateno);
							$("#hosttype").val(result.content.hosttype);
							$("#hostno").val(result.content.hostno);
							$("#addressno").val(result.content.addressno);
							$("#rgateno").val(result.content.rgateno);
							$("#name").val(result.content.name);
							$("#zaino").val(result.content.zaino);
							if (result.content.gatetype_0 == '1'){
								$("#gatetype_0").prop('checked', true);
							} else {
								$("#gatetype_0").prop('checked', false);
							}
							if (result.content.gatetype_1 == '1'){
								$("#gatetype_1").prop('checked', true);
							} else {
								$("#gatetype_1").prop('checked', false);
							}
							if (result.content.gatetype_2 == '1'){
								$("#gatetype_2").prop('checked', true);
							} else {
								$("#gatetype_2").prop('checked', false);
							}
							if (result.content.gatetype_3 == '1'){
								$("#gatetype_3").prop('checked', true);
							} else {
								$("#gatetype_3").prop('checked', false);
							}
							if (result.content.gatetype_4 == '1'){
								$("#gatetype_4").prop('checked', true);
							} else {
								$("#gatetype_4").prop('checked', false);
							}
							if (result.content.gatetype_5 == '1'){
								$("#gatetype_5").prop('checked', true);
							} else {
								$("#gatetype_5").prop('checked', false);
							}
							if (result.content.gatetype_6 == '1'){
								$("#gatetype_6").prop('checked', true);
							} else {
								$("#gatetype_6").prop('checked', false);
							}
							if (result.content.gatetype_7 == '1'){
								$("#gatetype_7").prop('checked', true);
							} else {
								$("#gatetype_7").prop('checked', false);
							}
							if (result.content.gatetype_8 == '1'){
								$("#gatetype_8").prop('checked', true);
							} else {
								$("#gatetype_8").prop('checked', false);
							}
							if (result.content.gatetype_9 == '1'){
								$("#gatetype_9").prop('checked', true);
							} else {
								$("#gatetype_9").prop('checked', false);
							}
							if (result.content.gatetype_A == '1'){
								$("#gatetype_A").prop('checked', true);
							} else {
								$("#gatetype_A").prop('checked', false);
							}
							if (result.content.gatetype_B == '1'){
								$("#gatetype_B").prop('checked', true);
							} else {
								$("#gatetype_B").prop('checked', false);
							}
							if (result.content.gatetype_C == '1'){
								$("#gatetype_C").prop('checked', true);
							} else {
								$("#gatetype_C").prop('checked', false);
							}
							if (result.content.gatetype_D == '1'){
								$("#gatetype_D").prop('checked', true);
							} else {
								$("#gatetype_D").prop('checked', false);
							}
							if (result.content.gatetype_E == '1'){
								$("#gatetype_E").prop('checked', true);
							} else {
								$("#gatetype_E").prop('checked', false);
							}
							if (result.content.gatetype_F == '1'){
								$("#gatetype_F").prop('checked', true);
							} else {
								$("#gatetype_F").prop('checked', false);
							}
							
							$("#antipassGateno").val(result.content.gateno);
							$("#antipassName").val(result.content.name);
							
						} else {
							// データがない場合、ゲート番号を前04桁の形式にする
							if(gateno.length < 4){
								$("#gateno").val(String(gateno).padStart(4, '0'));
							}
						}
		    		}else{
						//alert("ゲート情報を取得できませんでした。");
						alert($("#gateDataErrMessage").val());
		    		}			
			}).fail(function(jqXHR, textStatus, errorThrown) {
					//alert("サーバーとの通信に失敗しました。");
					alert($("#serverErrorMessage").val());
					return false;
			});					
		},
		
		// 選択したデータを入力値に設定する
		setdata : function(e){
			
				// 選択した行を取得
				var selectedRow = $(this).closest('tr');

				// 選択した行の各項目の値を取得
				var gateno = selectedRow.children("td").eq(0).text();
//				var devicename = selectedRow.children("td").eq(1).text();	// 画面上は装置タイプ名称
				var hostno = selectedRow.children("td").eq(2).text();
				var addressno = selectedRow.children("td").eq(3).text();
				var rgateno = selectedRow.children("td").eq(4).text();
				var name = selectedRow.children("td").eq(5).text();
				var zaino = selectedRow.children("td").eq(6).text();
				var gatetype = selectedRow.children("td").eq(7).text();

				var insendgate = selectedRow.children("input").eq(0).val();
				var outsendgate = selectedRow.children("input").eq(1).val();
				var hosttype = selectedRow.children("input").eq(2).val();	// 装置タイプ

				// 選択した行の色を変える
				
				$("#gateDataListTbl").find('tr').find('td').removeClass('selectline');
				selectedRow.children("td").addClass('selectline');
				
				
				// 入力欄に値を設定
				$("#gateno").val(gateno);
				$("#hosttype").val(hosttype);
				$("#hostno").val(hostno);
				$("#addressno").val(addressno);
				$("#rgateno").val(rgateno);
				$("#name").val(name);
				$("#zaino").val(zaino);
				if (gatetype.substring(0, 1) == '1'){
					$("#gatetype_0").prop('checked', true);
				} else {
					$("#gatetype_0").prop('checked', false);
				}
				if (gatetype.substring(1, 2) == '1'){
					$("#gatetype_1").prop('checked', true);
				} else {
					$("#gatetype_1").prop('checked', false);
				}
				if (gatetype.substring(2, 3) == '1'){
					$("#gatetype_2").prop('checked', true);
				} else {
					$("#gatetype_2").prop('checked', false);
				}
				if (gatetype.substring(3, 4) == '1'){
					$("#gatetype_3").prop('checked', true);
				} else {
					$("#gatetype_3").prop('checked', false);
				}
				if (gatetype.substring(5, 6) == '1'){
					$("#gatetype_4").prop('checked', true);
				} else {
					$("#gatetype_4").prop('checked', false);
				}
				if (gatetype.substring(6, 7) == '1'){
					$("#gatetype_5").prop('checked', true);
				} else {
					$("#gatetype_5").prop('checked', false);
				}
				if (gatetype.substring(7, 8) == '1'){
					$("#gatetype_6").prop('checked', true);
				} else {
					$("#gatetype_6").prop('checked', false);
				}
				if (gatetype.substring(8, 9) == '1'){
					$("#gatetype_7").prop('checked', true);
				} else {
					$("#gatetype_7").prop('checked', false);
				}
				if (gatetype.substring(10, 11) == '1'){
					$("#gatetype_8").prop('checked', true);
				} else {
					$("#gatetype_8").prop('checked', false);
				}
				if (gatetype.substring(11, 12) == '1'){
					$("#gatetype_9").prop('checked', true);
				} else {
					$("#gatetype_9").prop('checked', false);
				}
				if (gatetype.substring(12, 13) == '1'){
					$("#gatetype_A").prop('checked', true);
				} else {
					$("#gatetype_A").prop('checked', false);
				}
				if (gatetype.substring(13, 14) == '1'){
					$("#gatetype_B").prop('checked', true);
				} else {
					$("#gatetype_B").prop('checked', false);
				}
				if (gatetype.substring(15, 16) == '1'){
					$("#gatetype_C").prop('checked', true);
				} else {
					$("#gatetype_C").prop('checked', false);
				}
				if (gatetype.substring(16, 17) == '1'){
					$("#gatetype_D").prop('checked', true);
				} else {
					$("#gatetype_D").prop('checked', false);
				}
				if (gatetype.substring(17, 18) == '1'){
					$("#gatetype_E").prop('checked', true);
				} else {
					$("#gatetype_E").prop('checked', false);
				}
				if (gatetype.substring(18, 19) == '1'){
					$("#gatetype_F").prop('checked', true);
				} else {
					$("#gatetype_F").prop('checked', false);
				}
				
				$("#antipassGateno").val(gateno);
				$("#antipassName").val(name);
				
				var GateCount = $("#gateDataListTbl").children("tbody").children("tr").length
				if (insendgate==null || insendgate == ""){
					for (var i=0; i < GateCount; i++) {					
						$("#insendgate" + i).val("");
					}	
				} else {
					// アンチパス送信のゲート状態を設定する
					for (var i=0; i < GateCount; i++) {
						if(i==insendgate.length){
							break;
						}						
						$("#insendgate" + i).val(insendgate.substring(i, i+1));
					}						
				}

				if (outsendgate==null || outsendgate == ""){
					for (var i=0; i < GateCount; i++) {
						$("#outsendgate" + i).val("");
					}
				} else {
					// アンチパス送信のゲート状態を設定する
					for (var i=0; i < GateCount; i++) {
						if(i==outsendgate.length){
							break;
						}
						$("#outsendgate" + i).val(outsendgate.substring(i, i+1));
					}						
				}
		},

		regist : function(e){
			e.preventDefault();// フォーム送信を防ぐ
		
			//////////////
			// 入力チェック //
			//////////////
			//　ゲート番号
			var gateno = $("#gateno").val();
			
			if(gateno == ""){
				//alert('ゲート番号を入力してください。');
				alert($("#gateDataErrEmptyGateno").val());
				return;
			}
			if (!gateno.match(/^[0-9]+$/)){
				//alert('ゲート番号は半角数字4桁以内で入力してください。');
				alert($("#gateDataErrInputGateno").val());
				return;			
			}
			// ゲート番号を数値化
			var gateValue = parseInt($("#gateno").val(), 10);
			if (gateValue < 1 || gateValue > 1920) {
				//alert('ゲート番号は1～1920の範囲で入力してください。');
			    alert($("#gateDataErrRangeGateno").val());
			    return;
			}
			
			// ホスト番号
			if($("#hostno").val() == ""){
				//alert('ホスト番号を入力してください。');
				alert($("#gateDataErrEmptyHostno").val());
				return;
			}			
			if (!$("#hostno").val().match(/^[0-9]+$/)){
				//alert('ホスト番号は半角数字3桁以内で入力してください。');
				alert($("#gateDataErrInputHostno").val());
				return;			
			}	
			// ホスト番号を数値化
			var hostValue = parseInt($("#hostno").val(), 10);
			if (hostValue < 1 || hostValue > 120) {
				//alert('ホスト番号は1～120の範囲で入力してください。');
			    alert($("#gateDataErrRangeHostno").val());
			    return;
			}
			
			// アドレス番号
			if($("#addressno").val() == ""){
				//alert('アドレス番号を入力してください。');
				alert($("#gateDataErrEmptyAddressno").val());
				return;
			}
			if (!$("#addressno").val().match(/^[0-9]+$/)){
				//alert('アドレス番号は半角数字3桁以内で入力してください。');
				alert($("#gateDataErrInputAddressno").val());
				return;			
			}
			// アドレス番号を数値化
			var addressValue = parseInt($("#addressno").val(), 10);
			if (addressValue === 0) {
				//alert('アドレス番号には0以外を入力してください。');
			    alert($("#gateDataErrInputNotzeroAddressno").val());
			    return;
			}
			
			// 装置内回線番号
			if($("#rgateno").val() == ""){
				//alert('装置内回線番号を入力してください。');
				alert($("#gateDataErrEmptyRgateno").val());
				return;
			}
			if (!$("#rgateno").val().match(/^[0-9]+$/)){
				//alert('装置内回線番号は半角数字2桁以内で入力してください。');
				alert($("#gateDataErrInputRgateno").val());
				return;			
			}	
			// 装置内回線番号を数値化
			var rgateValue = parseInt($("#rgateno").val(), 10);
			if (rgateValue === 0) {
				//alert('装置内回線番号には0以外を入力してください。');
			    alert($("#gateDataErrInputNotzeroRgateno").val());
			    return;
			}
			
			// ゲート名称
			const pattern = /[\/:*?<>|]/;
			if ($("#name").val().match(pattern)){
				// 禁止文字チェック
				//alert('ゲート名称に\\\/:*?<>|は入力できません。');
				alert($("#gateDataErrInputGateName").val());
				return;			
			}			
			
			// 在室番号
			if (!$("#zaino").val().match(/^[0-9]+$/)){
				//alert('在室番号は半角数字3桁以内で入力してください。');
				alert($("#gateDataErrInputZaino").val());
				return;			
			}
			// 在室番号を数値化
			var zaiValue = parseInt($("#zaino").val(), 10);
			if (zaiValue === 0) {
				//alert('在室番号には0以外を入力してください。');
			    alert($("#gateDataErrInputNotzeroZaino").val());
			    return;
			}
			
			// 最大接続回数を設定
			var selectedIndex = $('#hosttype').prop('selectedIndex');

			if(selectedIndex == 0){
				// 未選択のため何もしない
			} else {
				var setcnt = $("#setcntList").children("div").eq(selectedIndex-1).text();
				$("#setcntList").val(setcnt);
			}

			// データ存在チェック
			var data = {"gateno" : gateno}
			var deferred = common.ajax("/gateRegistration/exist", data, { "type" : "POST" });
			
			deferred.done(function(result) {
		    		if (result.success) {
						// データが存在する
						if (result.content == true){
							//var res = confirm("指定したゲート番号のデータはすでに存在します。" + "\n" +  "更新しますか？");
							var res = confirm($("#gateDataRegistConfirm").val());
							if( res == true ) {
								// 登録処理
								$("#GateRegistrationForm").attr("action", "/TRIDENT/gateRegistration/regist");
								$("#GateRegistrationForm").submit();								
							} else {
								return false;
							}
						} else {
							// 新規登録処理
							$("#GateRegistrationForm").attr("action", "/TRIDENT/gateRegistration/regist");
							$("#GateRegistrationForm").submit();	
						}
		    		}else{
						alert("error");
		    		}
			}).fail(function(jqXHR, textStatus, errorThrown) {
					alert($("#serverErrorMessage").val());
					return false;
			});								
		},
		
		clear : function(e){	
			e.preventDefault();// フォーム送信を防ぐ
			
			$("#gateno").val("");
			$("#hosttype").val("");
			$("#hostno").val("");
			$("#addressno").val("");
			$("#rgateno").val("");
			$("#name").val("");
			$("#zaino").val("");		
			
			$("#gatetype_0").prop('checked', false);
			$("#gatetype_1").prop('checked', false);
			$("#gatetype_2").prop('checked', false);
			$("#gatetype_3").prop('checked', false);
			$("#gatetype_4").prop('checked', false);
			$("#gatetype_5").prop('checked', false);
			$("#gatetype_6").prop('checked', false);
			$("#gatetype_7").prop('checked', false);
			$("#gatetype_8").prop('checked', false);
			$("#gatetype_9").prop('checked', false);
			$("#gatetype_A").prop('checked', false);
			$("#gatetype_B").prop('checked', false);
			$("#gatetype_C").prop('checked', false);
			$("#gatetype_D").prop('checked', false);
			$("#gatetype_E").prop('checked', false);
			$("#gatetype_F").prop('checked', false);
			
			// 選択行の背景色をクリア
			$("#gateDataListTbl").find('tr').find('td').removeClass('selectline');
			$("#antipassGateno").val("");
			$("#antipassName").val("");	
			
		},
		
		delete : function(e){
				
			// 入力チェック
			var gateno = $("#gateno").val();
			
			if(gateno == ""){
				//alert('削除するゲート番号をゲート一覧から選択してください。')
				alert($("#gateDataDeleteCaution").val());
				return;
			}
			//var res = confirm("指定したゲート番号のデータを削除しますか?");
			var res = confirm($("#gateDataDeleteConfirm").val());
			if( res == true ) {
				// 削除処理
				$("#GateRegistrationForm").attr("action", "/TRIDENT/gateRegistration/delete");
				$("#GateRegistrationForm").submit();									
			} else {
				return false;
			}				
		},
		
		download :function(e){
			e.preventDefault();// フォーム送信を防ぐ
			
			if($("#gateDataListTbl").children("tbody").children("tr").length > 0){
				
				$("#downloadType").val("D");
				$("#DownloadFileDialog").hide();
				
				//処理
				$("#GateRegistrationForm").attr("action", "/TRIDENT/gateRegistration/outputData");
				$("#GateRegistrationForm").submit();
			} else {
				//alert("ダウンロードするゲート情報がありません。");
				alert($("#gateDataDownloadNoData").val());
				return;
			}
		},
						
		outputData :function(e){
			e.preventDefault();// フォーム送信を防ぐ
			if($("#gateDataListTbl").children("tbody").children("tr").length > 0){
				// 取得したファイル名、拡張子を設定
				$("#downloadType").val("O");			
				$("#OutputFileDialog").hide();
				
				//処理
				$("#GateRegistrationForm").attr("action", "/TRIDENT/gateRegistration/outputData");
				$("#GateRegistrationForm").submit();	
			} else {		
				//alert("データ出力するゲート情報がありません。");
				alert($("#gateDataOutputDataNoData").val());
				return;
			}						
		},
		
		fileDialog :function(e){
			
			e.preventDefault();// フォーム送信を防ぐ
			// ファイル選択ダイアログを表示する
			$('#uploadFile').click();
		},
	
		upload :function(e){
			e.preventDefault();// フォーム送信を防ぐ

			// 拡張子チェック
			const fileName = e.target.files[0].name;
			const fileExtension = fileName.split('.').pop().toLowerCase();
			const allowedExtensions = ['csv'];
					
			if(allowedExtensions.includes(fileExtension) == false){
				//alert("アップロード可能なファイルの種類は「csv」です。");
				alert($("#gateDataUploadCaution").val());
				return;
			}

			var uploadFile = $('#uploadFile')[0].files[0];
		
			/** アップロード実行処理 *//////////////////////////
			// ajax設定
			var formData = new FormData();
			formData.append("uploadFile", uploadFile);
			var ajaxUrl = "/gateRegistration/upload";
			// ajax
			$.ajax({
				type : "POST", // HTTP通信の種類
				url : "/TRIDENT" + ajaxUrl, // リクエストを送信する先のURL
				dataType : "json", // サーバーから返されるデータの型
				data : formData, // サーバーに送信するデータ
				cache : false,
				processData : false,
				contentType : false,
			}).done(function(result) {		
				// 処理結果記載のモーダル画面を表示
				$(".updoadCnt").text(result.content.uploadCount);
				$(".updateCnt").text(result.content.updateCount);
				$(".errorCnt").text(result.content.errorCount);

				if(result.content.errorCount > 0){
					// エラーがあった場合
					$("#labelComfirm").addClass("hidden");
					$(".uploadOKMsg").addClass("hidden");
					$(".uploadNG").removeClass("hidden");
					$("#labelError").removeClass("hidden");
					
					// エラーの内容を作成				
					let html ='';
					for (var i=0; i < result.content.errorList.length; i++){
						var res = result.content.errorList[i].split(',');	
						html = html + '<div class="col-1">' + res[0]  + '</div>' + '<div class="col-11">' + res[1] + '</div>';					
					}					
					$('#errorDataTbl').html(html);

				} else {
					// エラーがなかった場合
					$("#labelComfirm").removeClass("hidden");
					$(".uploadOKMsg").removeClass("hidden");
					$(".uploadNG").addClass("hidden");
					$("#labelError").addClass("hidden");
				}

				$("#uploadDialog").show();
				
				// ゲート一覧の情報の書き換えが必要	→OKボタン押したタイミングでリフレッシュ	
			}).fail(function(jqXHR, textStatus, errorThrown) {
				alert($("#serverErrorMessage").val());	
				return false;
			});
	
			// ファイルの値リセット
			$("#uploadFile").val('');
					
		},
		
		uploadError :function(e){
			$("#uploadDialog").hide();	
			$("#uploadErrorModal").show();
		},
		
		uploadDialogClose :function(e){
			$("#uploadDialog").hide();
			
			//　ゲート一覧を書き換えるため、リフレッシュ
			$("#uploadForm").attr("action", "/TRIDENT/gateRegistration/index");
			$("#uploadForm").submit();				
			
		},
		
		uploadErrorModalClose :function(e){
			$("#uploadErrorModal").hide();
		},		
		 	
		print :function(e){
			e.preventDefault();// フォーム送信を防ぐ
			
			var dataCnt = $("#gateDataListTbl").children("tbody").children("tr").length
			
			if(dataCnt > 0){
				
				//var res = confirm("ゲート情報を印刷しますか？");
				var res = confirm($("#gateDataPrintConfirm").val());
				if( res == true ) {
					
					// 操作ログを登録
					var data = {"type1":"0103006"};
					var deferred = common.ajax("/operation", data, { "type" : "POST" });

					deferred.done(function(result) {
							if (result.success) {
								// 操作ログ登録OK
							}else{
								alert("error");
							}
					}).fail(function(jqXHR, textStatus, errorThrown) {
							alert($("#serverErrorMessage").val());
							return false;
					});					
							
					// 印刷用のモーダル画面を表示
					// 印刷内容作成	
					// データ件数
					$(".listCnt").text(dataCnt);
					//　印刷日
					// 現在の日時を取得
					var now = new Date();
					// 年、月、日、時、分、秒を取得
				    var year 	= now.getFullYear();
					var month   = common.zeroPad(now.getMonth() + 1); // 月は0から始まるため+1
					var day     = common.zeroPad(now.getDate());
					var hours   = common.zeroPad(now.getHours());
					var minutes = common.zeroPad(now.getMinutes());
					var seconds = common.zeroPad(now.getSeconds());

					// フォーマットされた日時を作成
					var formattedDate = year + '/' + month + '/' + day + ' ' + hours + ':' + minutes + ':' + seconds;
												
					$(".printDate").text(formattedDate);
							
					let html ='';
					for (var i=0; i < dataCnt; i++){
						
						var selectedRow = $("#gateDataListTbl").children("tbody").children("tr").eq(i);
						
						var gateno = selectedRow.children("td").eq(0).text();
						var devicename = selectedRow.children("td").eq(1).text();	// 画面上は装置タイプ名称
						var hostno = selectedRow.children("td").eq(2).text();
						var addressno = selectedRow.children("td").eq(3).text();
						var rgateno = selectedRow.children("td").eq(4).text();
						var name = selectedRow.children("td").eq(5).text();
						var zaino = selectedRow.children("td").eq(6).text();
						var gatetype = selectedRow.children("td").eq(7).text();
						
						html = html + '<tr>'
									+ '<td class="col-1">' + gateno  + '</td>' + '<td class="col-3">' + devicename + '</td>' 
									+ '<td class="col-1">' + hostno + '</td>' + '<td class="col-1">' + addressno + '</td>' 
									+ '<td class="col-1">' + rgateno + '</td>' + '<td class="col-3">' + name + '</td>'
									+ '<td class="col-1">' + zaino + '</td>' + '<td class="col-2">' + gatetype + '</td>'
									+ '</tr>'
									;					
					}					
					$('#printDataTbl').html(html);					
					$("#printModal").show();
													
				} else {
					return false;
				}
			} else {
				//alert("印刷するゲート情報がありません。");
				alert($("#gateDataPrintNoData").val());
				return;				
			}
						
			
		}
	};
	
	var antipass = {
		regist :function(e){
			
			e.preventDefault();// フォーム送信を防ぐ
	
			var insendgate = "";
			var outsendgate = "";
			
			var gateCount = $("#gateDataListTbl").children("tbody").children("tr").length
			for (var i=0; i < gateCount; i++){
				
				if($("#insendgate" + i).val() == null || $("#insendgate" + i).val() == ""){
					insendgate = insendgate + "3";
				} else {
					insendgate = insendgate + $("#insendgate" + i).val();
				}
				if($("#outsendgate" + i).val() == null || $("#outsendgate" + i).val() == ""){
					outsendgate = outsendgate + "3";
				} else {
					outsendgate = outsendgate + $("#outsendgate" + i).val();
				}
			}			
					
			var maxcount = 1920 - gateCount;
			for (var i=0; i < maxcount; i++){
				insendgate = insendgate + "3";
				outsendgate = outsendgate + "3";
			}

			$("#insendgate").val(insendgate);
			$("#outsendgate").val(outsendgate);
			
			//ゲート番号の
			$("#antipassGateno").prop('disabled', false);
			
			// 登録処理
			$("#antipassFrom").attr("action", "/TRIDENT/gateRegistration/antipass/regist");
			$("#antipassFrom").submit();				
		},
			
		clear : function(e){	
			
			e.preventDefault();// フォーム送信を防ぐ

			// 以下はクリアしない
//			$("#antipassGateno").val("");
//			$("#antipassName").val("");	

			// ゲート数
			var GateCount = $("#gateDataListTbl").children("tbody").children("tr").length
			for (var i=0; i < GateCount; i++)	{
				$("#insendgate" + i).val("");
				$("#outsendgate" + i).val("");
			}			
		}	
	};	
	
	this.gateData = gateData;
	this.antipass = antipass;	
}();	


