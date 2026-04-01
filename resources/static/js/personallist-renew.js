// Personal List JavaScript Functionality

// Sample data for demonstration (up to 1,000,000 records capacity)
let personalData = [];
let filteredData = [];
let currentPage = 1;
let itemsPerPage = 25;
let currentFilters = {};
let columnOrder = ['select', 'sendStatus', 'registrationStatus', 'personalCode', 'managementNumber', 'name', 'katakana', 'tenantCode', 'tenantName', 'departmentCode', 'departmentName', 'kubunCode', 'kubunName', 'validFrom', 'validTo', 'issueCount', 'alternativeCode', 'bioCode', 'readProhibition', 'antipass', 'securityOperation', 'monitorCard', 'registrationDate', 'updateDate'];
let hiddenColumns = ['issueCount', 'alternativeCode', 'bioCode', 'readProhibition', 'antipass', 'securityOperation', 'monitorCard', 'registrationDate', 'updateDate'];
let sortState = { column: null, direction: 'asc' };

// Initialize the page
document.addEventListener('DOMContentLoaded', function () {
    generateSampleData();
    setupEventListeners();
    updateTableHeaders();
    applyFiltersAndDisplay();

    // 保存された設定を復元
    loadColumnSettings();

    // 非表示列バッジを初期更新


    // 列表示管理ドロップダウン
    var colMgrBtn = document.getElementById('columnManagerBtn');
    if (colMgrBtn) {
        colMgrBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            toggleColumnManagerMenu();
        });
    }

    // 外側クリックでメニューを閉じる
    document.addEventListener('click', function (e) {
        if (!e.target.closest('#columnManagerBtn') && !e.target.closest('.column-manager-menu')) {
            var menu = document.getElementById('columnManagerMenu');
            if (menu) menu.classList.remove('show');
        }
        // 管理機能ドロップダウンを閉じる
        var dropdown = document.querySelector('.pl-manage-dropdown');
        if (dropdown && !dropdown.contains(e.target)) {
            var manageMenu = document.getElementById('manageMenu');
            if (manageMenu) manageMenu.classList.remove('show');
        }
    });

    // ヘッダーボタン群
    document.getElementById('plSendBtn')?.addEventListener('click', sendPersonalData);
    document.getElementById('plResendBtn')?.addEventListener('click', sendUnsentData);
    var regBtn = document.getElementById('plRegisterBtn');
    if (regBtn) {
        regBtn.addEventListener('click', function () {
            var href = this.dataset.href || '/personalRegistration';
            window.location.href = href;
        });
    }
    document.getElementById('plDeleteBtn')?.addEventListener('click', bulkDelete);
    document.getElementById('plRevokeBtn')?.addEventListener('click', revokePermission);
    document.getElementById('plUploadBtn')?.addEventListener('click', uploadData);
    document.getElementById('plDownloadBtn')?.addEventListener('click', downloadData);
    document.getElementById('manageDropdownBtn')?.addEventListener('click', toggleManageMenu);
    document.getElementById('itemsPerPage')?.addEventListener('change', changeItemsPerPage);
    document.getElementById('plFilterResetBtn')?.addEventListener('click', resetFilters);

    // 管理メニュー項目
    document.getElementById('plManageDept')?.addEventListener('click', function () { alert('所属の管理画面に遷移します'); });
    document.getElementById('plManageCat')?.addEventListener('click', function () { alert('区分の管理画面に遷移します'); });
    document.getElementById('plManageKey')?.addEventListener('click', function () { alert('通行権限(鍵)の管理画面に遷移します'); });
    document.getElementById('plManageBulk')?.addEventListener('click', function () { alert('通行権限の一括変更画面に遷移します'); });
    document.getElementById('plManageTime')?.addEventListener('click', function () { alert('入退室制限時間帯の管理画面に遷移します'); });
});

// Generate sample data for testing
function generateSampleData() {
    const departments = ['総務部', '営業部', 'システム部', '経理部', '人事部', '開発部', '企画部'];
    const categories = ['正社員', '契約社員', '派遣社員', 'アルバイト', '役員'];
    const firstNames = ['太郎', '花子', '次郎', '美子', '三郎', '恵子', '四郎', '智子', '五郎', '由美'];
    const lastNames = ['田中', '佐藤', '鈴木', '高橋', '渡辺', '伊藤', '中村', '小林', '加藤', '吉田'];
    const katakanaParts = ['タナカ', 'サトウ', 'スズキ', 'タカハシ', 'ワタナベ', 'イトウ', 'ナカムラ', 'コバヤシ', 'カトウ', 'ヨシダ'];

    personalData = [];
    for (let i = 1; i <= 1000; i++) {
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const katakanaName = katakanaParts[Math.floor(Math.random() * katakanaParts.length)];
        const department = departments[Math.floor(Math.random() * departments.length)];

        personalData.push({
            id: i,
            sendStatus: Math.random() > 0.3 ? '済' : '未',
            registrationStatus: Math.random() > 0.8 ? '削除' : '登録',
            personalCode: `kojin${String(i).padStart(4, '0')}`,
            issueCount: Math.random() > 0.5 ? '1' : '2',
            managementNumber: `no${String(i).padStart(4, '0')}`,
            name: `${lastName} ${firstName}`,
            katakana: `${katakanaName} ${firstNames[Math.floor(Math.random() * firstNames.length)].replace('郎', 'ロウ').replace('子', 'コ')}`,
            tenantCode: String(i).padStart(3, '0'),
            tenantName: `テナント${i}`,
            departmentCode: `dept${String(i).padStart(3, '0')}`,
            departmentName: department,
            kubunCode: `cat${String(i).padStart(3, '0')}`,
            kubunName: categories[Math.floor(Math.random() * categories.length)],
            validFrom: generateDate(),
            validTo: generateDate(true),
            alternativeCode: `alt${String(i).padStart(4, '0')}`,
            bioCode: Math.random() > 0.5 ? String(i).padStart(4, '0') : String(i).padStart(8, '0'),
            readProhibition: Math.random() > 0.7 ? '有効' : '無効',
            antipass: Math.random() > 0.8 ? '有効' : '無効',
            securityOperation: Math.random() > 0.6 ? '有効' : '無効',
            monitorCard: Math.random() > 0.5 ? '有効' : '無効',
            registrationDate: generateDate(),
            updateDate: generateDate(),
            selected: false
        });
    }
    filteredData = [...personalData];
}

