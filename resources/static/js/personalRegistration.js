/**
 * 個人登録/編集画面のJavaScript
 * Personal Registration/Edit Screen JavaScript
 */

// 個人登録管理クラス
class PersonalRegistration {
    constructor() {
        this.currentData = {};
        this.isEditMode = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeForm();
    }

    bindEvents() {
        // フォーム送信イベント (Item 20)
        $('#sendBtn').on('click', () => this.sendData());
        $('#saveBtn').on('click', () => this.savePerson());
        $('#deleteBtn').on('click', () => this.deletePerson());
        $('#eraseBtn').on('click', () => this.eraseData());
        $('#cancelBtn').on('click', () => this.cancelEdit());
        $('#clearBtn').on('click', () => this.clearForm());

        // 検索ボタンイベント
        $('.btn-reference').on('click', (e) => this.handleReferenceClick(e));

        // 写真関連イベント
        $('#photoUpload').on('change', (e) => this.handlePhotoUpload(e));
        $('#photoDelete').on('click', () => this.deletePhoto());

        // フォーム入力イベント
        $('#personCode').on('input', () => this.validatePersonCode());
        $('#personCode').on('blur', () => this.autoFillFromPersonCode());
        $('input[required]').on('input', () => this.validateForm());

        // 日付入力の文字数制御と数字のみ許可
        $('.date-input').on('input', (e) => this.handleDateInput(e));

        // 代替設定スイッチ (Item 17)
        $('#altSettingSwitch').on('change', (e) => this.toggleAltSettings(e.target.checked));

        // チェックボックス制御
        $('#bioAuth').on('change', () => this.toggleBioFields());
        $('#antiPassback').on('change', () => this.toggleAntiPassback());

        // Enterキー押下時の自動入力処理
        this.setupEnterKeyHandlers();
    }

    initializeForm() {
        // URLパラメータから編集モードかどうかを判定
        const urlParams = new URLSearchParams(window.location.search);
        const personId = urlParams.get('id');
        
        if (personId) {
            this.isEditMode = true;
            this.loadPersonData(personId);
        } else {
            this.isEditMode = false;
            this.setDefaultValues();
        }

        this.updateFormTitle();
        this.validateForm();
        this.setupDatePickers(); // No.12
    }
    
