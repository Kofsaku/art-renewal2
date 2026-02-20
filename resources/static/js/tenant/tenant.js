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
	
// --------------------------------------------------------------------
// テナント登録・編集画面
// --------------------------------------------------------------------
	// ゲート設定タブを選択した場合
	$("#gatesetTab").on("click", function(e){
		// 入力チェック
		var tenantno = $("#gatesetTenantno").val();

		if(tenantno == ""){
			// alert('ゲート設定を行うテナント番号を一覧から選択してください。');
			alert($("#gatesetTabMessage").val());
			// 元タブを選択しておく			
			var tenantInfoTab = document.querySelector("#tenantInfoTab");
			bootstrap.Tab.getInstance(tenantInfoTab).show();
		}
	});
	//テナント番号が入力された場合
	$("#tenantno").on("change", tenantData.searchTenantData);

	// テナント一覧のテナント番号を選択
	$("#tenantDataListTbl .selectItem").on("click", tenantData.setdata);
	
	//入力文字を半角数字（0〜9）だけに制限するための関数
	$("#tenantno").on("input", common.allowOnlyHalfWidthDigits);

	// テナント名称(name)が入力された場合
	$("#name").on("focusout", function () {
		const name = $(this).val();
		const pattern = /[\/:*?<>|]/;
		if (name.match(pattern)) {
			setTimeout(() => {
				$(this).focus();
			}, 1);
		}
	});

	// テナント名称カナ(kana)が入力された場合
	$("#kana").on("focusout", function () {
		const kana = $(this).val();
		const pattern = /[\/:*?<>|]/;
		if (kana.match(pattern)) {
			setTimeout(() => {
				$(this).focus();
			}, 1);
		}
	});
	
	// 登録ボタン押下
	$("#regist").on("click", tenantData.regist);

	// クリアボタン押下
	$("#clear").on("click", tenantData.clear);

	// 削除ボタン押下
	$("#delete").on("click", tenantData.delete);

	// ダウンロードボタン押下
	$("#download").on("click", tenantData.download);

	// データ出力ボタン押下
	$("#outputData").on("click", tenantData.outputData);

	// アップロードボタン押下
	$("#upload").on("click", tenantData.fileDialog);

	// アップロードボタン押下後、ファイルを入力した場合
	$("#uploadFile").on("change", tenantData.upload);

	// アップロード結果モーダルでOK押下
	$("#uploadOK").on("click", tenantData.uploadDialogClose);

	// 印刷ボタン押下
	$("#print").on("click", tenantData.print);	

	// アップロードのエラー内容表示
	$("#errorLink").on("click", tenantData.uploadError);

	// アップロードのエラー内容モーダルでOK押下
	$("#uploadErrorOK").on("click", tenantData.uploadErrorModalClose);	

	// 印刷モーダル閉じる
	$(".btn-close").on("click", function(){
		$("#printModal").hide();
	});

// --------------------------------------------------------------------
// ゲート設定画面
// --------------------------------------------------------------------

	// ゲート設定画面のゲートデータを選択
	//$("#gateDataListTbl .selectItem").on("click", gateset.setLeftdata);
	$("#gateDataListTbl").on("click", ".selectItem", gateset.setLeftdata);

	// ゲート設定画面の選択されたゲートデータを選択
	$("#gateDataSelectListTbl").on("click", ".selectItem", gateset.setRightdata);
	
	// ゲート設定登録ボタン押下
	$("#gateRegist").on("click", gateset.regist);	
	
	// →ボタン押下
	$("#moveRight").on("click", gateset.moveRight);
	
	// ←ボタン押下
	$("#moveLeft").on("click", gateset.moveLeft);
	
	// ←←ボタン押下
	$("#moveAllLeft").on("click", gateset.moveAllLeft);
	
});

