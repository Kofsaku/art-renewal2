// History Report JavaScript - Based on Personal List Implementation

// History data for demonstration
let historyData = [];
let filteredData = [];
let currentPage = 1;
let itemsPerPage = 25;
let currentFilters = {};
let columnOrder = ['occurredDate', 'personalCode', 'issueCount', 'managementNumber', 'name', 'departmentCode', 'departmentName', 'categoryCode', 'categoryName', 'alternativeCode', 'gateNumber', 'gateName', 'historyDetails'];
let hiddenColumns = ['issueCount', 'managementNumber', 'departmentCode', 'categoryCode', 'categoryName', 'alternativeCode'];
let sortState = { column: null, direction: 'asc' };

// Period selection state
let periodFilters = {
    periodType: 'all',
    startDate: null,
    endDate: null
};

// Setup global functions immediately
function setupGlobalFunctions() {
    window.applyPeriodSelection = applyPeriodSelection;
    window.showPeriodSelection = showPeriodSelection;
    window.showColumnManager = showColumnManager;
    window.showAllColumns = showAllColumns;
    window.resetToDefault = resetToDefault;
    window.resetAllFilters = resetAllFilters;
    window.changePage = changePage;
    window.toggleColumnVisibilityDirect = toggleColumnVisibilityDirect;
    window.toggleColumnFromManager = toggleColumnFromManager;
    window.handleSort = handleSort;
    window.handleDragStart = handleDragStart;
    window.handleDragOver = handleDragOver;
    window.handleDrop = handleDrop;
    window.handleDragEnd = handleDragEnd;
    window.startResize = startResize;
    window.showExcelFilter = showExcelFilter;
    window.hideAllExcelFilters = hideAllExcelFilters;
    window.toggleExcelSelectAll = toggleExcelSelectAll;
    window.toggleExcelOption = toggleExcelOption;
    window.selectAllExcelFilter = selectAllExcelFilter;
    window.clearAllExcelFilter = clearAllExcelFilter;
    window.filterExcelOptions = filterExcelOptions;
    window.applyExcelFilter = applyExcelFilter;
}

// Initialize immediately when script loads
setupGlobalFunctions();

// Initialize the page
document.addEventListener('DOMContentLoaded', function () {

    // Add visual confirmation
    const debugDiv = document.createElement('div');
    debugDiv.innerHTML = '🟢 履歴レポートJavaScript読み込み中...';
    debugDiv.style.cssText = 'position: fixed; top: 100px; right: 20px; background: #d4edda; padding: 10px; border-radius: 5px; z-index: 9999;';
    document.body.appendChild(debugDiv);

    setTimeout(() => {

        setupEventListeners();

        updateTableHeaders();

        // Show initial state (no data selected)
        showNoDataMessage();
        

        debugDiv.innerHTML = '✅ 履歴レポート初期化完了！';

        setTimeout(() => {
            if (debugDiv.parentNode) {
                document.body.removeChild(debugDiv);
            }
        }, 3000);
    }, 100);
});

// Show no data message
function showNoDataMessage() {
    const container = document.getElementById('dataTableContainer');
    const pagination = document.getElementById('paginationContainer');
    const noData = document.getElementById('noDataMessage');
    
    if (container) container.style.display = 'none';
    if (pagination) pagination.style.display = 'none';
    if (noData) noData.style.display = 'block';
    
    updateRecordCount(0);
}