// Generate date in YYYYMMDD format
function generateDate(future = false) {
    const date = new Date();
    if (future) {
        date.setDate(date.getDate() + Math.floor(Math.random() * 365));
    } else {
        date.setDate(date.getDate() - Math.floor(Math.random() * 365));
    }
    return date.toISOString().slice(0, 10).replace(/-/g, '');
}

// Setup event listeners
function setupEventListeners() {
    // Close Excel filter menus when clicking outside
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.excel-filter-trigger') && 
            !e.target.closest('.excel-filter-menu') &&
            !e.target.closest('.excel-search-box')) {
            hideAllExcelFilters();
        }
    });
}


// Show Excel-like filter
function showExcelFilter(event, columnKey) {
    event.stopPropagation();
    hideAllExcelFilters();

    const filterMenu = document.getElementById(`excel-filter-${columnKey}`);
    if (!filterMenu) return;
    
    const triggerElement = event.target;

    // Get unique values for this column
    const baseData = personalData.filter(item => {
        for (const [key, filterValues] of Object.entries(currentFilters)) {
            if (key === columnKey) continue;
            if (!filterValues || filterValues.length === 0) continue;
            if (!filterValues.includes(item[key])) return false;
        }
        return true;
    });
    const uniqueValues = [...new Set(baseData.map(item => item[columnKey]))].sort();

    const currentFilterValues = currentFilters[columnKey] || [];
    const isFiltered = currentFilterValues.length > 0 && currentFilterValues.length < uniqueValues.length;

    filterMenu.innerHTML = `
        <div class="excel-filter-header">
            ${getColumnDisplayName(columnKey)} のフィルター
        </div>
        
        <div class="excel-search-section">
            <input type="text" class="excel-search-box" placeholder="検索テキストを入力" 
                   oninput="filterExcelOptions('${columnKey}', this.value)"
                   onclick="event.stopPropagation()">
        </div>
        
        <div class="excel-filter-actions">
            <button class="excel-action-btn" onclick="selectAllExcelFilter('${columnKey}', event)">すべて選択</button>
            <button class="excel-action-btn" onclick="clearAllExcelFilter('${columnKey}', event)">すべてクリア</button>
            <button class="excel-action-btn ok-btn" onclick="applyExcelFilter('${columnKey}')">OK</button>
        </div>
        
        <div class="excel-filter-list" id="excel-options-${columnKey}">
            <div class="excel-filter-item select-all" onclick="toggleExcelSelectAll('${columnKey}', event); event.stopPropagation();">
                <input type="checkbox" id="select-all-${columnKey}" ${!isFiltered ? 'checked' : ''} onclick="event.stopPropagation();">
                <span>（すべて選択）</span>
            </div>
            ${generateExcelFilterOptions(columnKey, uniqueValues, currentFilterValues)}
            <div class="excel-filter-resize-handle" onmousedown="startResize(event, '${columnKey}')"></div>
        </div>
        
        <div class="excel-filter-stats">
            ${uniqueValues.length}件中 ${currentFilterValues.length || uniqueValues.length}件を表示
        </div>
    `;

    filterMenu.classList.add('show');
}

function generateExcelFilterOptions(columnKey, values, currentFilter) {
    return values.map(value => {
        const isChecked = currentFilter.length === 0 || currentFilter.includes(value);
        const escaped = common.escapeHtml(value);
        // data属性で値を安全に受け渡し
        return `
            <div class="excel-filter-item" data-col="${common.escapeHtml(columnKey)}" data-val="${escaped}" onclick="toggleExcelOption(this.dataset.col, this.dataset.val, event); event.stopPropagation();">
                <input type="checkbox" ${isChecked ? 'checked' : ''} onclick="event.stopPropagation();">
                <span>${escaped}</span>
            </div>
        `;
    }).join('');
}