!function() {
	
	var tenantData = {
		
		// テナント番号を選択した時
		searchTenantData : function(e){

			//　テナント番号
			var tenantno = $("#tenantno").val();
			// ゼロパディング（3桁）
			 if(tenantno !== ""){
			     tenantno = tenantno.padStart(3, "0");
			     $("#tenantno").val(tenantno);
			 }
			if(tenantno == ""){
				return;
			}

			if (!tenantno.match(/^[0-9]+$/)){
				return;			
			}
		
			var data = {"tenantno" : tenantno}
			var deferred = common.ajax("/tenant/getTenantData", data, { "type" : "POST" });
						
			deferred.done(function(result) {
		    		if (result.success) {

						// 画面に取得した値を設定(tenantno,name,kana)
						if(result.content !=null){
							$("#tenantno").val(result.content.tenantno);
							$("#name").val(result.content.name);
							$("#kana").val(result.content.kana);
							
							// ゲート設定タブの入力欄に値を設定
							$("#gatesetTenantno").val(result.content.tenantno);
							$("#gatesetName").val(result.content.name);
							
							////////////////////////////////
							// ゲート設定タブの選択ゲートを変更する //
							////////////////////////////////

							// ゲート設定タブの選択ゲートをすべて「ゲートデータ」欄に移動する(←←ボタン押下処理起動)
							gateset.moveAllLeft(e);
							
							// 1920バイトのゲートデータを対象のデータから取得
							var gateBite = result.content.gate;
							
							// ゲートデータと選択されたゲートデータのテーブルを取得
							const sourceTableBody = document.querySelector("#gateDataListTbl tbody");
							const targetTableBody = document.querySelector("#gateDataSelectListTbl tbody");

							// ゲートデータテーブルのすべての行を取得
							const allRows = Array.from(sourceTableBody.querySelectorAll("tr"));

							// 1920バイトを先頭からチェックし、"1"のバイト位置のゲートデータを、選択されたゲートデータに移動する
							for (let i = 0; i < allRows.length && i < gateBite.length; i++) {
							    if (gateBite[i] === '1') {
							        const row = allRows[i];
							        // 選択対象行を右テーブルに移動
							        targetTableBody.appendChild(row);
							    }
							}
							
						} else {
							// データがない場合、テナント番号を前03桁の形式にする
							if(tenantno.length < 3){
								$("#tenantno").val(String(tenantno).padStart(3, '0'));
							}
							
							// ゲート設定タブの入力欄をクリア
							$("#gatesetTenantno").val("");
							$("#gatesetName").val("");
							
						}
		    		}else{
						//alert("テナント情報を取得できませんでした。");
						alert($("#tenantDataErrMessage").val());
		    		}			
			}).fail(function(jqXHR, textStatus, errorThrown) {
					//alert("サーバーとの通信に失敗しました。");
					alert($("#serverFailMessage").val());
					return false;
			});					
		},
		
		// 選択したデータを入力値に設定する
		setdata : function(e){
			
				// 選択した行を取得
				var selectedRow = $(this).closest('tr');
				// 選択した行の各項目の値を取得
				var tenantno = selectedRow.children("td").eq(0).text();
				var name = selectedRow.children("td").eq(1).text();	
				var kana = selectedRow.children("td").eq(2).text();

				// 選択した行の色を変える
				$("#tenantDataListTbl").find('tr').find('td').removeClass('selectline');
				selectedRow.children("td").addClass('selectline');
				
				// 入力欄に値を設定
				$("#tenantno").val(tenantno);
				$("#name").val(name);
				$("#kana").val(kana);
				
				// ゲート設定タブの入力欄に値を設定
				$("#gatesetTenantno").val(tenantno);
				$("#gatesetName").val(name);
				
				////////////////////////////////
				// ゲート設定タブの選択ゲートを変更する //
				////////////////////////////////
				
				// ゲート設定タブの選択ゲートをすべて「ゲートデータ」欄に移動する(←←ボタン押下処理起動)
				gateset.moveAllLeft(e);
				
				// 選択した行を取得
				var selectedRow = $(this).closest('tr');

				// 1920バイトのゲートデータを選択したデータから取得
				var gateBite = selectedRow.children("input").eq(0).val();

				// ゲートデータと選択されたゲートデータのテーブルを取得
				const sourceTableBody = document.querySelector("#gateDataListTbl tbody");
				const targetTableBody = document.querySelector("#gateDataSelectListTbl tbody");

				// ゲートデータテーブルのすべての行を取得
				const allRows = Array.from(sourceTableBody.querySelectorAll("tr"));

				// 1920バイトを先頭からチェックし、"1"のバイト位置のゲートデータを、選択されたゲートデータに移動する
				for (let i = 0; i < allRows.length && i < gateBite.length; i++) {
				    if (gateBite[i] === '1') {
				        const row = allRows[i];
				        // 選択対象行を右テーブルに移動
				        targetTableBody.appendChild(row);
				    }
				}
		},

		// テナント登録・編集タブ　登録ボタン押下処理
		regist : function(e){
			e.preventDefault();// フォーム送信を防ぐ
		
			//////////////
			// 入力チェック //
			//////////////
			
			//　テナント番号の入力チェック
			var tenantno = $("#tenantno").val();
			
			if(tenantno == ""){
				//alert('テナント番号を入力してください。');
				alert($("#tenantDataErrEmptyTenantno").val());
				return;
			}
	
			if (!tenantno.match(/^[0-9]+$/)){
				//alert('テナント番号は半角数字3桁以内で入力してください。');
				alert($("#tenantDataErrInputTenantno").val());
				return;			
			}
			
			//正規表現チェック
			//名称とカナどちらも同じ入力バリデーション処理なのでまとめています
			const pattern = /[\/:*?<>|]/;
			// ①テナント名称
			if ($("#name").val().match(pattern)){
				alert($("#tenantDataErrInputName").val());
				return;			
			}
			// ➁テナント名称カナ
			if ($("#kana").val().match(pattern)){
				alert($("#tenantDataErrInputKana").val());
				return;			
			}
	
			// データ存在チェック
			var data = { "tenantno": $("#tenantno").val() };
			var deferred = common.ajax("/tenant/exist", data, { "type" : "POST" });
			
			deferred.done(function(result) {
		    		if (result.success) {
						// データが存在する
						if (result.content == true){
							//var res = confirm("指定したテナント番号のデータはすでに存在します。" + "\n" +  "更新しますか？");
							var res = confirm($("#tenantDataUpdateConfirm").val());
							if( res == true ) {
								// 登録処理
								$("#tenantForm").attr("action", "/TRIDENT/tenant/regist");
								$("#tenantForm").submit();								
							} else {
								return false;
							}
						} else {
							// 新規登録処理
							$("#tenantForm").attr("action", "/TRIDENT/tenant/regist");
							$("#tenantForm").submit();	
						}
		    		}else{
						alert("error");
		    		}
			}).fail(function(jqXHR, textStatus, errorThrown) {
					alert($("#serverFailMessage").val());
					return false;
			});								
		},
		
		// クリアボタン押下処理
		clear : function(e){	
			e.preventDefault();// フォーム送信を防ぐ
			
			$("#tenantno").val("");
			$("#name").val("");
			$("#kana").val("");		
			
			// 選択行の背景色をクリア
			$("#tenantDataListTbl").find('tr').find('td').removeClass('selectline');
			$("#gatesetTenantno").val("");
			$("#gatesetName").val("");	
			
		},
		
		// 削除ボタン押下処理
		delete : function(e){
			
			e.preventDefault();// フォーム送信を防ぐ
			
			// 入力チェック
			var tenantno = $("#tenantno").val();
			
			if(tenantno == ""){
				//alert('削除するテナント番号をテナント一覧から選択してください。')
				alert($("#tenantDataDeleteCaution").val());
				return;
			}
			//var res = confirm("指定したテナント番号のデータを削除しますか?");
			var res = confirm($("#tenantDataDeleteConfirm").val());
			if( res == true ) {
				// 削除処理
				$("#tenantForm").attr("action", "/TRIDENT/tenant/delete");
				$("#tenantForm").submit();									
			} else {
				return false;
			}				
		},
		
		// ダウンロードボタン押下処理
		download :function(e){
			e.preventDefault();// フォーム送信を防ぐ
			
			if($("#tenantDataListTbl").children("tbody").children("tr").length > 0){
				
				$("#downloadType").val("D");
				$("#DownloadFileDialog").hide();
				
				$("#tenantForm").attr("action", "/TRIDENT/tenant/outputData");
				$("#tenantForm").submit();
			} else {
				//alert("ダウンロードするテナント情報がありません。");
				alert($("#tenantDataDownloadNoData").val());
				return;
			}
		},
		
		// データ出力ボタン押下処理
		outputData :function(e){
			e.preventDefault();// フォーム送信を防ぐ
			if($("#tenantDataListTbl").children("tbody").children("tr").length > 0){
				
				// 取得したファイル名、拡張子を設定
				$("#downloadType").val("O");	
				$("#OutputFileDialog").hide();
				
				$("#tenantForm").attr("action", "/TRIDENT/tenant/outputData");
				$("#tenantForm").submit();	
			} else {		
				//alert("データ出力するテナント情報がありません。");
				alert($("#tenantDataOutputDataNoData").val());
				return;
			}						
		},
		
		// アップロードボタン押下処理
		fileDialog :function(e){
			
			e.preventDefault();// フォーム送信を防ぐ
			// ファイル選択ダイアログを表示する
			$('#uploadFile').click();
		},
	
		// アップロードボタン押下後、ファイルを選択後処理
		upload :function(e){
			e.preventDefault();// フォーム送信を防ぐ

			// 拡張子チェック
			const fileName = e.target.files[0].name;
			const fileExtension = fileName.split('.').pop().toLowerCase();
			const allowedExtensions = ['csv'];
			
			if(allowedExtensions.includes(fileExtension) == false){
				//alert("アップロード可能なファイルの種類は「csv」です。");
				alert($("#tenantDataUploadCaution").val());
				return;
			}
			
			var uploadFile = $('#uploadFile')[0].files[0];
		
			/** アップロード実行処理 */
			// ajax設定
			var formData = new FormData();
			formData.append("uploadFile", uploadFile);
			var ajaxUrl = "/tenant/upload";
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
				$(".uploadCnt").text(result.content.uploadCount);
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
				
				// テナント一覧の情報の書き換えが必要	→OKボタン押したタイミングでリフレッシュ	
			}).fail(function(jqXHR, textStatus, errorThrown) {
				alert($("#serverFailMessage").val());	
				return false;
			});
	
			// ファイルの値リセット
			$("#uploadFile").val('');
					
		},
		
		// アップロードのエラー内容表示
		uploadError :function(e){
			$("#uploadDialog").hide();	
			$("#uploadErrorModal").show();
		},
		
		// アップロード結果モーダルでOK押下
		uploadDialogClose :function(e){
			$("#uploadDialog").hide();
			
			//　テナント一覧を書き換えるため、リフレッシュ
			$("#uploadForm").attr("action", "/TRIDENT/tenant/index");
			$("#uploadForm").submit();				
			
		},
		
		// アップロードのエラー内容モーダルでOK押下
		uploadErrorModalClose :function(e){
			$("#uploadErrorModal").hide();
		},		
		 
		// 印刷ボタン押下時処理
		print :function(e){
			e.preventDefault();// フォーム送信を防ぐ
			
			var dataCnt = $("#tenantDataListTbl").children("tbody").children("tr").length
			
			if(dataCnt > 0){
				// データが1件以上ある場合
				
				//var res = confirm("テナント情報を印刷しますか？");
				var res = confirm($("#tenantDataPrintConfirm").val());
				if( res == true ) {
					
					// 操作ログを登録
					var data = {"type1":"0105006"};
					var deferred = common.ajax("/operation", data, { "type" : "POST" });

					deferred.done(function(result) {
							if (result.success) {
								// 操作ログ登録OK
							}else{
								alert("error");
							}
					}).fail(function(jqXHR, textStatus, errorThrown) {
							alert($("#serverFailMessage").val());
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

					// ↓フォーマットして .printDate に表示
					var formattedDate = year + '/' + month + '/' + day + ' ' + hours + ':' + minutes + ':' + seconds;
												
					$(".printDate").text(formattedDate);
							
					let html ='';
					//	元のテーブル（#tenantDataListTbl）の各行から、
					//テナント番号・氏名・カナ を取り出して、新しいHTMLに組み立てます。
					for (var i=0; i < dataCnt; i++){
						
						var selectedRow = $("#tenantDataListTbl").children("tbody").children("tr").eq(i);

						var tenantno = selectedRow.children("td").eq(0).text();
						var name = selectedRow.children("td").eq(1).text();
						var kana = selectedRow.children("td").eq(2).text();

						html = html + '<tr>'
						           + '<td class="col-2">' + tenantno + '</td>'
						           + '<td class="col-5">' + name + '</td>'
						           + '<td class="col-5">' + kana + '</td>'
						           + '</tr>';
										
					}	
					//組み立てたHTML（テナント情報の全行）を、#printDataTbl（印刷用テーブル）に反映させます。				
					$('#printDataTbl').html(html);	
					//印刷モーダルを表示します。これにより、画面上で印刷用データを確認できるようになります。				
					$("#printModal").show();
													
				} else {
					return false;
				}
			} else {
				// データが1件もない場合
				//alert("印刷するテナント情報がありません。");
				alert($("#tenantDataPrintNoData").val());
				return;				
			}
		}
	};
	
	var gateset = {
	
		// 選択した「ゲートデータ」欄のデータの色を変更する
		setLeftdata : function(e){
			
				// 選択した行を取得
				var selectedRow = $(this).closest('tr');
	
				// 選択した行の色を変える
				$("#gateDataListTbl").find('tr').find('td').removeClass('selectline');
				selectedRow.children("td").addClass('selectline');
				
		},
	
		// 選択した「選択されたゲートデータ」欄のデータの色を変更する
		setRightdata : function(e){
			
				// 選択した行を取得
				var selectedRow = $(this).closest('tr');

				// 選択した行の色を変える
				$("#gateDataSelectListTbl").find('tr').find('td').removeClass('selectline');
				selectedRow.children("td").addClass('selectline');
				
		},
		
		// ゲート設定タブ　登録ボタン押下処理
		regist :function(e){
			
			e.preventDefault();// フォーム送信を防ぐ

			// ゲート情報（1920バイト）を設定する
			var tenantgateArray = Array(1920).fill("0");  // 初期値は全て "0"

			// ゲート一覧から選択されているゲート番号をチェック
			$("#gateDataSelectListTbl").find("tbody tr").each(function() {
			    var gateNoText = $(this).find("td").eq(0).text().trim();  // ゲート番号取得
			    var gateIndex = parseInt(gateNoText, 10); // 数値に変換（例: "0002" → 2）

			    // ゲート番号が 1～1920 の範囲内であることを確認
			    if (!isNaN(gateIndex) && gateIndex >= 1 && gateIndex <= 1920) {
			        tenantgateArray[gateIndex - 1] = "1";  // 対応する位置に "1" を設定
			    }
			});

			// 1920バイトの文字列に変換し、valueに設定
			var tenantgate = tenantgateArray.join("");
			$("#tenantgate").val(tenantgate);
			
			//　テナント番号のdisabledをfalseに設定(サーバー側に送信するため)
			$("#gatesetTenantno").prop('disabled', false);
			
			// 登録処理
			$("#gatesetForm").attr("action", "/TRIDENT/tenant/gateset/regist");
			$("#gatesetForm").submit();
			
			//　テナント番号のdisabledをtrueに設定
			$("#gatesetTenantno").prop('disabled', true);
		},
		
		// 選択したデータを「選択されたゲートデータ」欄に移動する
		moveRight : function(e){
			
			// 左テーブルのtbody
			var leftTbody = $("#gateDataListTbl tbody");
			// 右テーブルのtbody
			var rightTbody = $("#gateDataSelectListTbl tbody");
			
			// 選択された行を取得
			const selectedRows = leftTbody.find("tr").filter(function () {
			  return $(this).find("td").first().hasClass("selectline") || $(this).children("td.selectline").length > 0;
			}).toArray();
			
			// 残っている右テーブルの行と結合
			const allRows = rightTbody.find("tr").toArray().concat(selectedRows);
			
			// ゲート番号順にソート（1列目のテキストを数値として比較）
			allRows.sort(function (a, b) {
			  const gateNoA = parseInt($(a).find("td").eq(0).text(), 10);
			  const gateNoB = parseInt($(b).find("td").eq(0).text(), 10);
			  return gateNoA - gateNoB;
			});
			
			// 元の右テーブルをクリア
			rightTbody.empty();
			
			// ソート済み行を再描画（クラス除去して移動）
			allRows.forEach(function (row) {
			  $(row).find("td").removeClass("selectline");
			  rightTbody.append(row);
			});
		},
		
		// 選択したデータを「ゲートデータ」欄に移動する
		moveLeft: function(e) {
			
			// 右テーブルのtbody
			var rightTbody = $("#gateDataSelectListTbl tbody");
			// 左テーブルのtbody
			var leftTbody = $("#gateDataListTbl tbody");
			
			// 選択された行を取得
			const selectedRows = rightTbody.find("tr").filter(function () {
			  return $(this).find("td").first().hasClass("selectline") || $(this).children("td.selectline").length > 0;
			}).toArray();
			
			// 残っている左テーブルの行と結合
			const allRows = leftTbody.find("tr").toArray().concat(selectedRows);
			
			// ゲート番号順にソート（1列目のテキストを数値として比較）
			allRows.sort(function (a, b) {
			  const gateNoA = parseInt($(a).find("td").eq(0).text(), 10);
			  const gateNoB = parseInt($(b).find("td").eq(0).text(), 10);
			  return gateNoA - gateNoB;
			});
			
			// 元の左テーブルをクリア
			leftTbody.empty();
			
			// ソート済み行を再描画（クラス除去して移動）
			allRows.forEach(function (row) {
			  $(row).find("td").removeClass("selectline");
			  leftTbody.append(row);
			});
		},
		
		// 「選択されたゲートデータ」欄の全項目を「ゲートデータ」欄に移動する
		moveAllLeft: function(e) {
			
			// 右テーブルのtbody
			var rightTbody = $("#gateDataSelectListTbl tbody");
			// 左テーブルのtbody
			var leftTbody = $("#gateDataListTbl tbody");
	
			// 右テーブルのすべての行を取得（配列）
			var rightRows = rightTbody.find("tr").toArray();
	
			// 左テーブルのすべての行も取得（配列）
			var leftRows = leftTbody.find("tr").toArray();
	
			// 右テーブルの行をすべて左テーブル行配列に追加（移動するためjQueryではなく配列として扱う）
			var allRows = leftRows.concat(rightRows);
	
			// すべての行をゲート番号（1列目td）で昇順にソート
			allRows.sort(function(a, b) {
			  var gateNoA = parseInt($(a).find("td").eq(0).text(), 10);
			  var gateNoB = parseInt($(b).find("td").eq(0).text(), 10);
			  return gateNoA - gateNoB;
			});
	
			// 右テーブルtbodyを空にする（すべて移動したので）
			rightTbody.empty();
	
			// 左テーブルtbodyを空にする（入れ替えのため）
			leftTbody.empty();
	
			// ソート済みの行を左テーブルにappend
			allRows.forEach(function(row) {
			  $(row).find("td").removeClass("selectline");
			  leftTbody.append(row);
			});
		}
	};
	
	this.tenantData = tenantData;
	this.gateset = gateset;	
}();	