// Generate sample history data
function generateHistoryData() {
    const statuses = [
        { id: 'normal', color: '#ffffff', textColor: '#000000', label: '正常', details: ['入室', '退室'] },
        { id: 'warning', color: '#fff3cd', textColor: '#856404', label: '軽エラー', details: ['バッテリー低下', 'カード読取警告'] },
        { id: 'error', color: '#f8d7da', textColor: '#721c24', label: '重エラー', details: ['通信異常', '不正入室'] },
        { id: 'recovery', color: '#d1ecf1', textColor: '#0c5460', label: '重エラー復旧', details: ['システム復旧', '通信復旧'] }
    ];

    const departments = ['総務部', '営業部', 'システム部', '経理部', '人事部', '開発部', '企画部'];
    const categories = ['正社員', '契約社員', '派遣社員', 'アルバイト', '役員'];
    const names = ['ユーザーA', 'ユーザーB', 'ユーザーC', 'ユーザーD', 'ユーザーE', '田中太郎', '佐藤花子', '鈴木次郎'];

    historyData = [];
    const now = new Date();
    
    // Filter by period if set
    let startDate = periodFilters.startDate || new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    let endDate = periodFilters.endDate || now;

    // Generate 1000 records within the selected period
    for (let i = 0; i < 1000; i++) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const department = departments[Math.floor(Math.random() * departments.length)];
        const category = categories[Math.floor(Math.random() * categories.length)];
        const name = names[Math.floor(Math.random() * names.length)];
        
        // Random date within the period
        const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
        const date = new Date(randomTime);

        historyData.push({
            occurredDate: formatDateTime(date),
            personalCode: `${String(1000 + i).padStart(6, '0')}`,
            issueCount: String(Math.floor(Math.random() * 2) + 1),
            managementNumber: `M${String(i).padStart(5, '0')}`,
            name: name,
            departmentCode: `${String(Math.floor(Math.random() * 10) + 1).padStart(3, '0')}`,
            departmentName: department,
            categoryCode: `${String(Math.floor(Math.random() * 5) + 1).padStart(2, '0')}`,
            categoryName: category,
            alternativeCode: `A${String(i).padStart(4, '0')}`,
            gateNumber: `${String(Math.floor(Math.random() * 10) + 1).padStart(4, '0')}`,
            gateName: `ゲート${Math.floor(Math.random() * 10) + 1}`,
            historyDetails: status.details[Math.floor(Math.random() * status.details.length)],
            statusId: status.id,
            statusColor: status.color,
            statusTextColor: status.textColor,
            selected: false
        });
    }
    
    filteredData = [...historyData];
}

// Format date time
function formatDateTime(date) {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const hh = date.getHours().toString().padStart(2, '0');
    const mm = date.getMinutes().toString().padStart(2, '0');
    const ss = date.getSeconds().toString().padStart(2, '0');
    return `${y}/${m}/${d} ${hh}:${mm}:${ss}`;
}

// Setup event listeners
function setupEventListeners() {
    // Data display filter
    const dataDisplayFilter = document.getElementById('dataDisplayFilter');
    if (dataDisplayFilter) {
        dataDisplayFilter.addEventListener('change', (e) => {
            currentFilters.dataDisplay = e.target.value;
            applyFiltersAndDisplay();
        });
    }

    // Items per page selector
    const itemsPerPageSelect = document.getElementById('itemsPerPageSelect');
    if (itemsPerPageSelect) {
        itemsPerPageSelect.addEventListener('change', (e) => {
            itemsPerPage = parseInt(e.target.value, 10);
            currentPage = 1;
            updatePagination();
            displayCurrentPage();
        });
    }

    // Click outside to close Excel filters
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.excel-filter-trigger') && 
            !e.target.closest('.excel-filter-menu') &&
            !e.target.closest('.excel-search-box')) {
            hideAllExcelFilters();
        }
    });

    // Period selection modal events
    const periodOptions = document.querySelectorAll('input[name="periodOption"]');
    const customInputs = document.getElementById('customPeriodInputs');
    
    periodOptions.forEach(option => {
        option.addEventListener('change', function() {
            if (this.value === 'custom') {
                customInputs.style.display = 'block';
            } else {
                customInputs.style.display = 'none';
            }
        });
    });
}

