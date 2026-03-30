/**
 * historyReport.js - 報告書ページ
 * dataMonitor / personalList パターン準拠 IIFE
 */
(function () {
    'use strict';

    /* ====== 定数 ====== */
    var ALL_COLUMNS = [
        'occurredDate', 'personalCode', 'issueCount', 'managementNumber',
        'name', 'departmentCode', 'departmentName',
        'categoryCode', 'categoryName', 'alternativeCode',
        'gateNumber', 'gateName', 'historyDetails'
    ];
    var DEFAULT_HIDDEN = [
        'issueCount', 'managementNumber', 'departmentCode',
        'categoryCode', 'categoryName', 'alternativeCode'
    ];
    var COLUMN_NAMES = {
        occurredDate:     '発生日時',
        personalCode:     '個人コード',
        issueCount:       '発行回数',
        managementNumber: '管理番号',
        name:             '氏名',
        departmentCode:   '所属コード',
        departmentName:   '所属名称',
        categoryCode:     '区分コード',
        categoryName:     '区分名称',
        alternativeCode:  '代替コード',
        gateNumber:       'ゲート番号',
        gateName:         'ゲート名称',
        historyDetails:   '履歴詳細'
    };

    /* ====== 状態 ====== */
    var masterData = [];        // 期間抽出で生成した全件
    var filteredData = [];      // フィルター適用後
    var currentPage = 1;
    var pageSize = 25;
    var sortState = { col: null, dir: 'asc' };
    var excelFilters = {};      // { colAttr: Set }
    var columnVisibility = {};  // { colAttr: true/false }
    var hrDataTypeValue = 'all'; // データ種別ドロップダウン内部状態

    ALL_COLUMNS.forEach(function (c) {
        columnVisibility[c] = DEFAULT_HIDDEN.indexOf(c) === -1;
    });

    /* ====== ユーティリティ ====== */
    function escapeHtml(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function pad2(n) { return n < 10 ? '0' + n : '' + n; }
    function fmtDate(d) {
        return d.getFullYear() + '/' + pad2(d.getMonth() + 1) + '/' + pad2(d.getDate()) +
               ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
    }

    /* ====== データ生成 ====== */
    function generateData(startDate, endDate) {
        var depts = ['総務部', '営業部', 'システム部', '経理部', '人事部', '開発部', '企画部'];
        var deptCodes = ['001', '002', '003', '004', '005', '006', '007'];
        var cats  = ['正社員', '契約社員', '派遣社員', 'アルバイト', '役員'];
        var catCodes = ['01', '02', '03', '04', '05'];
        var names = ['田中太郎', '佐藤花子', '鈴木次郎', '山田一郎', '高橋美咲',
                      '伊藤誠', '渡辺直美', '中村健太'];
        var gates = [
            { num: '0001', name: 'XA0001' }, { num: '0002', name: 'XA0002' },
            { num: '0003', name: 'XA0003' }, { num: '0004', name: 'XA0004' }
        ];
        var statusDefs = [
            { id: 'normal',   weight: 70, details: ['入室', '退室'] },
            { id: 'warning',  weight: 15, details: ['バッテリー低下', 'カード読取警告', '通信異常復旧'] },
            { id: 'error',    weight: 15, details: ['通信異常発生', 'ドア開放異常', '不正入室'] }
        ];
        var totalWeight = 100;

        masterData = [];
        var range = endDate.getTime() - startDate.getTime();

        for (var i = 0; i < 1000; i++) {
            // ステータス決定
            var r = Math.random() * totalWeight, cum = 0, st = statusDefs[0];
            for (var si = 0; si < statusDefs.length; si++) {
                cum += statusDefs[si].weight;
                if (r <= cum) { st = statusDefs[si]; break; }
            }
            var di = Math.floor(Math.random() * depts.length);
            var ci = Math.floor(Math.random() * cats.length);
            var gi = Math.floor(Math.random() * gates.length);
            var ni = Math.floor(Math.random() * names.length);
            var dt = new Date(startDate.getTime() + Math.random() * range);

            masterData.push({
                occurredDate:     fmtDate(dt),
                personalCode:     String(Math.floor(Math.random() * 999) + 1).padStart(6, '0'),
                issueCount:       String(Math.floor(Math.random() * 3) + 1),
                managementNumber: 'M' + String(i).padStart(5, '0'),
                name:             names[ni],
                departmentCode:   deptCodes[di],
                departmentName:   depts[di],
                categoryCode:     catCodes[ci],
                categoryName:     cats[ci],
                alternativeCode:  'A' + String(Math.floor(Math.random() * 9999)).padStart(4, '0'),
                gateNumber:       gates[gi].num,
                gateName:         st.id === 'normal' ? gates[gi].name :
                                  'H=' + gates[gi].num.substring(2) + ' A=' + (Math.floor(Math.random() * 99) + 1),
                historyDetails:   st.details[Math.floor(Math.random() * st.details.length)],
                _type:            st.id
            });
        }

        // 日付降順ソート
        masterData.sort(function (a, b) { return b.occurredDate.localeCompare(a.occurredDate); });
    }

    /* ====== フィルターロジック ====== */
    function getFilteredBase(excludeCol) {
        var typeVal = getDataTypeValue();
        return masterData.filter(function (row) {
            if (typeVal !== 'all' && row._type !== typeVal) return false;
            for (var col in excelFilters) {
                if (col === excludeCol) continue;
                if (excelFilters.hasOwnProperty(col)) {
                    var v = (row[col] || '').toString();
                    if (!excelFilters[col].has(v)) return false;
                }
            }
            return true;
        });
    }

    function getUniqueValues(colAttr) {
        var base = getFilteredBase(colAttr);
        var seen = {}, vals = [];
        base.forEach(function (row) {
            var v = (row[colAttr] || '').toString();
            if (!seen[v]) { seen[v] = true; vals.push(v); }
        });
        vals.sort();
        return vals;
    }

    function getDataTypeValue() {
        return hrDataTypeValue;
    }

    function applyAllFilters() {
        var typeVal = getDataTypeValue();
        filteredData = masterData.filter(function (row) {
            if (typeVal !== 'all' && row._type !== typeVal) return false;
            for (var col in excelFilters) {
                if (excelFilters.hasOwnProperty(col)) {
                    var v = (row[col] || '').toString();
                    if (!excelFilters[col].has(v)) return false;
                }
            }
            return true;
        });
        applySortToFiltered();
        currentPage = 1;
        render();
    }

    function applySortToFiltered() {
        if (!sortState.col) return;
        var col = sortState.col, dir = sortState.dir;
        filteredData.sort(function (a, b) {
            var va = (a[col] || '').toString();
            var vb = (b[col] || '').toString();
            if (!isNaN(va) && !isNaN(vb) && va !== '' && vb !== '') {
                va = parseFloat(va);
                vb = parseFloat(vb);
            } else {
                va = va.toLowerCase();
                vb = vb.toLowerCase();
            }
            var cmp = va < vb ? -1 : (va > vb ? 1 : 0);
            return dir === 'asc' ? cmp : -cmp;
        });
    }

    /* ====== レンダリング ====== */
    function render() {
        renderTable();
        renderPagination();
        updateRecordCount();
    }

    function renderTable() {
        var tbody = document.getElementById('hrTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        var start = (currentPage - 1) * pageSize;
        var end = Math.min(start + pageSize, filteredData.length);

        for (var i = start; i < end; i++) {
            var row = filteredData[i];
            var tr = document.createElement('tr');
            if (row._type === 'normal')   tr.className = 'row-normal';
            if (row._type === 'warning')  tr.className = 'row-warning';
            if (row._type === 'error')    tr.className = 'row-error';

            ALL_COLUMNS.forEach(function (col) {
                var td = document.createElement('td');
                td.textContent = row[col] || '';
                if (!columnVisibility[col]) td.style.display = 'none';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        }
        applyColumnVisibility();
    }

    function renderPagination() {
        var total = filteredData.length;
        var totalPages = Math.ceil(total / pageSize) || 1;

        // ページ情報
        var info = document.getElementById('hrPageInfo');
        if (info) {
            if (total === 0) {
                info.textContent = '0件中';
            } else {
                var s = (currentPage - 1) * pageSize + 1;
                var e = Math.min(currentPage * pageSize, total);
                info.textContent = s + '-' + e + ' / ' + total.toLocaleString() + '件中';
            }
        }

        // ページ番号
        var ul = document.getElementById('hrPagination');
        if (!ul) return;
        ul.innerHTML = '';
        if (totalPages <= 1) return;

        // 前へ
        addPageItem(ul, '前へ', currentPage > 1 ? currentPage - 1 : null, currentPage === 1);

        // 表示するページ番号を算出: 1 ... [cur-2 cur-1 cur cur+1 cur+2] ... last
        var pages = [];
        pages.push(1);
        var rangeStart = Math.max(2, currentPage - 2);
        var rangeEnd = Math.min(totalPages - 1, currentPage + 2);
        if (rangeStart > 2) pages.push(null); // 省略
        for (var p = rangeStart; p <= rangeEnd; p++) pages.push(p);
        if (rangeEnd < totalPages - 1) pages.push(null); // 省略
        if (totalPages > 1) pages.push(totalPages);

        pages.forEach(function (p) {
            if (p === null) {
                addPageItem(ul, '…', null, true);
            } else {
                addPageItem(ul, String(p), p, false, p === currentPage);
            }
        });

        // 次へ
        addPageItem(ul, '次へ', currentPage < totalPages ? currentPage + 1 : null, currentPage === totalPages);
    }

    function addPageItem(ul, label, page, disabled, active) {
        var li = document.createElement('li');
        li.className = 'page-item' + (disabled ? ' disabled' : '') + (active ? ' active' : '');
        var a = document.createElement('a');
        a.className = 'page-link';
        a.href = 'javascript:void(0)';
        a.textContent = label;
        if (page && !disabled) {
            a.addEventListener('click', function (pg) {
                return function () { goToPage(pg); };
            }(page));
        }
        li.appendChild(a);
        ul.appendChild(li);
    }

    function goToPage(p) {
        currentPage = p;
        render();
    }

    function updateRecordCount() {
        var el = document.getElementById('hrRecordCount');
        if (el) el.textContent = filteredData.length.toLocaleString();
    }

    /* ====== ソート ====== */
    function handleSort(e) {
        var th = e.target.closest('th');
        if (!th) return;
        if (e.target.closest('.excel-filter-trigger') || e.target.closest('.excel-filter-menu')) return;
        var col = th.getAttribute('data-column');
        if (!col) return;

        if (sortState.col === col) {
            sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
        } else {
            sortState.col = col;
            sortState.dir = 'asc';
        }
        applySortToFiltered();
        currentPage = 1;
        render();
        updateSortIndicators();
    }

    function updateSortIndicators() {
        document.querySelectorAll('#hrTable thead th').forEach(function (th) {
            th.classList.remove('sort-asc', 'sort-desc');
            if (th.getAttribute('data-column') === sortState.col) {
                th.classList.add(sortState.dir === 'asc' ? 'sort-asc' : 'sort-desc');
            }
        });
    }

    /* ====== 列表示管理 ====== */
    function applyColumnVisibility() {
        // ヘッダー
        document.querySelectorAll('#hrTable thead th[data-column]').forEach(function (th) {
            var col = th.getAttribute('data-column');
            th.style.display = columnVisibility[col] ? '' : 'none';
        });
        // ボディ
        document.querySelectorAll('#hrTable tbody tr').forEach(function (tr) {
            var tds = tr.querySelectorAll('td');
            ALL_COLUMNS.forEach(function (col, idx) {
                if (tds[idx]) tds[idx].style.display = columnVisibility[col] ? '' : 'none';
            });
        });
    }

    function buildColumnManagerMenu() {
        var menu = document.getElementById('hrColumnManagerMenu');
        if (!menu) return;
        menu.innerHTML = '';
        ALL_COLUMNS.forEach(function (col) {
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
            lbl.textContent = COLUMN_NAMES[col] || col;
            lbl.addEventListener('click', function () { cb.click(); });
            item.appendChild(cb);
            item.appendChild(lbl);
            menu.appendChild(item);
        });
    }

    function toggleColumnManagerMenu() {
        var menu = document.getElementById('hrColumnManagerMenu');
        if (!menu) return;
        if (menu.classList.contains('show')) {
            menu.classList.remove('show');
        } else {
            buildColumnManagerMenu();
            menu.classList.add('show');
        }
    }

    /* ====== Excelフィルター ====== */
    function hideHrFilters() {
        document.querySelectorAll('.excel-filter-menu.show').forEach(function (m) {
            m.classList.remove('show');
        });
    }

    function showHrFilter(event, colAttr) {
        event.stopPropagation();
        var menuId = 'excel-filter-' + colAttr;
        var menu = document.getElementById(menuId);
        if (!menu) return;
        var wasOpen = menu.classList.contains('show');
        hideHrFilters();
        if (wasOpen) return;

        var allValues = getUniqueValues(colAttr);
        var selected = excelFilters[colAttr] || null;

        var html = '';
        html += '<div class="excel-filter-header">' + escapeHtml(COLUMN_NAMES[colAttr] || colAttr) + ' のフィルター</div>';
        html += '<div class="excel-search-section"><input type="text" class="excel-search-box" placeholder="検索..."></div>';
        html += '<div class="excel-filter-actions">';
        html += '<button class="excel-action-btn hr-select-all-btn">すべて選択</button>';
        html += '<button class="excel-action-btn hr-clear-all-btn">すべてクリア</button>';
        html += '<button class="excel-action-btn ok-btn hr-apply-btn">OK</button>';
        html += '</div>';
        html += '<div class="excel-filter-list" id="hr-filter-list-' + colAttr + '">';
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
                filterHrOptions(colAttr, this.value);
            });
        }
        menu.querySelector('.hr-select-all-btn')?.addEventListener('click', function () {
            selectAllHrFilter(colAttr);
        });
        menu.querySelector('.hr-clear-all-btn')?.addEventListener('click', function () {
            clearAllHrFilter(colAttr);
        });
        menu.querySelector('.hr-apply-btn')?.addEventListener('click', function () {
            applyHrFilter(colAttr);
        });
        menu.querySelectorAll('.excel-filter-item').forEach(function (item) {
            item.addEventListener('click', function (e) {
                toggleHrOption(e, item);
            });
        });

        menu.classList.add('show');
    }

    function toggleHrOption(e, itemEl) {
        if (e.target.tagName === 'INPUT') return;
        var cb = itemEl.querySelector('input[type="checkbox"]');
        if (cb) cb.checked = !cb.checked;
    }

    function selectAllHrFilter(colAttr) {
        var list = document.getElementById('hr-filter-list-' + colAttr);
        if (!list) return;
        list.querySelectorAll('.excel-filter-item').forEach(function (item) {
            if (item.style.display !== 'none') {
                var cb = item.querySelector('input[type="checkbox"]');
                if (cb) cb.checked = true;
            }
        });
    }

    function clearAllHrFilter(colAttr) {
        var list = document.getElementById('hr-filter-list-' + colAttr);
        if (!list) return;
        list.querySelectorAll('.excel-filter-item').forEach(function (item) {
            if (item.style.display !== 'none') {
                var cb = item.querySelector('input[type="checkbox"]');
                if (cb) cb.checked = false;
            }
        });
    }

    function filterHrOptions(colAttr, text) {
        var list = document.getElementById('hr-filter-list-' + colAttr);
        if (!list) return;
        var lower = text.toLowerCase();
        list.querySelectorAll('.excel-filter-item').forEach(function (item) {
            var val = (item.getAttribute('data-value') || '').toLowerCase();
            var disp = val === '' ? '(空白)' : val;
            item.style.display = (lower === '' || disp.indexOf(lower) >= 0) ? '' : 'none';
        });
    }

    function applyHrFilter(colAttr) {
        var list = document.getElementById('hr-filter-list-' + colAttr);
        if (!list) return;
        var allValues = getUniqueValues(colAttr);
        var selectedSet = new Set();
        list.querySelectorAll('.excel-filter-item').forEach(function (item) {
            if (item.style.display === 'none') return;
            var cb = item.querySelector('input[type="checkbox"]');
            if (cb && cb.checked) selectedSet.add(item.getAttribute('data-value'));
        });
        if (selectedSet.size === allValues.length) {
            delete excelFilters[colAttr];
        } else {
            excelFilters[colAttr] = selectedSet;
        }
        hideHrFilters();
        applyAllFilters();
        updateFilterTriggerStates();
    }

    function updateFilterTriggerStates() {
        document.querySelectorAll('#hrTable .excel-filter-trigger').forEach(function (trigger) {
            var th = trigger.closest('th');
            if (!th) return;
            var col = th.getAttribute('data-column');
            trigger.classList.toggle('active', !!excelFilters[col]);
        });
    }

    /* ====== 期間選択モーダル ====== */
    function showHrPeriodModal() {
        var el = document.getElementById('hrPeriodModal');
        if (el) {
            var modal = new bootstrap.Modal(el);
            modal.show();
        }
    }

    function applyHrPeriod() {
        var checked = document.querySelector('input[name="hrPeriodOption"]:checked');
        if (!checked) return;
        var now = new Date();
        var startDate, endDate = new Date(now);

        switch (checked.value) {
            case 'all':    startDate = new Date('2020-01-01'); break;
            case '1year':  startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); break;
            case '1month': startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); break;
            case '1week':  startDate = new Date(now.getTime() - 7 * 24 * 3600000); break;
            case '1day':   startDate = new Date(now.getTime() - 24 * 3600000); break;
            case 'custom':
                var s = document.getElementById('hrStartDate');
                var e = document.getElementById('hrEndDate');
                if (s && e && s.value && e.value) {
                    startDate = new Date(s.value);
                    endDate = new Date(e.value);
                    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                        alert('有効な日時を入力してください。');
                        return;
                    }
                    if (startDate > endDate) {
                        alert('開始日時は終了日時より前に設定してください。');
                        return;
                    }
                } else {
                    alert('開始日時と終了日時を入力してください。');
                    return;
                }
                break;
            default: startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        }

        // 表示更新
        var disp = document.getElementById('hrPeriodDisplay');
        if (disp) disp.textContent = fmtDate(startDate) + ' ～ ' + fmtDate(endDate);

        // データ生成 → フィルター適用
        generateData(startDate, endDate);
        excelFilters = {};
        sortState = { col: null, dir: 'asc' };
        hrDataTypeValue = 'all';
        filteredData = masterData.slice();
        currentPage = 1;
        render();
        updateFilterTriggerStates();
        updateSortIndicators();

        // モーダルを閉じる
        var modalEl = document.getElementById('hrPeriodModal');
        if (modalEl) {
            var modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modal.hide();
        }
    }

    /* ====== フィルターリセット ====== */
    function resetHrFilters() {
        excelFilters = {};
        hrDataTypeValue = 'all';
        // UI表示も更新
        var dtDot = document.getElementById('hrDataTypeDot');
        var dtLabel = document.getElementById('hrDataTypeLabel');
        if (dtDot) { dtDot.style.display = 'none'; dtDot.className = 'hr-legend-dot'; }
        if (dtLabel) dtLabel.textContent = '全データ表示';
        var dtOptions = document.getElementById('hrDataTypeOptions');
        if (dtOptions) {
            dtOptions.querySelectorAll('.hr-custom-option').forEach(function (o) {
                o.classList.toggle('selected', o.getAttribute('data-value') === 'all');
            });
        }
        updateFilterTriggerStates();
        applyAllFilters();
    }

    /* ====== 条件選択モーダル ====== */
    function showHrConditionModal() {
        var el = document.getElementById('hrConditionModal');
        if (el) {
            var modal = new bootstrap.Modal(el);
            modal.show();
        }
    }
    function applyHrCondition() {
        var el = document.getElementById('hrConditionModal');
        if (el) {
            var modal = bootstrap.Modal.getInstance(el);
            if (modal) modal.hide();
        }
    }
    function loadHrCondition() { alert('条件取得'); }
    function saveHrCondition() { alert('条件保存'); }
    function browseBackup() { alert('バックアップデータ参照'); }
    function browsePersonal() { alert('個人指定参照'); }
    function browseDepartment() { alert('所属指定参照'); }
    function browseCategory() { alert('区分指定参照'); }
    function browseGate() { alert('ゲート指定参照'); }
    function browseHistory() { alert('履歴データ指定参照'); }

    /* ====== 初期化 ====== */
    document.addEventListener('DOMContentLoaded', function () {
        // データ種別カスタムドロップダウン
        var dotClasses = { all: '', normal: 'hr-dot-normal', warning: 'hr-dot-warning', error: 'hr-dot-error' };
        var dtLabels = { all: '全データ表示', normal: '正常データ表示', warning: '軽エラーデータ表示', error: '重エラーデータ表示' };
        var dtSelected = document.getElementById('hrDataTypeSelected');
        var dtOptions = document.getElementById('hrDataTypeOptions');
        var dtDot = document.getElementById('hrDataTypeDot');
        var dtLabel = document.getElementById('hrDataTypeLabel');
        if (dtSelected && dtOptions) {
            dtSelected.addEventListener('click', function (e) {
                e.stopPropagation();
                dtOptions.classList.toggle('show');
            });
            dtOptions.querySelectorAll('.hr-custom-option').forEach(function (opt) {
                opt.addEventListener('click', function () {
                    var value = this.getAttribute('data-value');
                    hrDataTypeValue = value;
                    if (dtLabel) dtLabel.textContent = dtLabels[value];
                    if (dtDot) {
                        dtDot.className = 'hr-legend-dot ' + (dotClasses[value] || '');
                        dtDot.style.display = value === 'all' ? 'none' : '';
                    }
                    dtOptions.querySelectorAll('.hr-custom-option').forEach(function (o) {
                        o.classList.toggle('selected', o.getAttribute('data-value') === value);
                    });
                    dtOptions.classList.remove('show');
                    applyAllFilters();
                });
            });
        }

        // ページサイズ変更
        var sizeEl = document.getElementById('hrPageSize');
        if (sizeEl) {
            sizeEl.addEventListener('change', function () {
                pageSize = parseInt(this.value, 10);
                currentPage = 1;
                render();
            });
        }

        // フィルターリセット
        var resetBtn = document.getElementById('hrFilterReset');
        if (resetBtn) {
            resetBtn.addEventListener('click', resetHrFilters);
        }

        // 列表示管理
        var colMgrBtn = document.getElementById('hrColumnManager');
        if (colMgrBtn) {
            colMgrBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                toggleColumnManagerMenu();
            });
        }

        // ソート（ヘッダークリック）
        var thead = document.querySelector('#hrTable thead');
        if (thead) {
            thead.addEventListener('click', handleSort);
        }

        // Excelフィルタートリガー（data-column属性から列名を取得）
        document.querySelectorAll('#hrTable .excel-filter-trigger').forEach(function (trigger) {
            trigger.addEventListener('click', function (e) {
                var th = trigger.closest('th');
                if (!th) return;
                var colAttr = th.getAttribute('data-column');
                if (colAttr) showHrFilter(e, colAttr);
            });
        });

        // ヘッダーボタン
        document.getElementById('hrPeriodBtn')?.addEventListener('click', showHrPeriodModal);
        document.getElementById('hrConditionBtn')?.addEventListener('click', showHrConditionModal);

        // 条件モーダル内ボタン
        document.getElementById('hrCondLoadBtn')?.addEventListener('click', loadHrCondition);
        document.getElementById('hrCondSaveBtn')?.addEventListener('click', saveHrCondition);
        document.getElementById('hrBrowseBackupBtn')?.addEventListener('click', browseBackup);
        document.getElementById('hrBrowsePersonalBtn')?.addEventListener('click', browsePersonal);
        document.getElementById('hrBrowseDeptBtn')?.addEventListener('click', browseDepartment);
        document.getElementById('hrBrowseCatBtn')?.addEventListener('click', browseCategory);
        document.getElementById('hrBrowseGateBtn')?.addEventListener('click', browseGate);
        document.getElementById('hrBrowseHistoryBtn')?.addEventListener('click', browseHistory);
        document.getElementById('hrCondApplyBtn')?.addEventListener('click', applyHrCondition);
        document.getElementById('hrPeriodApplyBtn')?.addEventListener('click', applyHrPeriod);

        // 期間モーダル: カスタム表示切替
        document.querySelectorAll('input[name="hrPeriodOption"]').forEach(function (radio) {
            radio.addEventListener('change', function () {
                var custom = document.getElementById('hrCustomPeriodInputs');
                if (custom) custom.style.display = this.value === 'custom' ? 'block' : 'none';
            });
        });

        // 外側クリックでメニューを閉じる
        document.addEventListener('click', function (e) {
            if (!e.target.closest('.excel-filter-menu') && !e.target.closest('.excel-filter-trigger')) {
                hideHrFilters();
            }
            if (!e.target.closest('#hrColumnManager') && !e.target.closest('.column-manager-menu')) {
                var menu = document.getElementById('hrColumnManagerMenu');
                if (menu) menu.classList.remove('show');
            }
            if (!e.target.closest('#hrDataTypeDropdown')) {
                if (dtOptions) dtOptions.classList.remove('show');
            }
        });

        // 初期列非表示を適用
        applyColumnVisibility();

        // URLパラメータからの自動抽出 (ステータスモニターからの遷移)
        var urlParams = new URLSearchParams(window.location.search);
        var paramGate = urlParams.get('gate');
        var paramPeriod = urlParams.get('period');
        var paramDataType = urlParams.get('dataType');
        var paramPersonalCode = urlParams.get('personalCode');

        if (paramPeriod || paramPersonalCode) {
            if (!paramPeriod) paramPeriod = '1day';
            // 期間を算出
            var now = new Date();
            var autoStart, autoEnd = new Date(now);
            switch (paramPeriod) {
                case '1day':  autoStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
                case '2day':  autoStart = new Date(now.getTime() - 24 * 3600000); break;
                case '1week': autoStart = new Date(now.getTime() - 7 * 24 * 3600000); break;
                default:      autoStart = new Date(now.getTime() - 24 * 3600000);
            }

            // 期間表示を更新
            var disp = document.getElementById('hrPeriodDisplay');
            if (disp) disp.textContent = fmtDate(autoStart) + ' ～ ' + fmtDate(autoEnd);

            // データ生成
            generateData(autoStart, autoEnd);

            // データ種別フィルターを設定
            if (paramDataType && paramDataType !== 'all') {
                hrDataTypeValue = paramDataType;
            }

            // ゲート番号でExcelフィルターを自動適用
            if (paramGate) {
                var gateValues = getUniqueValues('gateNumber');
                var gateMatch = gateValues.filter(function (v) { return v === paramGate; });
                if (gateMatch.length > 0) {
                    excelFilters['gateNumber'] = new Set(gateMatch);
                    updateFilterTriggerStates();
                }
            }

            // 個人コードでExcelフィルターを自動適用
            if (paramPersonalCode) {
                var pcValues = getUniqueValues('personalCode');
                var pcMatch = pcValues.filter(function (v) { return v === paramPersonalCode; });
                if (pcMatch.length > 0) {
                    excelFilters['personalCode'] = new Set(pcMatch);
                    updateFilterTriggerStates();
                }
            }

            filteredData = masterData.slice();
            applyAllFilters();
        } else {
            render();
        }
    });

})();