function toggleExcelSelectAll(columnKey, evt) {
    // イベント伝播を停止
    if (evt) {
        evt.stopPropagation();
        evt.preventDefault();
    }

    const selectAllCheckbox = document.getElementById(`select-all-${columnKey}`);
    const allCheckboxes = document.querySelectorAll(`#excel-options-${columnKey} .excel-filter-item:not(.select-all) input[type="checkbox"]`);

    selectAllCheckbox.checked = !selectAllCheckbox.checked;

    allCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
}

function toggleExcelOption(columnKey, value, evt) {
    // イベント伝播を停止してモーダルが閉じないようにする
    if (evt) {
        evt.stopPropagation();
        evt.preventDefault();
    }

    const item = evt ? evt.currentTarget : null;
    if (!item) return;
    const checkbox = item.querySelector('input[type="checkbox"]');
    checkbox.checked = !checkbox.checked;

    updateExcelSelectAllState(columnKey);
}

function updateExcelSelectAllState(columnKey) {
    const selectAllCheckbox = document.getElementById(`select-all-${columnKey}`);
    const allCheckboxes = document.querySelectorAll(`#excel-options-${columnKey} .excel-filter-item:not(.select-all) input[type="checkbox"]`);
    const checkedBoxes = document.querySelectorAll(`#excel-options-${columnKey} .excel-filter-item:not(.select-all) input[type="checkbox"]:checked`);

    if (checkedBoxes.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedBoxes.length === allCheckboxes.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    }
}

function selectAllExcelFilter(columnKey, evt) {
    if (evt) { evt.stopPropagation(); evt.preventDefault(); }
    
    const selectAllCheckbox = document.getElementById(`select-all-${columnKey}`);
    const allCheckboxes = document.querySelectorAll(`#excel-options-${columnKey} .excel-filter-item:not(.select-all) input[type="checkbox"]`);
    
    selectAllCheckbox.checked = true;
    selectAllCheckbox.indeterminate = false;
    allCheckboxes.forEach(checkbox => checkbox.checked = true);
}

function clearAllExcelFilter(columnKey, evt) {
    if (evt) { evt.stopPropagation(); evt.preventDefault(); }
    
    const selectAllCheckbox = document.getElementById(`select-all-${columnKey}`);
    const allCheckboxes = document.querySelectorAll(`#excel-options-${columnKey} .excel-filter-item:not(.select-all) input[type="checkbox"]`);
    
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
    allCheckboxes.forEach(checkbox => checkbox.checked = false);
}

function filterExcelOptions(columnKey, searchTerm) {
    const items = document.querySelectorAll(`#excel-options-${columnKey} .excel-filter-item:not(.select-all)`);
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(searchTerm.toLowerCase())) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function applyExcelFilter(columnKey) {
    const allItems = document.querySelectorAll(`#excel-options-${columnKey} .excel-filter-item:not(.select-all)`);
    const checkedItems = Array.from(allItems)
        .filter(item => item.style.display !== 'none')
        .map(item => item.querySelector('input[type="checkbox"]'))
        .filter(cb => cb && cb.checked);
    const selectedValues = Array.from(checkedItems).map(checkbox => checkbox.parentElement.querySelector('span').textContent);

    if (selectedValues.length === 0) {
        // No items selected, show none
        currentFilters[columnKey] = ['__NONE__'];
    } else {
        // Get all possible values
        const allValues = [...new Set(personalData.map(item => item[columnKey]))];

        if (selectedValues.length === allValues.length) {
            // All items selected, remove filter
            delete currentFilters[columnKey];
        } else {
            // Some items selected
            currentFilters[columnKey] = selectedValues;
        }
    }

    hideAllExcelFilters();
    applyFiltersAndDisplay();
}

// Hide all Excel filter menus
function hideAllExcelFilters() {
    document.querySelectorAll('.excel-filter-menu').forEach(menu => {
        menu.classList.remove('show');
    });
}

// Apply filters and display data
function applyFiltersAndDisplay() {
    filteredData = personalData.filter(item => {
        for (const [columnKey, filterValues] of Object.entries(currentFilters)) {
            if (!filterValues || filterValues.length === 0) continue;
            if (!filterValues.includes(item[columnKey])) {
                return false;
            }
        }
        return true;
    });

    // フィルター後に currentPage をクランプ
    const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    updatePagination();
    displayCurrentPage();
    updateFilteredColumnHeaders();
    updateCurrentCountDisplay();
}

// Update filtered column headers
function updateFilteredColumnHeaders() {
    // Reset all header styles
    document.querySelectorAll('.data-table th').forEach(th => {
        th.classList.remove('filtered');
        const trigger = th.querySelector('.excel-filter-trigger');
        if (trigger) {
            trigger.classList.remove('active', 'filtered');
        }
    });

    // Mark filtered columns
    for (const columnKey of Object.keys(currentFilters)) {
        const th = document.querySelector(`th[data-column="${columnKey}"]`);
        if (th) {
            th.classList.add('filtered');
            const trigger = th.querySelector('.excel-filter-trigger');
            if (trigger) {
                trigger.classList.add('filtered'); // Add black triangle for filtered state
            }
        }
    }
}

