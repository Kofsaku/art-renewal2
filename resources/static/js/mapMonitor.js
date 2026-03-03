/**
 * マップモニター JavaScript
 * ゲート状態をマップ上で視覚的に表示・管理
 */

// グローバル変数
let mapMonitor = {
    gateData: [
        { id: 1, code: '0001', name: 'ゲートA', status: 'normal', position: { x: 110, y: 60 }, lastUpdate: new Date() },
        { id: 2, code: '0002', name: 'ゲートB', status: 'warning', position: { x: 210, y: 60 }, lastUpdate: new Date() },
        { id: 3, code: '0003', name: 'ゲートC', status: 'normal', position: { x: 310, y: 60 }, lastUpdate: new Date() },
        { id: 4, code: '0004', name: 'ゲートD', status: 'error', position: { x: 210, y: 110 }, lastUpdate: new Date() },
        { id: 5, code: '0005', name: 'ゲートE', status: 'normal', position: { x: 330, y: 110 }, lastUpdate: new Date() },
        { id: 6, code: '0006', name: 'ゲートF', status: 'offline', position: { x: 110, y: 170 }, lastUpdate: new Date() },
        { id: 7, code: '0007', name: 'ゲートG', status: 'normal', position: { x: 110, y: 270 }, lastUpdate: new Date() },
        { id: 8, code: '0008', name: 'ゲートH', status: 'warning', position: { x: 110, y: 240 }, lastUpdate: new Date() }
    ],

    zoomLevel: 1,
    maxZoom: 3,
    minZoom: 0.5,
    updateInterval: 5000,
    currentFloor: 1,
    statusFilters: ['normal', 'warning', 'error', 'offline']
};

/**
 * 初期化
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeMapMonitor();
    setupEventListeners();
    startAutoUpdate();
});

/**
 * マップモニター初期化
 */
function initializeMapMonitor() {
    renderGateIndicators();
}

/**
 * イベントリスナー設定
 */
function setupEventListeners() {
    // フロア切り替え
    document.querySelectorAll('.mm-floor-btn').forEach(function(button) {
        button.addEventListener('click', function() {
            var floor = parseInt(this.dataset.floor, 10);
            switchFloor(floor);
        });
    });

    // ステータスフィルターチェックボックス
    document.querySelectorAll('.status-filter-checkbox').forEach(function(cb) {
        cb.addEventListener('change', function() {
            updateStatusFilters();
        });
    });

    // キーボードショートカット
    document.addEventListener('keydown', function(e) {
        if (['INPUT', 'TEXTAREA', 'SELECT'].indexOf(e.target.tagName) !== -1) return;
        switch(e.key) {
            case '+':
            case '=':
                zoomIn();
                e.preventDefault();
                break;
            case '-':
                zoomOut();
                e.preventDefault();
                break;
            case '0':
                resetZoom();
                e.preventDefault();
                break;
            case 'r':
            case 'R':
                refreshGateData();
                e.preventDefault();
                break;
        }
    });
}

/**
 * ゲートインジケーター描画
 */
function renderGateIndicators() {
    var floorPlan = document.getElementById('floorPlan');
    if (!floorPlan) return;

    // 既存のポインターをクリア
    var existing = floorPlan.querySelectorAll('.gate-pointer');
    existing.forEach(function(el) { el.remove(); });

    mapMonitor.gateData.forEach(function(gate) {
        // フィルター判定: 非選択ステータスは非表示
        if (mapMonitor.statusFilters.indexOf(gate.status) === -1) return;

        var pointer = document.createElement('div');
        pointer.className = 'gate-pointer';
        pointer.style.left = gate.position.x + 'px';
        pointer.style.top = gate.position.y + 'px';
        pointer.dataset.gate = gate.id;

        var circle = document.createElement('div');
        circle.className = 'pointer-circle status-' + gate.status;

        var validStatuses = ['normal', 'warning', 'error', 'offline'];
        var safeStatus = validStatuses.indexOf(gate.status) !== -1 ? gate.status : 'offline';

        var tooltip = document.createElement('div');
        tooltip.className = 'gate-tooltip status-' + safeStatus;

        var header = document.createElement('div');
        header.className = 'tooltip-header';
        var dot = document.createElement('div');
        dot.className = 'status-dot status-' + safeStatus;
        dot.style.background = getStatusColorHex(safeStatus);
        var label = document.createElement('span');
        label.textContent = gate.name + '(' + gate.code + ')';
        header.appendChild(dot);
        header.appendChild(label);

        var iconsGrid = document.createElement('div');
        iconsGrid.className = 'tooltip-icons-grid';
        ['door', 'lock', 'security', 'comm'].forEach(function(icon) {
            var item = document.createElement('div');
            item.className = 'tooltip-icon-item tooltip-icon-' + icon;
            iconsGrid.appendChild(item);
        });

        tooltip.appendChild(header);
        tooltip.appendChild(iconsGrid);

        pointer.appendChild(circle);
        pointer.appendChild(tooltip);

        pointer.addEventListener('click', function() {
            showGateControlModal(this);
        });

        floorPlan.appendChild(pointer);
    });
}

