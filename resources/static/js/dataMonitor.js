/**
 * データモニター JavaScript
 * 入退室データのリアルタイム監視
 */
(function () {
    'use strict';

    // data-column属性 → デモデータキーのマッピング
    var columnAttrToKey = {
        occurredDate: 'date',
        personalCode: 'code',
        name: 'name',
        departmentCode: 'deptCode',
        departmentName: 'dept',
        gateNumber: 'gate',
        gateName: 'gateName',
        historyDetails: 'detail'
    };
    var columnDisplayNames = {
        occurredDate: '発生日付',
        personalCode: '個人コード',
        name: '氏名',
        departmentCode: '所属コード',
        departmentName: '所属名称',
        gateNumber: 'ゲート番号',
        gateName: 'ゲート名称',
        historyDetails: '履歴詳細'
    };

    // Excelフィルター状態: { colAttr: Set of selected values } (未設定=全選択)
    var excelFilters = {};
    var selectedRowData = null;
    var dataTypeValue = 'all';

    var dataTypeDotClasses = { all: 'dot-all', normal: 'dot-normal', warning: 'dot-warning', error: 'dot-error' };
    var dataTypeLabels = { all: '全データ表示', normal: '正常データ表示', warning: '軽エラーデータ表示', error: '重エラーデータ表示' };

    function updateDataTypeDisplay(value) {
        var selected = document.getElementById('dataTypeSelected');
        var label = document.getElementById('dataTypeLabel');
        if (!selected || !label) return;
        var dot = document.getElementById('dataTypeDot');
        if (dot) {
            if (value === 'all') {
                dot.style.display = 'none';
                dot.className = 'status-dot';
            } else {
                dot.style.display = '';
                dot.className = 'status-dot ' + (dataTypeDotClasses[value] || '');
            }
        }
        label.textContent = dataTypeLabels[value] || value;
        var options = document.getElementById('dataTypeOptions');
        if (options) {
            options.querySelectorAll('.dm-custom-option').forEach(function (opt) {
                opt.classList.toggle('selected', opt.getAttribute('data-value') === value);
            });
        }
    }

    // デモデータ
    var demoData = [
        { type: 'normal',  date: '2026/01/27 09:44:50', code: '000680', name: '個人678', deptCode: '002', dept: '所属002', gate: '0004', gateName: 'XA0004',      detail: '退室' },
        { type: 'warning', date: '2026/01/27 09:44:47', code: '',       name: '',       deptCode: '',    dept: '',       gate: '0003', gateName: 'H=03 A=68',    detail: 'カードリーダー警告' },
        { type: 'normal',  date: '2026/01/27 09:44:44', code: '000341', name: '個人567', deptCode: '004', dept: '管理部', gate: '0003', gateName: 'XA0003',      detail: '入室' },
        { type: 'normal',  date: '2026/01/27 09:44:41', code: '000502', name: '個人888', deptCode: '003', dept: '所属003', gate: '0003', gateName: 'XA0003',     detail: '退室' },
        { type: 'warning', date: '2026/01/27 09:44:38', code: '',       name: '',       deptCode: '',    dept: '',       gate: '0003', gateName: 'H=03 A=42',    detail: '通信異常復旧' },
        { type: 'normal',  date: '2026/01/27 09:44:35', code: '000709', name: '個人724', deptCode: '001', dept: '所属001', gate: '0002', gateName: 'XA0002',     detail: '入室' },
        { type: 'normal',  date: '2026/01/27 09:44:32', code: '000982', name: '個人993', deptCode: '004', dept: '管理部', gate: '0003', gateName: 'XA0003',      detail: '入室' },
        { type: 'warning', date: '2026/01/27 09:44:29', code: '',       name: '',       deptCode: '',    dept: '',       gate: '0002', gateName: 'H=02 A=83',    detail: '通信異常復旧' },
        { type: 'normal',  date: '2026/01/27 09:44:26', code: '000601', name: '個人144', deptCode: '002', dept: '所属002', gate: '0002', gateName: 'XA0002',     detail: '退室' },
        { type: 'normal',  date: '2026/01/27 09:44:23', code: '000878', name: '個人446', deptCode: '002', dept: '所属002', gate: '0003', gateName: 'XA0003',     detail: '退室' },
        { type: 'normal',  date: '2026/01/27 09:44:20', code: '000994', name: '個人530', deptCode: '005', dept: '開発部', gate: '0003', gateName: 'XA0003',      detail: '退室' },
        { type: 'normal',  date: '2026/01/27 09:44:17', code: '000408', name: '個人744', deptCode: '005', dept: '開発部', gate: '0002', gateName: 'XA0002',      detail: '入室' },
        { type: 'normal',  date: '2026/01/27 09:44:14', code: '000872', name: '個人193', deptCode: '003', dept: '所属003', gate: '0001', gateName: 'XA0001',     detail: '退室' },
        { type: 'normal',  date: '2026/01/27 09:44:11', code: '000698', name: '個人363', deptCode: '004', dept: '管理部', gate: '0001', gateName: 'XA0001',      detail: '入室' },
        { type: 'normal',  date: '2026/01/27 09:44:08', code: '000681', name: '個人332', deptCode: '004', dept: '管理部', gate: '0001', gateName: 'XA0001',      detail: '退室' },
        { type: 'normal',  date: '2026/01/27 09:44:05', code: '000811', name: '個人085', deptCode: '001', dept: '所属001', gate: '0001', gateName: 'XA0001',     detail: '入室' },
        { type: 'error',   date: '2026/01/27 09:44:02', code: '',       name: '',       deptCode: '',    dept: '',       gate: '0001', gateName: 'H=01 A=99',    detail: 'ドア開放異常' },
        { type: 'error',   date: '2026/01/27 08:45:59', code: '',       name: '',       deptCode: '',    dept: '',       gate: '0002', gateName: 'H=02 A=4',     detail: '通信異常発生' }
    ];

    function escapeHtml(str) {
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function renderTable(data) {
        var tbody = document.getElementById('dataTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        data.forEach(function (row) {
            var tr = document.createElement('tr');
            tr.className = row.type === 'warning' ? 'row-warning' : row.type === 'error' ? 'row-error' : '';
            tr.innerHTML =
                '<td><div class="date-cell"><span class="status-dot dot-' + escapeHtml(row.type) + '"></span>' + escapeHtml(row.date) + '</div></td>' +
                '<td>' + escapeHtml(row.code) + '</td>' +
                '<td>' + escapeHtml(row.name) + '</td>' +
                '<td>' + escapeHtml(row.deptCode) + '</td>' +
                '<td>' + escapeHtml(row.dept) + '</td>' +
                '<td>' + escapeHtml(row.gate) + '</td>' +
                '<td>' + escapeHtml(row.gateName) + '</td>' +
                '<td>' + escapeHtml(row.detail) + '</td>';
            tr.style.cursor = 'pointer';
            tr.addEventListener('click', function () {
                tbody.querySelectorAll('tr.row-selected').forEach(function (r) {
                    r.classList.remove('row-selected');
                });
                tr.classList.add('row-selected');
                selectedRowData = row;
            });
            tr.addEventListener('contextmenu', function (e) {
                e.preventDefault();
                tbody.querySelectorAll('tr.row-selected').forEach(function (r) {
                    r.classList.remove('row-selected');
                });
                tr.classList.add('row-selected');
                selectedRowData = row;
                showContextMenu(e.clientX, e.clientY);
            });
            tbody.appendChild(tr);
        });
        selectedRowData = null;
    }

    function showContextMenu(x, y) {
        var menu = document.getElementById('contextMenu');
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.style.display = 'block';
        // 画面外にはみ出す場合は補正
        var rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) menu.style.left = (x - rect.width) + 'px';
        if (rect.bottom > window.innerHeight) menu.style.top = (y - rect.height) + 'px';
    }

    function hideContextMenu() {
        document.getElementById('contextMenu').style.display = 'none';
    }

    function openRegistrationPage() {
        if (!selectedRowData) return;
        hideContextMenu();
        var params = new URLSearchParams();
        params.set('personalCode', selectedRowData.code);
        if (selectedRowData.name) {
            params.set('name', selectedRowData.name);
        }
        var basePath = window.location.pathname.includes('-preview.html')
            ? '/resources/personalRegistration-preview.html'
            : '/personalRegistration';
        window.open(basePath + '?' + params.toString(), '_blank');
    }

    function openAntiPassbackPage() {
        if (!selectedRowData) return;
        hideContextMenu();
        var params = new URLSearchParams();
        params.set('personalCode', selectedRowData.code);
        if (selectedRowData.name) {
            params.set('name', selectedRowData.name);
        }
        var basePath = window.location.pathname.includes('-preview.html')
            ? '#'
            : '/antiPassback';
        if (basePath === '#') {
            alert('アンチパスフリー画面（実装予定）');
            return;
        }
        window.open(basePath + '?' + params.toString(), '_blank');
    }

    // ---- フィルターロジック ----

    function getFilteredBase(excludeCol) {
        return demoData.filter(function (row) {
            if (dataTypeValue !== 'all' && row.type !== dataTypeValue) return false;
            for (var colAttr in excelFilters) {
                if (colAttr === excludeCol) continue;
                if (excelFilters.hasOwnProperty(colAttr)) {
                    var key = columnAttrToKey[colAttr];
                    var val = (row[key] || '').toString();
                    if (!excelFilters[colAttr].has(val)) return false;
                }
            }
            return true;
        });
    }

    function getUniqueValues(colAttr) {
        var key = columnAttrToKey[colAttr];
        var baseData = getFilteredBase(colAttr);
        var seen = {};
        var values = [];
        baseData.forEach(function (row) {
            var v = (row[key] || '').toString();
            if (!seen[v]) { seen[v] = true; values.push(v); }
        });
        values.sort();
        return values;
    }

    function hideDmFilters() {
        document.querySelectorAll('.excel-filter-menu.show').forEach(function (m) {
            m.classList.remove('show');
        });
    }

    function showDmFilter(event, colAttr) {
        event.stopPropagation();
        var menuId = 'excel-filter-' + colAttr;
        var menu = document.getElementById(menuId);
        if (!menu) return;

        var wasOpen = menu.classList.contains('show');
        hideDmFilters();
        if (wasOpen) return;

        var allValues = getUniqueValues(colAttr);
        var selected = excelFilters[colAttr] || null; // null = 全選択

        var html = '';
        html += '<div class="excel-filter-header">' + escapeHtml(columnDisplayNames[colAttr] || colAttr) + ' のフィルター</div>';
        html += '<div class="excel-search-section"><input type="text" class="excel-search-box" placeholder="検索..."></div>';
        html += '<div class="excel-filter-actions">';
        html += '<button class="excel-action-btn dm-select-all-btn">すべて選択</button>';
        html += '<button class="excel-action-btn dm-clear-all-btn">すべてクリア</button>';
        html += '<button class="excel-action-btn ok-btn dm-apply-btn">OK</button>';
        html += '</div>';
        html += '<div class="excel-filter-list" id="excel-list-' + colAttr + '">';
        allValues.forEach(function (val) {
            var checked = !selected || selected.has(val) ? 'checked' : '';
            var displayVal = val === '' ? '(空白)' : escapeHtml(val);
            html += '<div class="excel-filter-item" data-value="' + escapeHtml(val) + '">';
            html += '<input type="checkbox" ' + checked + '>';
            html += '<label>' + displayVal + '</label>';
            html += '</div>';
        });
        html += '</div>';

        menu.innerHTML = html;

        // Bind events on dynamically generated elements
        var searchBox = menu.querySelector('.excel-search-box');
        if (searchBox) {
            searchBox.addEventListener('input', function () {
                filterDmOptions(colAttr, this.value);
            });
        }
        menu.querySelector('.dm-select-all-btn').addEventListener('click', function () {
            selectAllDmFilter(colAttr);
        });
        menu.querySelector('.dm-clear-all-btn').addEventListener('click', function () {
            clearAllDmFilter(colAttr);
        });
        menu.querySelector('.dm-apply-btn').addEventListener('click', function () {
            applyDmFilter(colAttr);
        });
        menu.querySelectorAll('.excel-filter-item').forEach(function (item) {
            item.addEventListener('click', function (e) {
                toggleDmOption(e, item);
            });
        });

        menu.classList.add('show');
    }

    function toggleDmOption(e, itemEl) {
        if (e.target.tagName === 'INPUT') return;
        var cb = itemEl.querySelector('input[type="checkbox"]');
        if (cb) cb.checked = !cb.checked;
    }

    function selectAllDmFilter(colAttr) {
        var list = document.getElementById('excel-list-' + colAttr);
        if (!list) return;
        list.querySelectorAll('.excel-filter-item').forEach(function (item) {
            if (item.style.display !== 'none') {
                var cb = item.querySelector('input[type="checkbox"]');
                if (cb) cb.checked = true;
            }
        });
    }

    function clearAllDmFilter(colAttr) {
        var list = document.getElementById('excel-list-' + colAttr);
        if (!list) return;
        list.querySelectorAll('.excel-filter-item').forEach(function (item) {
            if (item.style.display !== 'none') {
                var cb = item.querySelector('input[type="checkbox"]');
                if (cb) cb.checked = false;
            }
        });
    }

    function filterDmOptions(colAttr, searchText) {
        var list = document.getElementById('excel-list-' + colAttr);
        if (!list) return;
        var lower = searchText.toLowerCase();
        list.querySelectorAll('.excel-filter-item').forEach(function (item) {
            var val = (item.getAttribute('data-value') || '').toLowerCase();
            var display = val === '' ? '(空白)' : val;
            item.style.display = (lower === '' || display.indexOf(lower) >= 0) ? '' : 'none';
        });
    }

    function applyDmFilter(colAttr) {
        var list = document.getElementById('excel-list-' + colAttr);
        if (!list) return;

        var allValues = getUniqueValues(colAttr);
        var selectedSet = new Set();
        list.querySelectorAll('.excel-filter-item').forEach(function (item) {
            var cb = item.querySelector('input[type="checkbox"]');
            if (cb && cb.checked) {
                selectedSet.add(item.getAttribute('data-value'));
            }
        });

        if (selectedSet.size === allValues.length) {
            delete excelFilters[colAttr];
        } else {
            excelFilters[colAttr] = selectedSet;
        }

        hideDmFilters();
        applyAllFilters();
        updateFilterTriggerStates();
    }

    function applyAllFilters() {
        var filtered = demoData.filter(function (row) {
            if (dataTypeValue !== 'all' && row.type !== dataTypeValue) return false;
            for (var colAttr in excelFilters) {
                if (excelFilters.hasOwnProperty(colAttr)) {
                    var key = columnAttrToKey[colAttr];
                    var val = (row[key] || '').toString();
                    if (!excelFilters[colAttr].has(val)) return false;
                }
            }
            return true;
        });

        renderTable(filtered);
    }

    function updateFilterTriggerStates() {
        document.querySelectorAll('.excel-filter-trigger').forEach(function (trigger) {
            var th = trigger.closest('th');
            if (!th) return;
            var colAttr = th.getAttribute('data-column');
            if (excelFilters[colAttr]) {
                trigger.classList.add('active');
            } else {
                trigger.classList.remove('active');
            }
        });
    }

    // ---- 自動更新 ----
    var autoUpdateTimer = null;

    function toggleAutoUpdate() {
        var btn = document.getElementById('autoUpdateBtn');
        if (!btn) return;
        if (autoUpdateTimer) {
            clearInterval(autoUpdateTimer);
            autoUpdateTimer = null;
            btn.innerHTML = '<span class="material-symbols-outlined">sync</span> 自動更新';
            btn.classList.remove('running');
        } else {
            btn.innerHTML = '<span class="material-symbols-outlined">sync_disabled</span> 自動更新';
            btn.classList.add('running');
            autoUpdateTimer = setInterval(function () {
                addNewDemoRow();
            }, 3000);
        }
    }

    function addNewDemoRow() {
        var types = [
            { type: 'normal', details: ['入室', '退室'], prob: 0.7 },
            { type: 'warning', details: ['通信異常復旧', 'カードリーダー警告', 'バッテリー低下'], prob: 0.2 },
            { type: 'error', details: ['通信異常発生', 'ドア開放異常', 'セキュリティ違反'], prob: 0.1 }
        ];
        var gates = [
            { num: '0001', name: 'XA0001' },
            { num: '0002', name: 'XA0002' },
            { num: '0003', name: 'XA0003' },
            { num: '0004', name: 'XA0004' }
        ];
        var depts = ['所属001', '所属002', '所属003', '管理部', '開発部'];
        var deptCodes = ['001', '002', '003', '004', '005'];

        var rand = Math.random(), cumulative = 0, sel = types[0];
        for (var i = 0; i < types.length; i++) {
            cumulative += types[i].prob;
            if (rand <= cumulative) { sel = types[i]; break; }
        }

        var gate = gates[Math.floor(Math.random() * gates.length)];
        var detail = sel.details[Math.floor(Math.random() * sel.details.length)];
        var di = Math.floor(Math.random() * depts.length);
        var now = new Date();
        var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
        var dateStr = now.getFullYear() + '/' + pad(now.getMonth() + 1) + '/' + pad(now.getDate()) + ' ' +
                      pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());

        var row = {
            type: sel.type,
            date: dateStr,
            code: sel.type === 'normal' ? String(Math.floor(Math.random() * 999) + 1).padStart(6, '0') : '',
            name: sel.type === 'normal' ? '個人' + String(Math.floor(Math.random() * 999) + 1).padStart(3, '0') : '',
            deptCode: sel.type === 'normal' ? deptCodes[di] : '',
            dept: sel.type === 'normal' ? depts[di] : '',
            gate: gate.num,
            gateName: sel.type === 'normal' ? gate.name : 'H=' + gate.num.substring(2) + ' A=' + (Math.floor(Math.random() * 99) + 1),
            detail: detail
        };

        demoData.unshift(row);
        if (demoData.length > 500) demoData = demoData.slice(0, 500);
        applyAllFilters();
    }

    // ---- 列表示管理 ----
    var columnVisibility = {};
    var allColumns = ['occurredDate', 'personalCode', 'name', 'departmentCode', 'departmentName', 'gateNumber', 'gateName', 'historyDetails'];
    allColumns.forEach(function (col) { columnVisibility[col] = true; });

    function buildColumnManagerMenu() {
        var menu = document.getElementById('columnManagerMenu');
        if (!menu) return;
        menu.innerHTML = '';
        allColumns.forEach(function (col) {
            var item = document.createElement('div');
            item.className = 'column-manager-item';
            var cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = columnVisibility[col];
            cb.setAttribute('data-col', col);
            cb.addEventListener('change', function () {
                columnVisibility[col] = this.checked;
                applyColumnVisibility();
            });
            var lbl = document.createElement('label');
            lbl.textContent = columnDisplayNames[col] || col;
            lbl.addEventListener('click', function () { cb.click(); });
            item.appendChild(cb);
            item.appendChild(lbl);
            menu.appendChild(item);
        });
    }

    function applyColumnVisibility() {
        // ヘッダー
        document.querySelectorAll('.data-table th[data-column]').forEach(function (th) {
            var col = th.getAttribute('data-column');
            th.style.display = columnVisibility[col] ? '' : 'none';
        });
        // ボディ行
        document.querySelectorAll('.data-table tbody tr').forEach(function (tr) {
            var tds = tr.querySelectorAll('td');
            allColumns.forEach(function (col, idx) {
                if (tds[idx]) {
                    tds[idx].style.display = columnVisibility[col] ? '' : 'none';
                }
            });
        });
    }

    function toggleColumnManagerMenu() {
        var menu = document.getElementById('columnManagerMenu');
        if (!menu) return;
        if (menu.classList.contains('show')) {
            menu.classList.remove('show');
        } else {
            buildColumnManagerMenu();
            menu.classList.add('show');
        }
    }

    // renderTable をラップして列非表示を反映
    var originalRenderTable = renderTable;
    renderTable = function (data) {
        originalRenderTable(data);
        applyColumnVisibility();
    };

    document.addEventListener('DOMContentLoaded', function () {
        renderTable(demoData);

        // 自動更新ボタン
        var autoBtn = document.getElementById('autoUpdateBtn');
        if (autoBtn) {
            autoBtn.addEventListener('click', toggleAutoUpdate);
        }

        // 列表示管理ボタン
        var colMgrBtn = document.getElementById('columnManager');
        if (colMgrBtn) {
            colMgrBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                toggleColumnManagerMenu();
            });
        }

        // データ種別カスタムドロップダウン
        var dataTypeSelected = document.getElementById('dataTypeSelected');
        var dataTypeOptions = document.getElementById('dataTypeOptions');
        if (dataTypeSelected && dataTypeOptions) {
            dataTypeSelected.addEventListener('click', function (e) {
                e.stopPropagation();
                dataTypeOptions.classList.toggle('show');
            });
            dataTypeOptions.querySelectorAll('.dm-custom-option').forEach(function (opt) {
                opt.addEventListener('click', function () {
                    dataTypeValue = this.getAttribute('data-value');
                    updateDataTypeDisplay(dataTypeValue);
                    dataTypeOptions.classList.remove('show');
                    applyAllFilters();
                });
            });
        }

        // フィルターリセット
        var resetBtn = document.getElementById('filterReset');
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                dataTypeValue = 'all';
                updateDataTypeDisplay('all');
                excelFilters = {};
                updateFilterTriggerStates();
                applyAllFilters();
            });
        }

        // Excelフィルタートリガー（data-column属性から列名を取得）
        document.querySelectorAll('.excel-filter-trigger').forEach(function (trigger) {
            trigger.addEventListener('click', function (e) {
                var th = trigger.closest('th');
                if (!th) return;
                var colAttr = th.getAttribute('data-column');
                if (colAttr) showDmFilter(e, colAttr);
            });
        });

        // コンテキストメニュー
        document.getElementById('ctxPersonalReg').addEventListener('click', openRegistrationPage);
        document.getElementById('ctxAntiPassback').addEventListener('click', openAntiPassbackPage);
        document.addEventListener('click', function () { hideContextMenu(); });

        // 外側クリックでメニューを閉じる
        document.addEventListener('click', function (e) {
            if (!e.target.closest('.excel-filter-menu') && !e.target.closest('.excel-filter-trigger')) {
                hideDmFilters();
            }
            if (!e.target.closest('#columnManager') && !e.target.closest('.column-manager-menu')) {
                var menu = document.getElementById('columnManagerMenu');
                if (menu) menu.classList.remove('show');
            }
            if (!e.target.closest('#dataTypeDropdown')) {
                var dtOptions = document.getElementById('dataTypeOptions');
                if (dtOptions) dtOptions.classList.remove('show');
            }
        });
    });
})();