// Update pagination
function updatePagination() {
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Update page info
    const start = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);
    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) {
        pageInfo.innerHTML = `${start}-${end} / ${totalItems}件中 (全件数: <span id="totalCount">${personalData.length}</span>件)`;
    }

    // Update pagination buttons
    const pagination = document.getElementById('pagination');
    if (!pagination) {
        return;
    }
    pagination.innerHTML = '';

    // 0件の場合はページネーションボタンを表示しない
    if (totalPages === 0) return;

    // Previous button
    const prevButton = document.createElement('li');
    prevButton.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevButton.innerHTML = `<a class="page-link" href="javascript:void(0)" onclick="changePage(${currentPage - 1})">前へ</a>`;
    pagination.appendChild(prevButton);

    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
        const firstPage = document.createElement('li');
        firstPage.className = 'page-item';
        firstPage.innerHTML = '<a class="page-link" href="javascript:void(0)" onclick="changePage(1)">1</a>';
        pagination.appendChild(firstPage);

        if (startPage > 2) {
            const ellipsis = document.createElement('li');
            ellipsis.className = 'page-item disabled';
            ellipsis.innerHTML = '<span class="page-link">...</span>';
            pagination.appendChild(ellipsis);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('li');
        pageButton.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageButton.innerHTML = `<a class="page-link" href="javascript:void(0)" onclick="changePage(${i})">${i}</a>`;
        pagination.appendChild(pageButton);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('li');
            ellipsis.className = 'page-item disabled';
            ellipsis.innerHTML = '<span class="page-link">...</span>';
            pagination.appendChild(ellipsis);
        }

        const lastPage = document.createElement('li');
        lastPage.className = 'page-item';
        lastPage.innerHTML = `<a class="page-link" href="javascript:void(0)" onclick="changePage(${totalPages})">${totalPages}</a>`;
        pagination.appendChild(lastPage);
    }

    // Next button
    const nextButton = document.createElement('li');
    nextButton.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextButton.innerHTML = `<a class="page-link" href="javascript:void(0)" onclick="changePage(${currentPage + 1})">次へ</a>`;
    pagination.appendChild(nextButton);
}

// Display current page data
function displayCurrentPage() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredData.slice(start, end);

    const tbody = document.getElementById('personalTableBody');
    tbody.innerHTML = '';

    pageData.forEach(person => {
        const row = document.createElement('tr');
        row.className = 'personal-row';
        row.setAttribute('data-person-id', person.id);

        let rowHTML = '';
        columnOrder.forEach(columnKey => {
            if (hiddenColumns.includes(columnKey)) return;

            let cellContent = '';
            switch (columnKey) {
                case 'select':
                    cellContent = `<input type="checkbox" value="${Number(person.id)}" onchange="togglePersonSelection(${Number(person.id)}, this.checked)" onclick="event.stopPropagation();">`;
                    break;
                default:
                    cellContent = common.escapeHtml(person[columnKey] || '');
                    break;
            }
            rowHTML += `<td>${cellContent}</td>`;
        });

        row.innerHTML = rowHTML;

        row.addEventListener('dblclick', () => {
            openEditPage(person.id, person.name);
        });

        row.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showHistorySettingsModal(person);
        });

        tbody.appendChild(row);
    });

}

// Change page
function changePage(page) {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        displayCurrentPage();
        updatePagination();
    }
}

// Change items per page
function changeItemsPerPage() {
    itemsPerPage = parseInt(document.getElementById('itemsPerPage').value);
    currentPage = 1;
    applyFiltersAndDisplay();
}

// Toggle select all
function toggleSelectAll() {
    const selectAll = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('#personalTableBody input[type="checkbox"]');

    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
        const personId = parseInt(checkbox.value);
        togglePersonSelection(personId, checkbox.checked);
    });
}

// Toggle person selection
function togglePersonSelection(personId, selected) {
    const person = personalData.find(p => p.id === personId);
    if (person) {
        person.selected = selected;
    }
}

// Reset filters
function resetFilters() {
    currentFilters = {};
    hideAllExcelFilters();
    applyFiltersAndDisplay();
}

// Direct table header drag and drop functionality
let draggedColumn = null;
let draggedColumnIndex = null;

function handleDragStart(event) {
    // Make sure we're dragging the th element
    const th = event.target.closest('th');
    if (!th || !th.draggable) return;

    draggedColumn = th;
    draggedColumnIndex = Array.from(th.parentNode.children).indexOf(th);

    th.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', th.dataset.column);

}

function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    const th = event.target.closest('th');
    if (th && th !== draggedColumn && th.draggable) {
        // Remove drag-over class from all headers
        document.querySelectorAll('th.drag-over').forEach(header => header.classList.remove('drag-over'));
        th.classList.add('drag-over');
    }
}