/**
 * 状態に対応するカラーコードを取得
 */
function getStatusColorHex(status) {
    var colorMap = {
        normal: '#28a745',
        warning: '#ffc107',
        error: '#dc3545',
        offline: '#6c757d'
    };
    return colorMap[status] || '#6c757d';
}

/**
 * ステータスフィルター更新
 */
function updateStatusFilters() {
    var filters = [];
    document.querySelectorAll('.status-filter-checkbox').forEach(function(cb) {
        if (cb.checked) {
            filters.push(cb.value);
        }
    });
    mapMonitor.statusFilters = filters;
    renderGateIndicators();
}

/**
 * ズームイン
 */
function zoomIn() {
    if (mapMonitor.zoomLevel < mapMonitor.maxZoom) {
        mapMonitor.zoomLevel += 0.2;
        applyZoom();
    }
}

/**
 * ズームアウト
 */
function zoomOut() {
    if (mapMonitor.zoomLevel > mapMonitor.minZoom) {
        mapMonitor.zoomLevel -= 0.2;
        applyZoom();
    }
}

/**
 * ズームリセット
 */
function resetZoom() {
    mapMonitor.zoomLevel = 1;
    applyZoom();
}

/**
 * ズーム適用
 */
function applyZoom() {
    var floorPlan = document.getElementById('floorPlan');
    var viewport = document.getElementById('mapViewport');
    if (!floorPlan || !viewport) return;

    floorPlan.style.transform = 'scale(' + mapMonitor.zoomLevel + ')';
    floorPlan.style.transformOrigin = '50% 50%';

    var baseHeight = 500;
    var scaledHeight = baseHeight * mapMonitor.zoomLevel;
    var marginY = Math.max(50, (viewport.clientHeight - scaledHeight) / 2);

    floorPlan.style.marginTop = marginY + 'px';
    floorPlan.style.marginBottom = marginY + 'px';
}

/**
 * フロア切り替え
 */
function switchFloor(floor) {
    mapMonitor.currentFloor = floor;

    // ボタンの表示更新
    document.querySelectorAll('.mm-floor-btn').forEach(function(btn) {
        btn.classList.toggle('active', parseInt(btn.dataset.floor, 10) === floor);
    });

    // ゲートの再配置（フロア2/3はランダム）
    if (floor === 1) {
        mapMonitor.gateData = [
            { id: 1, code: '0001', name: 'ゲートA', status: 'normal', position: { x: 110, y: 60 }, lastUpdate: new Date() },
            { id: 2, code: '0002', name: 'ゲートB', status: 'normal', position: { x: 210, y: 60 }, lastUpdate: new Date() },
            { id: 3, code: '0003', name: 'ゲートC', status: 'warning', position: { x: 310, y: 60 }, lastUpdate: new Date() },
            { id: 4, code: '0004', name: 'ゲートD', status: 'error', position: { x: 210, y: 110 }, lastUpdate: new Date() },
            { id: 5, code: '0005', name: 'ゲートE', status: 'error', position: { x: 330, y: 110 }, lastUpdate: new Date() },
            { id: 6, code: '0006', name: 'ゲートF', status: 'normal', position: { x: 110, y: 170 }, lastUpdate: new Date() },
            { id: 7, code: '0007', name: 'ゲートG', status: 'normal', position: { x: 110, y: 270 }, lastUpdate: new Date() },
            { id: 8, code: '0008', name: 'ゲートH', status: 'offline', position: { x: 110, y: 240 }, lastUpdate: new Date() }
        ];
    } else {
        mapMonitor.gateData.forEach(function(gate) {
            gate.position = {
                x: Math.floor(Math.random() * 600) + 100,
                y: Math.floor(Math.random() * 300) + 100
            };
        });
    }

    renderGateIndicators();
}

/**
 * ゲート制御モーダル表示
 */
