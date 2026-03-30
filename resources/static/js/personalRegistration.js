/**
 * 個人登録/編集画面 JavaScript
 */
class PersonalRegistration {
    constructor() {
        this.currentData = {};
        this.isEditMode = false;
        this.calendarData = {
            start: { currentDate: new Date(), selectedDate: null },
            end:   { currentDate: new Date(), selectedDate: null },
            alt:   { currentDate: new Date(), selectedDate: null }
        };
        this.monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
        this.dayHeaders = ['日','月','火','水','木','金','土'];
        this.init();
    }

    init() {
        this.bindEvents();
        this.initGateTable();
        this.initializeForm();
        this.toggleAlternativeFields();
    }

    bindEvents() {
        const bindClick = (id, handler) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', handler);
            }
        };

        // ヘッダーボタン
        bindClick('sendBtn', () => this.sendData());
        bindClick('saveBtn', () => this.savePerson());
        bindClick('deleteBtn', () => this.deletePerson());
        bindClick('eraseBtn', () => this.eraseData());
        bindClick('cancelBtn', () => this.cancelEdit());
        bindClick('clearBtn', () => this.clearForm());

        // 写真
        bindClick('photoRefBtn', () => {
            const photoUpload = document.getElementById('photoUpload');
            if (photoUpload) {
                photoUpload.click();
            }
        });

        const photoUpload = document.getElementById('photoUpload');
        if (photoUpload) {
            photoUpload.addEventListener('change', (e) => this.handlePhotoUpload(e));
        }

        bindClick('photoDeleteBtn', () => this.deletePhoto());

        const altEnabled = document.getElementById('altEnabled');
        if (altEnabled) {
            altEnabled.addEventListener('change', () => this.toggleAlternativeFields());
        }

        // カレンダーボタン
        document.querySelectorAll('.pr-date-cal-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleCalendar(btn.dataset.calendar);
            });
        });

        // カレンダー外クリックで閉じる
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.pr-date-picker') && !e.target.closest('.pr-date-cal-btn')) {
                document.querySelectorAll('.pr-date-picker').forEach(p => p.style.display = 'none');
            }
        });

        // 日付入力を数字のみに制限
        document.querySelectorAll('.pr-date-group input[type="text"]').forEach(input => {
            input.addEventListener('input', () => {
                input.value = input.value.replace(/\D/g, '').substring(0, parseInt(input.maxLength) || 4);
            });
        });

        // Enterキーで次フィールドへ
        this.setupEnterKeyHandlers();
    }

    initializeForm() {
        const urlParams = new URLSearchParams(window.location.search);
        const personId = urlParams.get('id');

        if (personId) {
            this.isEditMode = true;
            this.loadPersonData(personId);
        } else {
            this.isEditMode = false;
            this.setDefaultValues();
            // データモニターからの遷移: personalCode pre-fill
            const personalCode = urlParams.get('personalCode');
            if (personalCode) {
                document.getElementById('personCode').value = personalCode;
            }
        }
    }

    setDefaultValues() {
        document.getElementById('personCode').value = '';
        document.getElementById('issueCount').value = '0';
        document.getElementById('tenkeyNumber').value = '0000';
        const altEnabled = document.getElementById('altEnabled');
        if (altEnabled) {
            altEnabled.checked = false;
        }
    }

    toggleAlternativeFields() {
        const altEnabled = document.getElementById('altEnabled');
        const altCode = document.getElementById('altCode');
        const altYear = document.getElementById('altYear');
        const altMonth = document.getElementById('altMonth');
        const altDay = document.getElementById('altDay');
        const altDateButton = document.querySelector('[data-calendar="alt"]');
        const altRows = [altCode, altYear, altMonth, altDay].filter(Boolean);
        const enabled = !!(altEnabled && altEnabled.checked);

        altRows.forEach((element) => {
            element.disabled = !enabled;
            element.classList.toggle('pr-alt-disabled', !enabled);
        });

        if (altDateButton) {
            altDateButton.disabled = !enabled;
            altDateButton.classList.toggle('pr-alt-disabled', !enabled);
        }
    }

    // ゲートテーブル初期化
    initGateTable() {
        const gates = [
            { code: '0001', name: 'ゲート①',       tc: '', df: 'C' },
            { code: '0002', name: 'ゲート②',       tc: '', df: 'C' },
            { code: '0003', name: 'ゲート③',       tc: '', df: 'C' },
            { code: '0004', name: 'ゲート④',       tc: '', df: 'C' },
            { code: '0005', name: 'ゲート⑤',       tc: '', df: 'C' },
            { code: '0006', name: 'ゲート⑥',       tc: '', df: 'C' },
            { code: '0007', name: 'ゲート⑦',       tc: '', df: 'C' },
            { code: '0008', name: 'ゲート⑧',       tc: '', df: 'C' },
            { code: '0009', name: 'ゲート⑨',       tc: '', df: 'C' },
            { code: '0010', name: 'ゲート⑩',       tc: '', df: 'C' },
            { code: '0011', name: 'エレベーター①', tc: '', df: 'C' },
            { code: '0012', name: 'エレベーター②', tc: '', df: 'C' },
            { code: '0013', name: '駐車場入口',     tc: '', df: 'C' },
            { code: '0014', name: '駐車場出口',     tc: '', df: 'C' },
            { code: '0015', name: '会議室A',        tc: '', df: 'C' },
            { code: '0016', name: '会議室B',        tc: '', df: 'C' },
            { code: '0017', name: 'サーバールーム', tc: '', df: 'C' },
            { code: '0018', name: '金庫室',         tc: '', df: 'C' },
            { code: '0019', name: '屋上扉',         tc: '', df: 'C' },
            { code: '0020', name: '非常口',         tc: '', df: 'C' }
        ];
        const extraFacilityNames = ['倉庫', '研修室', '食堂', '休憩室', '通用口', '搬入口', '警備室', '受付', '社長室', '役員室'];
        gates.push(
            ...extraFacilityNames.map((name, index) => ({
                code: String(index + 21).padStart(4, '0'),
                name,
                tc: '',
                df: 'C'
            })),
            ...Array.from({ length: 70 }, (_, index) => ({
                code: String(index + 31).padStart(4, '0'),
                name: `ゲート${index + 31}`,
                tc: '',
                df: 'C'
            }))
        );

        const tbody = document.getElementById('gateTableBody');
        const fragment = document.createDocumentFragment();
        gates.forEach(g => {
            const tr = document.createElement('tr');
            const fields = [
                { value: g.code, readonly: true },
                { value: g.name, readonly: true },
                { value: g.tc,   readonly: false },
                { value: g.df,   readonly: true }
            ];
            fields.forEach(f => {
                const td = document.createElement('td');
                const input = document.createElement('input');
                input.type = 'text';
                input.value = f.value;
                if (f.readonly) input.readOnly = true;
                td.appendChild(input);
                tr.appendChild(td);
            });
            fragment.appendChild(tr);
        });
        tbody.appendChild(fragment);
    }

    // ---- カレンダー ----
    toggleCalendar(type) {
        // 他のカレンダーを閉じる
        document.querySelectorAll('.pr-date-picker').forEach(p => {
            if (p.id !== type + 'DatePicker') p.style.display = 'none';
        });

        const picker = document.getElementById(type + 'DatePicker');
        if (picker.style.display === 'block') {
            picker.style.display = 'none';
            return;
        }

        // 現在の入力値からカレンダー初期位置を設定
        const year  = parseInt(document.getElementById(type + 'Year').value)  || 0;
        const month = parseInt(document.getElementById(type + 'Month').value) || 0;
        const day   = parseInt(document.getElementById(type + 'Day').value)   || 0;

        if (year > 0 && month > 0 && day > 0) {
            this.calendarData[type].currentDate  = new Date(year, month - 1, day);
            this.calendarData[type].selectedDate = new Date(year, month - 1, day);
        } else {
            this.calendarData[type].currentDate  = new Date();
            this.calendarData[type].selectedDate = null;
        }

        this.renderCalendar(type);
        picker.style.display = 'block';
    }

    renderCalendar(type) {
        const cur      = this.calendarData[type].currentDate;
        const selected = this.calendarData[type].selectedDate;
        const today    = new Date();
        const picker   = document.getElementById(type + 'DatePicker');

        picker.innerHTML = `
            <div class="pr-cal-header">
                <button type="button" class="pr-cal-nav" data-dir="-1">&#8249;</button>
                <span class="pr-cal-title">${cur.getFullYear()}年${this.monthNames[cur.getMonth()]}</span>
                <button type="button" class="pr-cal-nav" data-dir="1">&#8250;</button>
            </div>
            <div class="pr-cal-grid" id="${type}CalGrid"></div>
            <div class="pr-cal-actions">
                <button type="button" class="pr-cal-btn pr-cal-btn-today">今日</button>
                <button type="button" class="pr-cal-btn pr-cal-btn-close">閉じる</button>
            </div>
        `;

        // ナビゲーション
        picker.querySelectorAll('.pr-cal-nav').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.navigateMonth(type, parseInt(btn.dataset.dir));
            });
        });

        // 今日ボタン
        picker.querySelector('.pr-cal-btn-today').addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectDate(type, new Date());
        });

        // 閉じるボタン
        picker.querySelector('.pr-cal-btn-close').addEventListener('click', (e) => {
            e.stopPropagation();
            picker.style.display = 'none';
        });

        // カレンダーグリッド
        const grid = document.getElementById(type + 'CalGrid');
        this.dayHeaders.forEach(dh => {
            const el = document.createElement('div');
            el.className = 'pr-cal-day-header';
            el.textContent = dh;
            grid.appendChild(el);
        });

        const firstDay  = new Date(cur.getFullYear(), cur.getMonth(), 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            const dayEl = document.createElement('div');
            dayEl.className = 'pr-cal-day';
            dayEl.textContent = date.getDate();

            if (date.getMonth() !== cur.getMonth()) dayEl.classList.add('other-month');
            if (date.toDateString() === today.toDateString()) dayEl.classList.add('today');
            if (selected && date.toDateString() === selected.toDateString()) dayEl.classList.add('selected');

            const d = new Date(date);
            dayEl.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectDate(type, d);
            });
            grid.appendChild(dayEl);
        }
    }

    selectDate(type, date) {
        this.calendarData[type].selectedDate = date;

        document.getElementById(type + 'Year').value  = date.getFullYear();
        document.getElementById(type + 'Month').value = String(date.getMonth() + 1).padStart(2, '0');
        document.getElementById(type + 'Day').value   = String(date.getDate()).padStart(2, '0');

        document.getElementById(type + 'DatePicker').style.display = 'none';
    }

    navigateMonth(type, direction) {
        const cur = this.calendarData[type].currentDate;
        cur.setMonth(cur.getMonth() + direction);
        this.renderCalendar(type);
    }

    // ---- 写真 ----
    handlePhotoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('画像ファイルを選択してください');
            e.target.value = '';
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('ファイルサイズは5MB以下にしてください');
            e.target.value = '';
            return;
        }
        const frame = document.getElementById('photoFrame');
        frame.innerHTML = '';
        const img = document.createElement('img');
        img.alt = '顔写真';
        img.src = URL.createObjectURL(file);
        img.onload = () => URL.revokeObjectURL(img.src);
        frame.appendChild(img);
    }

    deletePhoto() {
        document.getElementById('photoFrame').innerHTML = `
            <div class="pr-no-image">
                <i class="fas fa-user"></i>
                <div>NO IMAGE</div>
            </div>
        `;
        document.getElementById('photoUpload').value = '';
    }

    // ---- データ操作 ----
    sendData() {
        alert('データを送信しました');
    }

    savePerson() {
        const action = this.isEditMode ? '更新' : '登録';
        if (!confirm(`個人情報を${action}しますか？`)) return;

        const formData = this.collectFormData();
        alert(`個人情報が${action}されました`);

        if (!this.isEditMode) {
            window.location.href = '/personalList';
        } else {
            this.currentData = formData;
        }
    }

    deletePerson() {
        if (confirm('この個人情報を削除しますか？')) {
            alert('削除しました');
            window.location.href = '/personalList';
        }
    }

    eraseData() {
        if (confirm('入力内容を消去しますか？')) {
            document.querySelectorAll('.pr-col-left input[type="text"], .pr-col-left input[type="password"]').forEach(el => el.value = '');
            document.querySelectorAll('.pr-col-left textarea').forEach(el => el.value = '');
            this.setDefaultValues();
        }
    }

    cancelEdit() {
        if (this.hasUnsavedChanges()) {
            if (!confirm('変更内容が失われますが、よろしいですか？')) return;
        }
        window.location.href = '/personalList';
    }

    clearForm() {
        if (!confirm('入力内容をクリアしますか？')) return;

        document.querySelectorAll('.pr-col-left input[type="text"], .pr-col-left input[type="password"]').forEach(el => el.value = '');
        document.querySelectorAll('.pr-col-left input[type="checkbox"]').forEach(el => el.checked = false);
        document.querySelectorAll('.pr-col-left textarea').forEach(el => el.value = '');
        this.deletePhoto();
        this.setDefaultValues();
        this.toggleAlternativeFields();
    }

    collectFormData() {
        return {
            personCode:       document.getElementById('personCode').value.trim(),
            issueCount:       document.getElementById('issueCount').value.trim(),
            tenkeyNumber:     document.getElementById('tenkeyNumber').value.trim(),
            managementNumber: document.getElementById('managementNumber').value.trim(),
            name:             document.getElementById('name').value.trim(),
            nameKana:         document.getElementById('nameKana').value.trim(),
            department:       document.getElementById('department').value.trim(),
            category:         document.getElementById('category').value.trim(),
            gateMode:         document.getElementById('gateMode').checked,
            antiPassback:     document.getElementById('antiPassback').checked,
            securityOpDisable:document.getElementById('securityOpDisable').checked,
            monitoringCard:   document.getElementById('monitoringCard').checked,
            startDate:        { year: document.getElementById('startYear').value, month: document.getElementById('startMonth').value, day: document.getElementById('startDay').value },
            endDate:          { year: document.getElementById('endYear').value,   month: document.getElementById('endMonth').value,   day: document.getElementById('endDay').value },
            bioIndex:         document.getElementById('bioIndex').value.trim(),
            altEnabled:       document.getElementById('altEnabled').checked,
            altCode:          document.getElementById('altCode').value.trim(),
            altEndDate:       { year: document.getElementById('altYear').value,   month: document.getElementById('altMonth').value,   day: document.getElementById('altDay').value },
            bioId:            document.getElementById('bioId').value.trim(),
            remarks:          document.getElementById('remarks').value.trim(),
            gateDefaultCode:  document.getElementById('gateDefaultCode').value.trim()
        };
    }

    populateForm(data) {
        const set = (id, val) => {
            if (val !== undefined) document.getElementById(id).value = val;
        };

        set('personCode',       data.personCode);
        set('issueCount',       data.issueCount);
        set('tenkeyNumber',     data.tenkeyNumber);
        set('managementNumber', data.managementNumber);
        set('name',             data.name);
        set('nameKana',         data.nameKana);
        set('department',       data.department);
        set('category',         data.category);

        document.getElementById('gateMode').checked         = !!data.gateMode;
        document.getElementById('antiPassback').checked      = !!data.antiPassback;
        document.getElementById('securityOpDisable').checked = !!data.securityOpDisable;
        document.getElementById('monitoringCard').checked    = !!data.monitoringCard;
        document.getElementById('altEnabled').checked        = !!data.altEnabled;

        if (data.startDate) {
            set('startYear',  data.startDate.year);
            set('startMonth', data.startDate.month);
            set('startDay',   data.startDate.day);
        }
        if (data.endDate) {
            set('endYear',  data.endDate.year);
            set('endMonth', data.endDate.month);
            set('endDay',   data.endDate.day);
        }
        if (data.altEndDate) {
            set('altYear',  data.altEndDate.year);
            set('altMonth', data.altEndDate.month);
            set('altDay',   data.altEndDate.day);
        }

        set('bioIndex',        data.bioIndex);
        set('altCode',         data.altCode);
        set('bioId',           data.bioId);
        set('remarks',         data.remarks);
        set('gateDefaultCode', data.gateDefaultCode);
        this.toggleAlternativeFields();
    }

    loadPersonData(personId) {
        const sampleData = {
            personCode: '0030302',
            issueCount: '1',
            tenkeyNumber: '0000',
            managementNumber: 'MGT001',
            name: '山田太郎',
            nameKana: 'ヤマダタロウ',
            department: '001',
            category: '001',
            gateMode: true,
            antiPassback: true,
            securityOpDisable: false,
            monitoringCard: false,
            startDate: { year: '2024', month: '01', day: '01' },
            endDate:   { year: '2025', month: '12', day: '31' },
            bioIndex: '',
            altEnabled: false,
            altCode: '',
            altEndDate: { year: '0000', month: '00', day: '00' },
            bioId: '',
            remarks: '',
            gateDefaultCode: '001'
        };

        this.populateForm(sampleData);
        this.currentData = sampleData;
    }

    hasUnsavedChanges() {
        if (!this.isEditMode) {
            return document.querySelectorAll('.pr-col-left input[type="text"]').length > 0 &&
                   Array.from(document.querySelectorAll('.pr-col-left input[type="text"]')).some(el => el.value.trim() !== '');
        }
        return JSON.stringify(this.collectFormData()) !== JSON.stringify(this.currentData);
    }

    setupEnterKeyHandlers() {
        const fields = document.querySelectorAll('.pr-col-left input[type="text"], .pr-col-left input[type="password"]');
        const fieldArray = Array.from(fields).filter(el => !el.disabled && !el.hidden && el.type !== 'hidden');

        fieldArray.forEach((field, idx) => {
            field.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (idx < fieldArray.length - 1) {
                        fieldArray[idx + 1].focus();
                    }
                }
            });
        });
    }
}

function toggleDetailSection() {
    var content = document.getElementById('detailContent');
    var arrow = document.getElementById('detailArrow');
    if (!content || !arrow) {
        return;
    }
    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        arrow.textContent = '▼';
    } else {
        content.classList.add('collapsed');
        arrow.textContent = '▶';
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    window.personalRegistration = new PersonalRegistration();
});