function handleDrop(event) {
    event.preventDefault();

    const targetTh = event.target.closest('th');
    if (!targetTh || !draggedColumn || targetTh === draggedColumn) {
        cleanupDragState();
        return;
    }


    const targetIndex = Array.from(targetTh.parentNode.children).indexOf(targetTh);
    const draggedColumnKey = draggedColumn.dataset.column;
    const targetColumnKey = targetTh.dataset.column;

    // Update column order array
    const draggedOrderIndex = columnOrder.indexOf(draggedColumnKey);
    const targetOrderIndex = columnOrder.indexOf(targetColumnKey);

    if (draggedOrderIndex !== -1 && targetOrderIndex !== -1) {
        // Remove from old position and insert at new position
        columnOrder.splice(draggedOrderIndex, 1);
        const newTargetIndex = targetOrderIndex > draggedOrderIndex ? targetOrderIndex - 1 : targetOrderIndex;
        columnOrder.splice(newTargetIndex, 0, draggedColumnKey);


        // Rebuild the entire table with new order
        rebuildTableWithNewOrder();

        // Show feedback
        showColumnReorderFeedback(draggedColumnKey, targetColumnKey);
    }

    cleanupDragState();
}

function handleDragEnd(event) {
    cleanupDragState();
}

function cleanupDragState() {
    if (draggedColumn) {
        draggedColumn.classList.remove('dragging');
    }
    document.querySelectorAll('th.drag-over').forEach(th => th.classList.remove('drag-over'));
    draggedColumn = null;
    draggedColumnIndex = null;
}

function rebuildTableWithNewOrder() {
    // Update table headers
    updateTableHeaders();

    // Redisplay current page data with new column order
    displayCurrentPage();
    
    // 設定を保存
    saveColumnSettings();
}

function updateTableHeaders() {
    const thead = document.querySelector('#personalTable thead tr');
    const columnDefinitions = {
        'select': {
            title: '<input type="checkbox" id="selectAll" onchange="toggleSelectAll()">',
            draggable: false
        },
        'sendStatus': {
            title: '送信状態',
            draggable: true
        },
        'registrationStatus': {
            title: '登録状態',
            draggable: true
        },
        'personalCode': {
            title: '個人コード',
            draggable: true
        },
        'issueCount': {
            title: '発行回数',
            draggable: true
        },
        'managementNumber': {
            title: '管理番号',
            draggable: true
        },
        'name': {
            title: '氏名',
            draggable: true
        },
        'katakana': {
            title: '氏名(ｶﾅ)',
            draggable: true
        },
        'tenantCode': {
            title: 'テナントコード',
            draggable: true
        },
        'tenantName': {
            title: 'テナント名称',
            draggable: true
        },
        'departmentCode': {
            title: '所属コード',
            draggable: true
        },
        'departmentName': {
            title: '所属名称',
            draggable: true
        },
        'kubunCode': {
            title: '区分コード',
            draggable: true
        },
        'kubunName': {
            title: '区分名称',
            draggable: true
        },
        'validFrom': {
            title: '利用開始日',
            draggable: true
        },
        'validTo': {
            title: '利用終了日',
            draggable: true
        },
        'alternativeCode': {
            title: '代替コード',
            draggable: true
        },
        'bioCode': {
            title: 'バイオコード',
            draggable: true
        },
        'readProhibition': {
            title: '読取禁止',
            draggable: true
        },
        'antipass': {
            title: 'アンチパス',
            draggable: true
        },
        'securityOperation': {
            title: '警備セット時操作',
            draggable: true
        },
        'monitorCard': {
            title: '監視カード',
            draggable: true
        },
        'registrationDate': {
            title: '登録日',
            draggable: true
        },
        'updateDate': {
            title: '更新日',
            draggable: true
        }
    };

    // Clear and rebuild headers
    thead.innerHTML = '';

    columnOrder.forEach(columnKey => {
        if (hiddenColumns.includes(columnKey)) return;

        const def = columnDefinitions[columnKey];
        if (!def) return;

        const th = document.createElement('th');
        th.setAttribute('data-column', columnKey);

        if (def.draggable) {
            th.setAttribute('draggable', 'true');
            th.addEventListener('dragstart', handleDragStart);
            th.addEventListener('dragover', handleDragOver);
            th.addEventListener('drop', handleDrop);
            th.addEventListener('dragend', handleDragEnd);

            // ソート機能
            th.addEventListener('click', (e) => {
                if (!e.target.closest('.excel-filter-trigger') && !e.target.closest('.excel-filter-menu')) {
                    handleSort(columnKey);
                }
            });

            // ソート状態の表示
            if (sortState.column === columnKey) {
                th.classList.add(sortState.direction === 'asc' ? 'sort-asc' : 'sort-desc');
            }

            th.innerHTML = `${def.title}<div class="excel-filter-trigger" onclick="showExcelFilter(event, '${columnKey}')"></div><div class="excel-filter-menu" id="excel-filter-${columnKey}"></div>`;
        } else {
            th.innerHTML = def.title;
        }

        thead.appendChild(th);
    });
}