function showGateControlModal(element) {
    var gateId = parseInt(element.getAttribute('data-gate'), 10);
    var gateData = mapMonitor.gateData.find(function(g) { return g.id === gateId; });
    var className = element.querySelector('.pointer-circle').className;
    var gateStatus = className.indexOf('status-normal') !== -1 ? '正常' :
                     className.indexOf('status-warning') !== -1 ? '警告' :
                     className.indexOf('status-error') !== -1 ? '異常' : 'オフライン';

    var displayName = gateData ? gateData.name + '(' + gateData.code + ')' : 'ゲート' + gateId;
    document.getElementById('modalGateNumber').textContent = displayName;
    document.getElementById('modalGateStatus').textContent = gateStatus;
    document.getElementById('modalLastUpdate').textContent = new Date().toLocaleString();

    // ラジオボタンをリセット
    document.querySelectorAll('input[name="singleRemoteOperation"]').forEach(function(radio) {
        radio.checked = false;
    });

    bootstrap.Modal.getOrCreateInstance(document.getElementById('gateDetailModal')).show();
}

/**
 * 単一ゲート遠隔操作実行
 */
function executeSingleRemoteCommand() {
    var selectedOperation = document.querySelector('input[name="singleRemoteOperation"]:checked');
    if (!selectedOperation) {
        alert('操作を選択してください。');
        return;
    }

    var gateNumber = document.getElementById('modalGateNumber').textContent;
    var operationName = selectedOperation.nextElementSibling.textContent;

    alert(gateNumber + 'に対して「' + operationName + '」を実行します。\n\n※実際のシステムでは、ここでサーバーへの通信処理が実行されます。');
    bootstrap.Modal.getInstance(document.getElementById('gateDetailModal')).hide();
}

/**
 * グループ制御モーダル表示
 */
function showGroupControlModal() {
    // チェックボックス・ラジオボタンをリセット
    document.querySelectorAll('#groupControlModal input[type="checkbox"]').forEach(function(cb) {
        cb.checked = false;
    });
    document.querySelectorAll('#groupControlModal input[type="radio"]').forEach(function(radio) {
        radio.checked = false;
    });
    bootstrap.Modal.getOrCreateInstance(document.getElementById('groupControlModal')).show();
}

/**
 * グループ制御実行
 */
function executeGroupControl() {
    var selectedGroups = [];
    document.querySelectorAll('.group-selection input[type="checkbox"]:checked').forEach(function(checkbox) {
        selectedGroups.push(checkbox.value);
    });

    var selectedOperation = document.querySelector('input[name="remoteOperation"]:checked');

    if (selectedGroups.length === 0) {
        alert('グループを選択してください。');
        return;
    }
    if (!selectedOperation) {
        alert('操作を選択してください。');
        return;
    }

    var operationName = selectedOperation.nextElementSibling.textContent;
    alert('グループ' + selectedGroups.join(', ') + 'に対して「' + operationName + '」を実行します。\n\n※実際のシステムでは、ここでサーバーへの通信処理が実行されます。');
    bootstrap.Modal.getInstance(document.getElementById('groupControlModal')).hide();
}

/**
 * ゲートデータ更新（ダミー）
 */
function refreshGateData() {
    var statuses = ['normal', 'warning', 'error', 'offline'];
    mapMonitor.gateData.forEach(function(gate) {
        if (Math.random() < 0.3) {
            gate.status = statuses[Math.floor(Math.random() * statuses.length)];
            gate.lastUpdate = new Date();
        }
    });
    renderGateIndicators();
}

/**
 * 自動更新開始
 */
function startAutoUpdate() {
    if (mapMonitor.autoUpdateId) {
        clearInterval(mapMonitor.autoUpdateId);
    }
    mapMonitor.autoUpdateId = setInterval(function() {
        refreshGateData();
    }, mapMonitor.updateInterval);
}

/**
 * ページサイズ変更対応
 */
window.addEventListener('resize', function() {
    applyZoom();
});

/**
 * 座標変換（スクリーン座標→マップ座標）
 */
function screenToMapCoordinate(x, y) {
    var floorPlan = document.getElementById('floorPlan');
    if (!floorPlan) return { x: 0, y: 0 };
    var rect = floorPlan.getBoundingClientRect();
    return {
        x: (x - rect.left) / mapMonitor.zoomLevel,
        y: (y - rect.top) / mapMonitor.zoomLevel
    };
}

/**
 * 座標変換（マップ座標→スクリーン座標）
 */
function mapToScreenCoordinate(x, y) {
    var floorPlan = document.getElementById('floorPlan');
    if (!floorPlan) return { x: 0, y: 0 };
    var rect = floorPlan.getBoundingClientRect();
    return {
        x: rect.left + (x * mapMonitor.zoomLevel),
        y: rect.top + (y * mapMonitor.zoomLevel)
    };
}

// デバッグ用
window.mapMonitor = mapMonitor;