// Update table headers - based on personal list
function updateTableHeaders() {
    const thead = document.querySelector('#historyTable thead tr');
    if (!thead) return;
    
    const columnDefinitions = {
        'occurredDate': { title: '発生日時', draggable: true },
        'personalCode': { title: '個人コード', draggable: true },
        'issueCount': { title: '発行回数', draggable: true },
        'managementNumber': { title: '管理番号', draggable: true },
        'name': { title: '氏名', draggable: true },
        'departmentCode': { title: '所属コード', draggable: true },
        'departmentName': { title: '所属', draggable: true },
        'categoryCode': { title: '区分コード', draggable: true },
        'categoryName': { title: '区分名称', draggable: true },
        'alternativeCode': { title: '代替コード', draggable: true },
        'gateNumber': { title: 'ゲート番号', draggable: true },
        'gateName': { title: 'ゲート名称', draggable: true },
        'historyDetails': { title: '履歴詳細', draggable: true }
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
            
            // ソート機能を追加
            th.classList.add('sortable');
            th.addEventListener('click', (e) => {
                // リサイザーとフィルター以外をクリック時のみソート
                if (!e.target.closest('.column-visibility-toggle') && 
                    !e.target.closest('.excel-filter-trigger') &&
                    !e.target.closest('.column-resizer')) {
                    handleSort(columnKey);
                }
            });
            
            // ソート状態の表示（無効化）
            // if (sortState.column === columnKey) {
            //     th.classList.add(sortState.direction === 'asc' ? 'sort-asc' : 'sort-desc');
            // }

            th.innerHTML = `
                <span class="column-visibility-toggle" onclick="toggleColumnVisibilityDirect('${columnKey}', event)" title="列表示切替">×</span>
                <span class="column-content">${def.title}</span>
                <div class="excel-filter-trigger" onclick="showExcelFilter(event, '${columnKey}')"></div>
                <div class="excel-filter-menu" id="excel-filter-${columnKey}"></div>
                <div class="column-resizer" data-column="${columnKey}" title="列幅変更"></div>
            `;
        } else {
            th.innerHTML = def.title;
        }

        thead.appendChild(th);
    });

    // 列幅変更イベントリスナーのセットアップ
    setupColumnResizers();
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
        
        if (sortState.direction === 'asc') {
            return aValue < bValue ? -1 : (aValue > bValue ? 1 : 0);
        } else {
            return aValue > bValue ? -1 : (aValue < bValue ? 1 : 0);
        }
    });
    
    // テーブルヘッダーとデータを更新
    updateTableHeaders();
    displayCurrentPage();
}

// Column visibility toggle
function toggleColumnVisibilityDirect(columnKey, event) {
    event.stopPropagation();
    
    // 少なくとも1つの列は表示する必要がある
    const visibleColumns = columnOrder.filter(col => !hiddenColumns.includes(col));
    if (visibleColumns.length <= 1 && visibleColumns.includes(columnKey)) {
        alert('少なくとも1つの列を表示する必要があります。');
        return;
    }
    
    if (hiddenColumns.includes(columnKey)) {
        // 表示する
        hiddenColumns = hiddenColumns.filter(col => col !== columnKey);
    } else {
        // 非表示にする
        hiddenColumns.push(columnKey);
    }
    
    updateTableHeaders();
    displayCurrentPage();
    updateColumnManager();
}

// Drag and drop functions
let draggedColumn = null;
let draggedColumnIndex = null;