// Handle column sorting
function handleSort(columnKey) {
    
    // ソート状態の更新
    if (sortState.column === columnKey) {
        sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
        sortState.column = columnKey;
        sortState.direction = 'asc';
    }
    
    // データのソート
    filteredData.sort((a, b) => {
        let aValue = a[columnKey] || '';
        let bValue = b[columnKey] || '';
        
        // 数値っぽい場合は数値としてソート
        if (!isNaN(aValue) && !isNaN(bValue)) {
            aValue = parseFloat(aValue);
            bValue = parseFloat(bValue);
        } else {
            // 文字列として比較
            aValue = aValue.toString().toLowerCase();
            bValue = bValue.toString().toLowerCase();
        }
        
        if (aValue < bValue) {
            return sortState.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortState.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });
    
    // ページを1に戻してテーブル更新
    currentPage = 1;
    updateTableHeaders();
    updateFilteredColumnHeaders();
    displayCurrentPage();
    updatePagination();
    
}


// 列設定の保存
function saveColumnSettings() {
    const settings = {
        columnOrder: columnOrder,
        hiddenColumns: hiddenColumns
    };
    localStorage.setItem('personalList_settings', JSON.stringify(settings));
}

// 列設定の復元
function loadColumnSettings() {
    const settings = JSON.parse(localStorage.getItem('personalList_settings') || '{}');

    if (settings.columnOrder && Array.isArray(settings.columnOrder)) {
        columnOrder = [...settings.columnOrder];
    }

    if (settings.hiddenColumns && Array.isArray(settings.hiddenColumns)) {
        hiddenColumns = [...settings.hiddenColumns];
    }

    updateTableHeaders();
    displayCurrentPage();
}

// ---- 列表示管理ドロップダウン（dataMonitor方式） ----
function buildColumnManagerMenu() {
    var menu = document.getElementById('columnManagerMenu');
    if (!menu) return;
    menu.innerHTML = '';

    var columnDisplayNames = getColumnDisplayNameMap();

    columnOrder.forEach(function (col) {
        if (col === 'select') return; // チェックボックス列はスキップ
        var item = document.createElement('div');
        item.className = 'column-manager-item';
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = !hiddenColumns.includes(col);
        cb.setAttribute('data-col', col);
        cb.addEventListener('change', function () {
            if (this.checked) {
                hiddenColumns = hiddenColumns.filter(function (c) { return c !== col; });
            } else {
                if (!hiddenColumns.includes(col)) hiddenColumns.push(col);
            }
        
            rebuildTableWithNewOrder();
            saveColumnSettings();
        });
        var lbl = document.createElement('label');
        lbl.textContent = columnDisplayNames[col] || col;
        lbl.addEventListener('click', function () { cb.click(); });
        item.appendChild(cb);
        item.appendChild(lbl);
        menu.appendChild(item);
    });
}

function getColumnDisplayNameMap() {
    return {
        'sendStatus': '送信状態',
        'registrationStatus': '登録状態',
        'personalCode': '個人コード',
        'issueCount': '発行回数',
        'managementNumber': '管理番号',
        'name': '氏名',
        'katakana': '氏名(ｶﾅ)',
        'tenantCode': 'テナントコード',
        'tenantName': 'テナント名称',
        'departmentCode': '所属コード',
        'departmentName': '所属名称',
        'kubunCode': '区分コード',
        'kubunName': '区分名称',
        'validFrom': '利用開始日',
        'validTo': '利用終了日',
        'alternativeCode': '代替コード',
        'bioCode': 'バイオコード',
        'readProhibition': '読取禁止',
        'antipass': 'アンチパス',
        'securityOperation': '警備セット時操作',
        'monitorCard': '監視カード',
        'registrationDate': '登録日',
        'updateDate': '更新日'
    };
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



function showColumnReorderFeedback(draggedColumn, targetColumn) {
    const feedback = document.createElement('div');
    feedback.className = 'alert alert-info position-fixed';
    feedback.style.cssText = 'top: 20px; right: 20px; z-index: 9999; opacity: 0; transition: opacity 0.3s ease;';
    feedback.innerHTML = `<i class="fas fa-arrows-alt"></i> 「${getColumnDisplayName(draggedColumn)}」を「${getColumnDisplayName(targetColumn)}」の位置に移動しました`;

    document.body.appendChild(feedback);

    // Animate in
    setTimeout(() => feedback.style.opacity = '1', 10);

    // Remove after 3 seconds
    setTimeout(() => {
        feedback.style.opacity = '0';
        setTimeout(() => document.body.removeChild(feedback), 300);
    }, 3000);
}

function getColumnDisplayName(columnKey) {
    const names = {
        'select': '選択',
        'sendStatus': '送信状態',
        'registrationStatus': '登録状態',
        'personalCode': '個人コード',
        'issueCount': '発行回数',
        'managementNumber': '管理番号',
        'name': '氏名',
        'katakana': '氏名(ｶﾅ)',
        'tenantCode': 'テナントコード',
        'tenantName': 'テナント名称',
        'departmentCode': '所属コード',
        'departmentName': '所属名称',
        'kubunCode': '区分コード',
        'kubunName': '区分名称',
        'validFrom': '利用開始日',
        'validTo': '利用終了日',
        'alternativeCode': '代替コード',
        'bioCode': 'バイオコード',
        'readProhibition': '読取禁止',
        'antipass': 'アンチパス',
        'securityOperation': '警備セット時操作',
        'monitorCard': '監視カード',
        'registrationDate': '登録日',
        'updateDate': '更新日'
    };
    return names[columnKey] || columnKey;
}

// Operation status message functions
function showOperationStatus(message, type = 'success', autoHide = true) {
    const statusArea = document.getElementById('operationStatusArea');
    if (!statusArea) return;

    // Create status message element
    const statusMessage = document.createElement('div');
    statusMessage.className = `operation-status-message ${type}`;

    const iconMap = {
        'success': 'fas fa-check-circle',
        'info': 'fas fa-info-circle',
        'warning': 'fas fa-exclamation-triangle'
    };

    const currentTime = new Date().toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    statusMessage.innerHTML = `
        <div class="status-message-content">
            <i class="${iconMap[type]}"></i>
            <div class="status-message-text">${common.escapeHtml(message)}</div>
            <div class="status-message-time">${currentTime}</div>
        </div>
        <button class="status-message-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    statusMessage.querySelector('.status-message-close').addEventListener('click', function () {
        removeOperationStatus(statusMessage);
    });

    // Show status area and add message
    statusArea.style.display = 'block';
    statusArea.appendChild(statusMessage);

    // Auto hide after 5 seconds if specified
    if (autoHide) {
        setTimeout(() => {
            removeOperationStatus(statusMessage);
        }, 5000);
    }

    // Scroll to show the message
    statusMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function removeOperationStatus(messageElement) {
    const statusArea = document.getElementById('operationStatusArea');

    if (messageElement && messageElement.parentNode) {
        messageElement.style.animation = 'slideOutUp 0.3s ease-out';
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);

                // Hide status area if no messages left
                if (statusArea && statusArea.children.length === 0) {
                    statusArea.style.display = 'none';
                }
            }
        }, 300);
    }
}

// Action button functions
function bulkDelete() {
    const selectedPeople = personalData.filter(p => p.selected);
    if (selectedPeople.length === 0) {
        alert('削除する個人を選択してください');
        return;
    }
    if (confirm(`選択された${selectedPeople.length}件のデータを削除しますか？`)) {
        showOperationStatus(`${selectedPeople.length}件のデータを削除しています...`, 'info');

        setTimeout(() => {
            personalData = personalData.filter(p => !p.selected);
            applyFiltersAndDisplay();
            showOperationStatus(`${selectedPeople.length}件のデータ削除が完了しました。`, 'success');
        }, 800);
    }
}

function bulkErase() {
    const selectedPeople = personalData.filter(p => p.selected);
    if (selectedPeople.length === 0) {
        alert('消去する個人を選択してください');
        return;
    }
    if (confirm(`選択された${selectedPeople.length}件のデータを完全に消去しますか？\n\n※この操作は元に戻せません`)) {
        showOperationStatus(`${selectedPeople.length}件のデータを消去しています...`, 'warning');

        setTimeout(() => {
            // 消去は削除より強力な処理として、選択解除も行う
            personalData = personalData.filter(p => !p.selected);
            applyFiltersAndDisplay();
            showOperationStatus(`${selectedPeople.length}件のデータ消去が完了しました。`, 'success');
        }, 1000);
    }
}

function uploadData() {
    alert('データアップロード機能');
}

function downloadData() {
    alert('データダウンロード機能');
}

function toggleManageMenu() {
    document.getElementById('manageMenu').classList.toggle('show');
}

function revokePermission() {
    alert('権限失効を実行します');
}

// New functions for No.1
function sendPersonalData() {
    const selectedPeople = personalData.filter(p => p.selected);
    if (selectedPeople.length === 0) {
        alert('送信する個人を選択してください');
        return;
    }
    if (confirm(`選択された${selectedPeople.length}件のデータを送信しますか？`)) {
        showOperationStatus(`${selectedPeople.length}件のデータを送信しています...`, 'info');

        setTimeout(() => {
            // Mark as sent
            selectedPeople.forEach(person => {
                person.sendStatus = '済';
            });
            applyFiltersAndDisplay();
            showOperationStatus(`${selectedPeople.length}件のデータ送信が完了しました。`, 'success');
        }, 1200);
    }
}

function sendUnsentData() {
    const unsentCount = personalData.filter(person => person.sendStatus === '未').length;
    if (unsentCount > 0) {
        if (confirm(`未送信データ ${unsentCount}件 を送信しますか？`)) {
            showOperationStatus(`未送信データ ${unsentCount}件 を送信しています...`, 'info');
            
            setTimeout(() => {
                // 未送信データを送信済みに変更
                personalData.forEach(person => {
                    if (person.sendStatus === '未') {
                        person.sendStatus = '済';
                    }
                });
                
                // テーブルを再描画
                applyFiltersAndDisplay();
                
                showOperationStatus(`未送信データ ${unsentCount}件 の送信が完了しました。`, 'success');
            }, 1200);
        }
    } else {
        alert('未送信データはありません');
    }
}


// Resize functionality for Excel filter
let isResizing = false;
let currentResizeTarget = null;
let startY = 0;
let startHeight = 0;

function startResize(event, columnKey) {
    event.preventDefault();
    event.stopPropagation();

    isResizing = true;
    currentResizeTarget = document.getElementById(`excel-options-${columnKey}`);
    startY = event.clientY;
    startHeight = currentResizeTarget.offsetHeight;

    // Add global event listeners
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);

    // Change cursor for the entire document
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
}

function handleResize(event) {
    if (!isResizing || !currentResizeTarget) return;

    event.preventDefault();

    const deltaY = event.clientY - startY;
    const newHeight = startHeight + deltaY;

    // Set minimum and maximum heights
    const minHeight = 120;
    const maxHeight = 400;

    if (newHeight >= minHeight && newHeight <= maxHeight) {
        currentResizeTarget.style.height = newHeight + 'px';
    }
}

function stopResize(event) {
    if (!isResizing) return;

    isResizing = false;
    currentResizeTarget = null;

    // Remove global event listeners
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);

    // Reset cursor
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
}

// Update current count display
function updateCurrentCountDisplay() {
    const countElement = document.getElementById('currentCountValue');
    if (countElement) {
        countElement.textContent = filteredData.length.toLocaleString();
    }
}

// 履歴表示設定モーダル（右クリックで直接表示）
function showHistorySettingsModal(person) {
    const existingModal = document.getElementById('historySettingsModal');
    if (existingModal) existingModal.remove();

    const safeName = common.escapeHtml(person.name);
    const safeCode = common.escapeHtml(person.personalCode);

    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'historySettingsModal';
    modal.tabIndex = -1;
    modal.setAttribute('aria-hidden', 'true');

    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header py-2">
                    <h6 class="modal-title mb-0">
                        <i class="fas fa-history text-info me-2"></i>履歴表示設定 - ${safeName}(${safeCode})
                    </h6>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-info py-2 mb-3" style="font-size: 0.9em;">
                        ${safeName}(${safeCode})の報告書を抽出します。
                    </div>
                    <div class="row g-3">
                        <div class="col-6">
                            <div class="fw-bold small border-bottom pb-1 mb-2"><i class="fas fa-calendar-alt me-1"></i>期間</div>
                            <div class="form-check small">
                                <input class="form-check-input" type="radio" name="histPeriod" id="p1" value="1day" checked>
                                <label class="form-check-label" for="p1">当日</label>
                            </div>
                            <div class="form-check small">
                                <input class="form-check-input" type="radio" name="histPeriod" id="p2" value="2day">
                                <label class="form-check-label" for="p2">前日～</label>
                            </div>
                            <div class="form-check small">
                                <input class="form-check-input" type="radio" name="histPeriod" id="p3" value="1week">
                                <label class="form-check-label" for="p3">1週間前～</label>
                            </div>
                            <div class="form-check small">
                                <input class="form-check-input" type="radio" name="histPeriod" id="p4" value="1month">
                                <label class="form-check-label" for="p4">1ヵ月前～</label>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="fw-bold small border-bottom pb-1 mb-2"><i class="fas fa-filter me-1"></i>履歴種類</div>
                            <div class="form-check small">
                                <input class="form-check-input" type="radio" name="histDataType" id="t1" value="all" checked>
                                <label class="form-check-label" for="t1">全て</label>
                            </div>
                            <div class="form-check small">
                                <input class="form-check-input" type="radio" name="histDataType" id="t2" value="normal">
                                <label class="form-check-label" for="t2">正常データのみ</label>
                            </div>
                            <div class="form-check small">
                                <input class="form-check-input" type="radio" name="histDataType" id="t3" value="warning">
                                <label class="form-check-label" for="t3">軽エラーデータのみ</label>
                            </div>
                            <div class="form-check small">
                                <input class="form-check-input" type="radio" name="histDataType" id="t4" value="error">
                                <label class="form-check-label" for="t4">重エラーデータのみ</label>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer py-2">
                    <button type="button" class="btn btn-outline-dark btn-sm" data-bs-dismiss="modal">キャンセル</button>
                    <button type="button" class="btn btn-primary btn-sm" id="navigateReportBtn">
                        <i class="fas fa-arrow-right me-1"></i>報告書画面へ遷移
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector('#navigateReportBtn').addEventListener('click', function () {
        executeHistoryView(person.personalCode, modal);
    });
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
    modal.addEventListener('hidden.bs.modal', function () { modal.remove(); });
}

// 報告書画面へ遷移
function executeHistoryView(personalCode, modal) {
    var periodRadio = modal.querySelector('input[name="histPeriod"]:checked');
    var period = periodRadio ? periodRadio.value : '1day';
    var dataTypeRadio = modal.querySelector('input[name="histDataType"]:checked');
    var dataType = dataTypeRadio ? dataTypeRadio.value : 'all';

    var params = new URLSearchParams();
    params.set('personalCode', personalCode);
    params.set('period', period);
    params.set('dataType', dataType);

    var basePath = window.location.pathname.includes('-preview.html')
        ? '/resources/historyReport-preview.html'
        : '/historyReport';
    window.open(basePath + '?' + params.toString(), '_blank');

    var bootstrapModal = bootstrap.Modal.getInstance(modal);
    if (bootstrapModal) bootstrapModal.hide();
}

// 編集画面を開く
function openEditPage(personId, personName) {
    window.location.href = `/personalRegistration?id=${personId}&name=${encodeURIComponent(personName)}`;
}