    // No.12: Date picker setup
    setupDatePickers() {
        // Set current date as default
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayString = `${year}-${month}-${day}`;
        
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        
        if (startDateInput && !startDateInput.value) {
            startDateInput.value = todayString;
        }
        
        // Set end date to one year from now if not set
        if (endDateInput && !endDateInput.value) {
            const nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 1);
            const nextYearString = `${nextYear.getFullYear()}-${String(nextYear.getMonth() + 1).padStart(2, '0')}-${String(nextYear.getDate()).padStart(2, '0')}`;
            endDateInput.value = nextYearString;
        }
    }
    
    // No.11: Auto-fill management number and name from person code
    autoFillFromPersonCode() {
        const personCode = $('#personCode').val().trim();
        const managementNumber = $('#managementNumber');
        const name = $('#name');
        
        // Only auto-fill if person code has a value and the target fields are empty
        if (personCode && personCode !== '') {
            if (managementNumber && managementNumber.val().trim() === '') {
                managementNumber.val(personCode);
            }
            
            if (name && name.val().trim() === '') {
                name.val(personCode);
            }
        }
    }

    setDefaultValues() {
        // デフォルト値の設定
        $('#personCode').val('');
        $('#issueCount').val('0');
        
        // 現在日付を設定
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        
        // 利用開始日を今日に設定
        $('.date-inputs').first().find('input').val(year);
        $('.date-inputs').first().find('select').eq(0).val(month);
        $('.date-inputs').first().find('select').eq(1).val(day);
    }

    updateFormTitle() {
        const title = this.isEditMode ? '個人情報編集' : '個人情報新規登録';
        $('.section-header').text(title);
    }

    loadPersonData(personId) {
        // サンプルデータを読み込み（実際のAPIからデータを取得）
        const sampleData = {
            personCode: '0030302',
            issueCount: '1',
            managementNumber: 'MGT001',
            name: '山田太郎',
            nameKana: 'ヤマダタロウ',
            department: '開発部',
            category: '001',
            tenkeyNumber: '0000',
            startDate: { year: '2024', month: '01', day: '01' },
            endDate: { year: '2025', month: '12', day: '31' },
            proxyCode: '',
            proxyEndDate: { year: '0000', month: '01', day: '01' },
            password: '',
            bioAuth: false,
            antiPassback: true,
            bioId: '',
            deMeta: '',
            archiveEnabled: false,
            timeSettings: true,
            photo: null
        };

        this.populateForm(sampleData);
        this.currentData = sampleData;
    }

    populateForm(data) {
        $('#personCode').val(data.personCode || '');
        $('#issueCount').val(data.issueCount || '0');
        $('#managementNumber').val(data.managementNumber || '');
        $('#name').val(data.name || '');
        $('#nameKana').val(data.nameKana || '');
        $('#department').val(data.department || '');
        $('#category').val(data.category || '001');
        $('#tenkeyNumber').val(data.tenkeyNumber || '0000');
        $('#proxyCode').val(data.proxyCode || '');
        $('#bioId').val(data.bioId || '');
        $('#deMeta').val(data.deMeta || '');

        // 日付の設定
        if (data.startDate) {
            const startInputs = $('.date-inputs').eq(0);
            startInputs.find('input').val(data.startDate.year);
            startInputs.find('select').eq(0).val(data.startDate.month);
            startInputs.find('select').eq(1).val(data.startDate.day);
        }

        if (data.endDate) {
            const endInputs = $('.date-inputs').eq(1);
            endInputs.find('input').val(data.endDate.year);
            endInputs.find('select').eq(0).val(data.endDate.month);
            endInputs.find('select').eq(1).val(data.endDate.day);
        }

        if (data.proxyEndDate) {
            const proxyInputs = $('.date-inputs').eq(2);
            proxyInputs.find('input').val(data.proxyEndDate.year);
            proxyInputs.find('select').eq(0).val(data.proxyEndDate.month);
            proxyInputs.find('select').eq(1).val(data.proxyEndDate.day);
        }

        // チェックボックスの設定
        $('#bioAuth').prop('checked', data.bioAuth || false);
        $('#antiPassback').prop('checked', data.antiPassback || false);
        $('#readProhibition').prop('checked', data.readProhibition || false); // No.8
        $('#monitoringCard').prop('checked', data.monitoringCard || false); // No.8
        $('#archiveSettings').prop('checked', data.archiveEnabled || false);
        $('#timeSettings').prop('checked', data.timeSettings || false);

        // バイオ認証フィールドの表示制御
        this.toggleBioFields();
    }

    handleReferenceClick(e) {
        const target = $(e.target).closest('.input-with-button');
        const input = target.find('input');
        const fieldType = input.attr('id');

        switch (fieldType) {
            case 'tenantCode':
                this.openTenantSelector();
                break;
            case 'department':
                this.openDepartmentSelector();
                break;
            case 'category':
                this.openCategorySelector();
                break;
            case 'authorityCode':
                this.openAuthoritySelector();
                break;
            default:
        }
    }

    openTenantSelector() {
        const tenants = [
            { code: '001', name: 'テナント001' },
            { code: '002', name: 'テナント002' }
        ];
        this.showSelectorModal('テナント選択', tenants, (selected) => {
            $('#tenantCode').val(selected.code);
            $('#tenantName').text('名称：' + selected.name);
        });
    }

    openDepartmentSelector() {
        const departments = [
            { code: '001', name: '総務部' },
            { code: '003', name: '開発部' }
        ];
        this.showSelectorModal('所属選択', departments, (selected) => {
            $('#department').val(selected.code);
            $('#departmentName').text('名称：' + selected.name);
        });
    }

    openCategorySelector() {
        const categories = [
            { code: '001', name: '正社員' },
            { code: '002', name: '契約社員' }
        ];
        this.showSelectorModal('区分選択', categories, (selected) => {
            $('#category').val(selected.code);
            $('#categoryName').text('名称：' + selected.name);
        });
    }

    openAuthoritySelector() {
        const authorities = [
            { code: '001', name: 'ツウコウ001' },
            { code: '002', name: 'ツウコウ002' }
        ];
        this.showSelectorModal('通行権限選択', authorities, (selected) => {
            $('#authorityCode').val(selected.code);
            $('#authorityName').text('名称：' + selected.name);
        });
    }

    showSelectorModal(title, items, callback) {
        // 簡易的なセレクターモーダル（実際の実装では適切なモーダルを使用）
        let options = items.map(item => `${item.code}: ${item.name}`).join('\n');
        let selected = prompt(`${title}\n\n${options}\n\nコードを入力してください:`);
        
        if (selected) {
            let item = items.find(i => i.code === selected);
            if (item) {
                callback(item);
            } else {
                alert('無効なコードです');
            }
        }
    }

    handlePhotoUpload(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    $('.photo-preview').html(`<img src="${e.target.result}" alt="個人写真">`);
                };
                reader.readAsDataURL(file);
            } else {
                alert('画像ファイルを選択してください');
                e.target.value = '';
            }
        }
    }

    deletePhoto() {
        $('.photo-preview').html(`
            <div class="no-image-text">
                <div style="font-size: 40px; margin-bottom: 10px;">👤</div>
                <div>NO IMAGE</div>
            </div>
        `);
        $('#photoUpload').val('');
    }

    validatePersonCode() {
        const code = $('#personCode').val();
        const isValid = code.length >= 6 && /^\d+$/.test(code);
        
        if (!isValid && code.length > 0) {
            $('#personCode').addClass('is-invalid');
        } else {
            $('#personCode').removeClass('is-invalid');
        }
        
        return isValid;
    }

    validateForm() {
        const required = {
            personCode: $('#personCode').val().trim(),
            name: $('#name').val().trim()
        };

        let isValid = true;
        Object.keys(required).forEach(key => {
            const element = $(`#${key}`);
            if (!required[key]) {
                element.addClass('is-invalid');
                isValid = false;
            } else {
                element.removeClass('is-invalid');
            }
        });

        // 個人コードの形式チェック
        if (required.personCode && !this.validatePersonCode()) {
            isValid = false;
        }

        $('.btn-save').prop('disabled', !isValid);
        return isValid;
    }

    handleDateInput(e) {
        const input = $(e.target);
        const value = input.val();
        
        // 年の入力は4桁まで
        if (value.length > 4) {
            input.val(value.substring(0, 4));
        }
        
        // 数字のみ許可
        if (!/^\d*$/.test(value)) {
            input.val(value.replace(/\D/g, ''));
        }
    }

    handleDateChange(e) {
        // 日付選択の変更時の処理
    }

    toggleBioFields() {
        const bioAuth = $('#bioAuth').is(':checked');
        const bioFields = $('#bioId, #deMeta');
        
        if (bioAuth) {
            bioFields.prop('disabled', false);
            bioFields.closest('.form-row').show();
        } else {
            bioFields.prop('disabled', true);
            bioFields.val('');
        }
    }

    toggleAltSettings(enabled) {
        const fields = $('#altCode, #altYear, #altMonth, #altDay');
        const btn = $('#altCalendarBtn');
        fields.prop('disabled', !enabled);
        btn.prop('disabled', !enabled);
        if (!enabled) {
            fields.val('');
            $('#altYear').val('0000');
            $('#altMonth, #altDay').val('00');
        }
    }

    toggleAntiPassback() {
        const antiPassback = $('#antiPassback').is(':checked');
    }

    sendData() {
        if (!this.validateForm()) {
            alert('必須項目を入力してください');
            return;
        }
        alert('データを送信しました');
    }

    deletePerson() {
        if (confirm('この個人情報を削除しますか？')) {
            alert('削除しました');
            window.location.href = '/personalList-preview.html';
        }
    }

    eraseData() {
        if (confirm('入力内容を消去しますか？')) {
            $('input[type="text"]').val('');
            this.setDefaultValues();
        }
    }

    collectFormData() {
        const data = {
            personCode: $('#personCode').val().trim(),
            managementNumber: $('#managementNumber').val().trim(),
            name: $('#name').val().trim(),
            nameKana: $('#nameKana').val().trim(),
            department: $('#department').val().trim(),
            category: $('#category').val().trim(),
            tenkeyNumber: $('#tenkeyNumber').val().trim(),
            proxyCode: $('#proxyCode').val().trim(),
            bioAuth: $('#bioAuth').is(':checked'),
            antiPassback: $('#antiPassback').is(':checked'),
            readProhibition: $('#readProhibition').is(':checked'), // No.8
            monitoringCard: $('#monitoringCard').is(':checked'), // No.8
            bioId: $('#bioId').val().trim(),
            deMeta: $('#deMeta').val().trim(),
            archiveEnabled: $('#archiveSettings').is(':checked'),
            timeSettings: $('#timeSettings').is(':checked'),
            startDate: $('#startDate').val(), // No.12
            endDate: $('#endDate').val() // No.12
        };

        // 日付データの収集
        const dateInputs = $('.date-inputs');
        data.startDate = this.collectDateData(dateInputs.eq(0));
        data.endDate = this.collectDateData(dateInputs.eq(1));
        data.proxyEndDate = this.collectDateData(dateInputs.eq(2));

        return data;
    }

    collectDateData(dateContainer) {
        return {
            year: dateContainer.find('input').val(),
            month: dateContainer.find('select').eq(0).val(),
            day: dateContainer.find('select').eq(1).val()
        };
    }

    savePerson() {
        if (!this.validateForm()) {
            alert('必須項目を入力してください');
            return;
        }

        const formData = this.collectFormData();
        
        // 確認ダイアログ
        const action = this.isEditMode ? '更新' : '登録';
        if (!confirm(`個人情報を${action}しますか？`)) {
            return;
        }

        // ローディング状態
        $('.btn-save').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> 保存中...');

        // APIコール（ダミー）
        setTimeout(() => {
            alert(`個人情報が${action}されました`);
            
            // 保存後の処理
            $('.btn-save').prop('disabled', false).html('<i class="fas fa-save"></i> 保存');
            
            if (!this.isEditMode) {
                // 新規登録の場合は一覧画面に戻る
                window.location.href = '/personalList-preview.html';
            } else {
                // 編集の場合は現在のデータを更新
                this.currentData = formData;
            }
        }, 1000);
    }

    cancelEdit() {
        if (this.hasUnsavedChanges()) {
            if (!confirm('変更内容が失われますが、よろしいですか？')) {
                return;
            }
        }
        
        // 一覧画面に戻る
        window.location.href = '/personalList-preview.html';
    }

    clearForm() {
        if (!confirm('入力内容をクリアしますか？')) {
            return;
        }

        // フォームをクリア
        $('input[type="text"], input[type="password"]').val('');
        $('input[type="checkbox"]').prop('checked', false);
        $('select').prop('selectedIndex', 0);
        
        // 写真をクリア
        this.deletePhoto();
        
        // デフォルト値を再設定
        this.setDefaultValues();
        
        // バリデーション状態をクリア
        $('.is-invalid').removeClass('is-invalid');
        $('.btn-save').prop('disabled', true);
    }

    hasUnsavedChanges() {
        if (!this.isEditMode) {
            // 新規登録の場合、何かしら入力があるかチェック
            return $('input[type="text"]').filter((i, el) => $(el).val().trim() !== '').length > 0;
        } else {
            // 編集の場合、現在のデータと比較
            const currentFormData = this.collectFormData();
            return JSON.stringify(currentFormData) !== JSON.stringify(this.currentData);
        }
    }

    // Enterキー押下時の自動入力機能
    setupEnterKeyHandlers() {
        const enterHandlers = {
            'personCode': (input) => {
                if (!input.value.trim()) {
                    this.showFieldError('個人コードは必須です');
                    return false;
                }
                return true;
            },
            'issueCount': (input) => true,
            'managementNumber': (input) => {
                if (!input.value.trim()) {
                    const personCode = $('#personCode').val().trim();
                    if (personCode) input.value = personCode;
                }
                return true;
            },
            'name': (input) => {
                if (!input.value.trim()) {
                    const personCode = $('#personCode').val().trim();
                    if (personCode) input.value = personCode;
                }
                return true;
            },
            'nameKana': (input) => {
                if (!input.value.trim()) {
                    const personCode = $('#personCode').val().trim();
                    if (personCode) input.value = personCode;
                }
                return true;
            },
            'department': (input) => {
                if (!input.value.trim()) input.value = '000';
                return true;
            },
            'category': (input) => {
                if (!input.value.trim()) input.value = '000';
                return true;
            },
            'tenkeyNumber': (input) => {
                if (!input.value.trim()) input.value = '0000';
                return true;
            },
            'startYear': (input) => true,
            'startMonth': (input) => true,
            'startDay': (input) => true
        };

        Object.keys(enterHandlers).forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                element.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const handler = enterHandlers[fieldId];
                        const shouldProceed = handler(element);
                        if (shouldProceed) this.moveToNextField(element);
                    }
                });
            }
        });
    }

    moveToNextField(currentElement) {
        const formElements = Array.from(document.querySelectorAll('input, select, textarea')).filter(el =>
            !el.disabled && !el.hidden && el.type !== 'hidden'
        );
        const currentIndex = formElements.indexOf(currentElement);
        if (currentIndex >= 0 && currentIndex < formElements.length - 1) {
            formElements[currentIndex + 1].focus();
        }
    }

    showFieldError(message) {
        console.error(message);
        alert(message);
    }
}

// グローバル関数（HTMLから呼び出される）
function savePerson() {
    if (window.personalRegistration) {
        window.personalRegistration.savePerson();
    }
}

function cancelEdit() {
    if (window.personalRegistration) {
        window.personalRegistration.cancelEdit();
    }
}

function clearForm() {
    if (window.personalRegistration) {
        window.personalRegistration.clearForm();
    }
}

// No.12: Calendar functionality
function showCalendar(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        // For modern browsers, this will trigger the native date picker
        input.focus();
        input.click();
        
        // Alternative: show a custom calendar modal if needed
    }
}

// 初期化
$(document).ready(function() {
    window.personalRegistration = new PersonalRegistration();
});