function handleDragStart(e) {
    draggedColumn = e.target;
    draggedColumnIndex = Array.from(draggedColumn.parentNode.children).indexOf(draggedColumn);
    draggedColumn.classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    const targetTh = e.target.closest('th');
    if (targetTh && targetTh !== draggedColumn) {
        targetTh.classList.add('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    const targetTh = e.target.closest('th');
    
    if (targetTh && targetTh !== draggedColumn) {
        const targetColumn = targetTh.getAttribute('data-column');
        const draggedColumnKey = draggedColumn.getAttribute('data-column');
        
        // 配列内での位置を変更
        const draggedIndex = columnOrder.indexOf(draggedColumnKey);
        const targetIndex = columnOrder.indexOf(targetColumn);
        
        if (draggedIndex !== -1 && targetIndex !== -1) {
            columnOrder.splice(draggedIndex, 1);
            columnOrder.splice(targetIndex, 0, draggedColumnKey);
            
            // テーブルを再構築
            updateTableHeaders();
            displayCurrentPage();
        }
    }
    
    cleanupDragState();
}

function handleDragEnd(e) {
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

// Column resizing
function setupColumnResizers() {
    const resizers = document.querySelectorAll('.column-resizer');
    resizers.forEach(resizer => {
        resizer.addEventListener('mousedown', startResize);
    });
}

function startResize(e) {
    e.preventDefault();
    const resizer = e.target;
    const column = resizer.getAttribute('data-column');
    const th = resizer.closest('th');
    const startX = e.pageX;
    const startWidth = th.offsetWidth;

    function handleMouseMove(e) {
        const width = startWidth + e.pageX - startX;
        if (width > 60) { // Minimum width
            th.style.width = width + 'px';
            th.style.minWidth = width + 'px';
        }
    }

    function handleMouseUp() {
        resizer.classList.remove('resizing');
        th.classList.remove('resizing');
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }

    resizer.classList.add('resizing');
    th.classList.add('resizing');
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
}

// Data filtering and display
function applyFiltersAndDisplay() {
    if (!historyData || historyData.length === 0) {
        filteredData = [];
        updateRecordCount(0);
        displayCurrentPage();
        return;
    }

    let data = [...historyData];
    
    // Apply data type filter
    const dataFilter = currentFilters.dataDisplay;
    if (dataFilter && dataFilter !== 'all') {
        data = data.filter(item => item.statusId === dataFilter);
    }
    
    // Apply Excel filters
    Object.keys(currentFilters).forEach(columnKey => {
        if (columnKey === 'dataDisplay') return;
        const filterValues = currentFilters[columnKey];
        if (filterValues && filterValues.length > 0) {
            data = data.filter(item => filterValues.includes(item[columnKey]));
        }
    });
    
    filteredData = data;
    currentPage = 1; // Reset to first page
    updateRecordCount(filteredData.length);
    updatePagination();
    displayCurrentPage();
}

function displayCurrentPage() {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!filteredData || filteredData.length === 0) {
        updateRecordCount(0);
        return;
    }
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredData.slice(start, end);
    
    pageData.forEach(row => {
        const tr = document.createElement('tr');
        tr.classList.add(`row-${row.statusId}`);
        
        columnOrder.forEach(columnKey => {
            if (hiddenColumns.includes(columnKey)) return;
            
            const td = document.createElement('td');
            td.textContent = row[columnKey] || '';
            tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
    });
    
    updateRecordCount(filteredData.length);
}

function updateRecordCount(count) {
    const recordCountTop = document.getElementById('recordCountTop');
    if (recordCountTop) {
        recordCountTop.textContent = count;
    }
}

function updatePagination() {
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) {
        const start = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
        const end = Math.min(currentPage * itemsPerPage, totalItems);
        pageInfo.textContent = `${start}-${end} / ${totalItems}件中`;
    }
    
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    pagination.innerHTML = '';
    
    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="javascript:void(0)" onclick="changePage(${i})">${i}</a>`;
        pagination.appendChild(li);
    }
}

function changePage(page) {
    currentPage = page;
    displayCurrentPage();
    updatePagination();
}

// Period selection functionality
function showPeriodSelection() {
    const modalElement = document.getElementById('periodSelectionModal');
    if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }
}

function applyPeriodSelection() {
    const selectedOption = document.querySelector('input[name="periodOption"]:checked');
    if (!selectedOption) {
        console.warn('No period option selected');
        return;
    }

    periodFilters.periodType = selectedOption.value;
    
    // Calculate date range based on selection
    const now = new Date();
    let startDate, endDate = new Date(now);
    
    if (selectedOption.value === 'custom') {
        const startInput = document.getElementById('startDateModal');
        const endInput = document.getElementById('endDateModal');
        if (startInput && endInput && startInput.value && endInput.value) {
            startDate = new Date(startInput.value);
            endDate = new Date(endInput.value);
        } else {
            alert('期間指定の場合は開始日時と終了日時を入力してください。');
            return;
        }
    } else {
        switch (selectedOption.value) {
            case 'all':
                startDate = new Date('2020-01-01');
                break;
            case '1year':
                startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                break;
            case '1month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                break;
            case '1week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '1day':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        }
    }
    
    periodFilters.startDate = startDate;
    periodFilters.endDate = endDate;
    
    // Update period display
    updateExtractionPeriodDisplay(startDate, endDate);
    
    // Generate data for the selected period
    generateHistoryData();
    
    // Show the table
    const container = document.getElementById('dataTableContainer');
    const pagination = document.getElementById('paginationContainer');
    const noData = document.getElementById('noDataMessage');
    
    if (container) container.style.display = 'block';
    if (pagination) pagination.style.display = 'flex';
    if (noData) noData.style.display = 'none';

    // Close modal
    const modalElement = document.getElementById('periodSelectionModal');
    if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.hide();
    }

    // Apply filters and display
    applyFiltersAndDisplay();
}

function updateExtractionPeriodDisplay(startDate, endDate) {
    const display = document.getElementById('extractionPeriodDisplay');
    if (!display) return;
    
    const startStr = formatDateTime(startDate);
    const endStr = formatDateTime(endDate);
    display.textContent = `${startStr} ～ ${endStr}`;
}

// Column manager functions
function showColumnManager() {
    updateColumnManager();
    const modalElement = document.getElementById('columnManagerModal');
    if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.show();
    }
}

function updateColumnManager() {
    const visibleList = document.getElementById('visibleColumnsList');
    const hiddenList = document.getElementById('hiddenColumnsList');
    const noHiddenMsg = document.getElementById('noHiddenColumns');
    
    if (!visibleList || !hiddenList) return;

    visibleList.innerHTML = '';
    hiddenList.innerHTML = '';

    let hiddenCount = 0;
    
    columnOrder.forEach(key => {
        const columnDefinitions = {
            'occurredDate': { title: '発生日時', draggable: true },
            'personalCode': { title: '個人コード', draggable: true },
            'issueCount': { title: '発行回数', draggable: true },
            'managementNumber': { title: '管理番号', draggable: true },
            'name': { title: '氏名', draggable: true },
            'departmentCode': { title: '所属コード', draggable: true },
            'departmentName': { title: '所属', draggable: true },
            'categoryCode': { title: '区分コード', draggable: true },
            'categoryName': { title: '区分名称', draggable: true },
            'alternativeCode': { title: '代替コード', draggable: true },
            'gateNumber': { title: 'ゲート番号', draggable: true },
            'gateName': { title: 'ゲート名称', draggable: true },
            'historyDetails': { title: '履歴詳細', draggable: true }
        };
        
        const def = columnDefinitions[key];
        if (!def) return;
        
        const isVisible = !hiddenColumns.includes(key);
        
        const itemHTML = `
            <div class="column-item-manager ${!isVisible ? 'hidden' : ''}" data-column="${key}">
                <span class="column-name">${def.title}</span>
                <button class="column-toggle-btn" onclick="toggleColumnFromManager('${key}')" title="${isVisible ? '非表示にする' : '表示する'}">
                    <i class="fas fa-${isVisible ? 'eye-slash' : 'eye'}"></i>
                </button>
            </div>
        `;
        
        if (isVisible) {
            visibleList.insertAdjacentHTML('beforeend', itemHTML);
        } else {
            hiddenList.insertAdjacentHTML('beforeend', itemHTML);
            hiddenCount++;
        }
    });

    if (noHiddenMsg) {
        noHiddenMsg.style.display = hiddenCount === 0 ? 'block' : 'none';
    }
    
    // Update hidden columns badge
    const badge = document.getElementById('hiddenColumnsBadge');
    if (badge) {
        if (hiddenCount > 0) {
            badge.textContent = hiddenCount;
            badge.style.display = 'inline';
        } else {
            badge.style.display = 'none';
        }
    }
}

function toggleColumnFromManager(columnKey) {
    toggleColumnVisibilityDirect(columnKey, { stopPropagation: () => {} });
}

function showAllColumns() {
    hiddenColumns = [];
    updateTableHeaders();
    displayCurrentPage();
    updateColumnManager();
}

function resetToDefault() {
    hiddenColumns = ['issueCount', 'managementNumber', 'departmentCode', 'categoryCode', 'categoryName', 'alternativeCode'];
    updateTableHeaders();
    displayCurrentPage();
    updateColumnManager();
}

// Excel filter functionality
function showExcelFilter(event, columnKey) {
    event.stopPropagation();
    hideAllExcelFilters();

    const filterMenu = document.getElementById(`excel-filter-${columnKey}`);
    if (!filterMenu) return;

    // Get unique values for this column
    const uniqueValues = [...new Set(historyData.map(item => item[columnKey]))]
        .filter(val => val && val.toString().trim() !== '')
        .sort();

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
            <button class="excel-action-btn" onclick="selectAllExcelFilter('${columnKey}')">すべて選択</button>
            <button class="excel-action-btn" onclick="clearAllExcelFilter('${columnKey}')">すべてクリア</button>
            <button class="excel-action-btn primary" onclick="applyExcelFilter('${columnKey}')">OK</button>
        </div>
        
        <div class="excel-filter-list" id="excel-options-${columnKey}">
            <div class="excel-filter-item select-all" onclick="toggleExcelSelectAll('${columnKey}'); event.stopPropagation();">
                <input type="checkbox" id="select-all-${columnKey}" ${!isFiltered ? 'checked' : ''} onclick="event.stopPropagation();">
                <span>（すべて選択）</span>
            </div>
            ${uniqueValues.map(value => {
                const isChecked = currentFilterValues.length === 0 || currentFilterValues.includes(value);
                return `
                    <div class="excel-filter-item" onclick="toggleExcelOption('${columnKey}', '${value}'); event.stopPropagation();">
                        <input type="checkbox" ${isChecked ? 'checked' : ''} onclick="event.stopPropagation();">
                        <span>${value}</span>
                    </div>
                `;
            }).join('')}
        </div>
        
        <div class="excel-filter-stats">
            ${uniqueValues.length}件中 ${currentFilterValues.length || uniqueValues.length}件を表示
        </div>
    `;

    filterMenu.classList.add('show');
}

function getColumnDisplayName(columnKey) {
    const columnDefinitions = {
        'occurredDate': { title: '発生日時' },
        'personalCode': { title: '個人コード' },
        'issueCount': { title: '発行回数' },
        'managementNumber': { title: '管理番号' },
        'name': { title: '氏名' },
        'departmentCode': { title: '所属コード' },
        'departmentName': { title: '所属' },
        'categoryCode': { title: '区分コード' },
        'categoryName': { title: '区分名称' },
        'alternativeCode': { title: '代替コード' },
        'gateNumber': { title: 'ゲート番号' },
        'gateName': { title: 'ゲート名称' },
        'historyDetails': { title: '履歴詳細' }
    };
    return columnDefinitions[columnKey]?.title || columnKey;
}

function hideAllExcelFilters() {
    document.querySelectorAll('.excel-filter-menu').forEach(menu => {
        menu.classList.remove('show');
    });
}

function toggleExcelSelectAll(columnKey) {
    const selectAllCheckbox = document.getElementById(`select-all-${columnKey}`);
    const allCheckboxes = document.querySelectorAll(`#excel-options-${columnKey} .excel-filter-item:not(.select-all) input[type="checkbox"]`);
    
    selectAllCheckbox.checked = !selectAllCheckbox.checked;
    
    allCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
    
    updateExcelFilterStats(columnKey);
}

function toggleExcelOption(columnKey, value) {
    const item = event.currentTarget;
    const checkbox = item.querySelector('input[type="checkbox"]');
    checkbox.checked = !checkbox.checked;
    
    updateExcelSelectAllState(columnKey);
    updateExcelFilterStats(columnKey);
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

function selectAllExcelFilter(columnKey) {
    const allCheckboxes = document.querySelectorAll(`#excel-options-${columnKey} .excel-filter-item input[type="checkbox"]`);
    allCheckboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
    updateExcelFilterStats(columnKey);
}

function clearAllExcelFilter(columnKey) {
    const allCheckboxes = document.querySelectorAll(`#excel-options-${columnKey} .excel-filter-item input[type="checkbox"]`);
    allCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    updateExcelFilterStats(columnKey);
}

function filterExcelOptions(columnKey, searchText) {
    const items = document.querySelectorAll(`#excel-options-${columnKey} .excel-filter-item:not(.select-all)`);
    items.forEach(item => {
        const text = item.querySelector('span').textContent.toLowerCase();
        if (text.includes(searchText.toLowerCase())) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function updateExcelFilterStats(columnKey) {
    const statsElement = document.querySelector(`#excel-filter-${columnKey} .excel-filter-stats`);
    if (!statsElement) return;
    
    const uniqueValues = [...new Set(historyData.map(item => item[columnKey]))];
    const checkedBoxes = document.querySelectorAll(`#excel-options-${columnKey} .excel-filter-item:not(.select-all) input[type="checkbox"]:checked`);
    const displayCount = checkedBoxes.length;
    
    statsElement.textContent = `${uniqueValues.length}件中 ${displayCount}件を表示`;
}

function applyExcelFilter(columnKey) {
    const checkedBoxes = document.querySelectorAll(`#excel-options-${columnKey} .excel-filter-item:not(.select-all) input[type="checkbox"]:checked`);
    const selectedValues = Array.from(checkedBoxes).map(cb => cb.nextElementSibling.textContent);
    
    const allUniqueValues = [...new Set(historyData.map(item => item[columnKey]))];
    if (selectedValues.length === 0 || selectedValues.length === allUniqueValues.length) {
        delete currentFilters[columnKey];
    } else {
        currentFilters[columnKey] = selectedValues;
    }
    
    applyFiltersAndDisplay();
    hideAllExcelFilters();
}

// Reset filters
function resetAllFilters() {
    currentFilters = {};
    const dataDisplayFilter = document.getElementById('dataDisplayFilter');
    if (dataDisplayFilter) {
        dataDisplayFilter.value = 'all';
    }
    applyFiltersAndDisplay();
}

