/**
 * マップモニター JavaScript
 * ゲート状態をマップ上で視覚的に表示・管理
 */

const MAP_STATE_PRESETS = {
    'closed-locked':   { doorState: 'closed', lockState: 'locked',   alarmState: 'normal', securityState: 'unset' },
    'closed-unlocked': { doorState: 'closed', lockState: 'unlocked', alarmState: 'normal', securityState: 'unset' },
    'abnormal':        { doorState: 'closed', lockState: 'locked',   alarmState: 'error',  securityState: 'unset' },
    'open-locked':     { doorState: 'open',   lockState: 'locked',   alarmState: 'normal', securityState: 'unset' },
    'open-unlocked':   { doorState: 'open',   lockState: 'unlocked', alarmState: 'normal', securityState: 'unset' },
    'security-set':    { doorState: 'closed', lockState: 'locked',   alarmState: 'normal', securityState: 'set' }
};

const MAP_STATE_LABELS = {
    'closed-locked': '閉扉施錠',
    'closed-unlocked': '閉扉解錠',
    'abnormal': '異常',
    'open-locked': '開扉施錠',
    'open-unlocked': '開扉解錠',
    'security-set': '警備セット'
};

// グローバル変数
let mapMonitor = {
    gateData: createFloorOneGateData(),

    zoomLevel: 1,
    defaultZoomLevel: 1,
    maxZoom: 3,
    minZoom: 0.5,
    updateInterval: 5000,
    currentFloor: 1,
    statusFilters: Object.keys(MAP_STATE_PRESETS)
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
    resetMapView();
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
        var gateState = getGateVisualState(gate);

        // フィルター判定: 非選択状態は非表示
        if (mapMonitor.statusFilters.indexOf(gateState) === -1) return;

        var pointer = document.createElement('div');
        pointer.className = 'gate-pointer';
        pointer.style.left = gate.position.x + 'px';
        pointer.style.top = gate.position.y + 'px';
        pointer.dataset.gate = gate.id;

        var circle = document.createElement('div');
        circle.className = 'pointer-circle state-' + gateState;

        var tooltip = document.createElement('div');
        tooltip.className = 'gate-tooltip state-' + gateState;

        var header = document.createElement('div');
        header.className = 'tooltip-header';
        var dot = document.createElement('div');
        dot.className = 'status-dot';
        dot.style.background = getStatusColorHex(gateState);
        var label = document.createElement('span');
        label.textContent = gate.name + '(' + gate.code + ')';
        header.appendChild(dot);
        header.appendChild(label);

        var iconsGrid = document.createElement('div');
        iconsGrid.className = 'tooltip-icons-grid';
        ['door', 'lock', 'alarm', 'security'].forEach(function(icon) {
            var item = document.createElement('div');
            item.className = 'tooltip-icon-item ' + getTooltipIconClass(gate, icon);
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
        'closed-locked': '#1f5fbf',
        'closed-unlocked': '#28a745',
        'abnormal': '#dc3545',
        'open-locked': '#6ec6ff',
        'open-unlocked': '#90ee90',
        'security-set': '#ffc107'
    };
    return colorMap[status] || '#1f5fbf';
}

function getGateVisualState(gate) {
    if (gate.alarmState === 'error') return 'abnormal';
    if (gate.securityState === 'set') return 'security-set';
    if (gate.doorState === 'open' && gate.lockState === 'locked') return 'open-locked';
    if (gate.doorState === 'open' && gate.lockState === 'unlocked') return 'open-unlocked';
    if (gate.doorState === 'closed' && gate.lockState === 'unlocked') return 'closed-unlocked';
    return 'closed-locked';
}

function getGateStateLabel(gate) {
    return MAP_STATE_LABELS[getGateVisualState(gate)] || MAP_STATE_LABELS['closed-locked'];
}

function getTooltipIconClass(gate, iconType) {
    if (iconType === 'door') {
        return gate.doorState === 'open' ? 'tooltip-icon-door-open' : 'tooltip-icon-door-closed';
    }
    if (iconType === 'lock') {
        return gate.lockState === 'unlocked' ? 'tooltip-icon-lock-unlocked' : 'tooltip-icon-lock-locked';
    }
    if (iconType === 'alarm') {
        return gate.alarmState === 'error' ? 'tooltip-icon-alarm-error' : 'tooltip-icon-empty';
    }
    if (iconType === 'security') {
        return gate.securityState === 'set' ? 'tooltip-icon-security-set' : 'tooltip-icon-empty';
    }
    return 'tooltip-icon-empty';
}

function createGateFromState(id, code, name, position, stateKey) {
    var preset = MAP_STATE_PRESETS[stateKey] || MAP_STATE_PRESETS['closed-locked'];
    return {
        id: id,
        code: code,
        name: name,
        position: position,
        lastUpdate: new Date(),
        doorState: preset.doorState,
        lockState: preset.lockState,
        alarmState: preset.alarmState,
        securityState: preset.securityState
    };
}

function createFloorOneGateData() {
    return [
        createGateFromState(1, '0001', 'ゲートA', { x: 110, y: 60 }, 'closed-locked'),
        createGateFromState(2, '0002', 'ゲートB', { x: 210, y: 60 }, 'closed-unlocked'),
        createGateFromState(3, '0003', 'ゲートC', { x: 310, y: 60 }, 'security-set'),
        createGateFromState(4, '0004', 'ゲートD', { x: 210, y: 110 }, 'abnormal'),
        createGateFromState(5, '0005', 'ゲートE', { x: 330, y: 110 }, 'open-locked'),
        createGateFromState(6, '0006', 'ゲートF', { x: 110, y: 170 }, 'open-unlocked'),
        createGateFromState(7, '0007', 'ゲートG', { x: 110, y: 270 }, 'closed-unlocked'),
        createGateFromState(8, '0008', 'ゲートH', { x: 110, y: 240 }, 'closed-locked')
    ];
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
    mapMonitor.zoomLevel = mapMonitor.defaultZoomLevel;
    applyZoom();
}

/**
 * マップ表示を初期状態へ戻す
 */
function resetMapView() {
    resetZoom();

    window.requestAnimationFrame(function() {
        centerMapViewport();
    });
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
 * ビューポートのスクロール位置を中央へ戻す
 */
function centerMapViewport() {
    var viewport = document.getElementById('mapViewport');
    if (!viewport) return;

    var left = Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2);
    var top = Math.max(0, (viewport.scrollHeight - viewport.clientHeight) / 2);
    viewport.scrollTo(left, top);
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
        mapMonitor.gateData = createFloorOneGateData();
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
    var gateStatus = gateData ? getGateStateLabel(gateData) : '-';

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
    var statuses = Object.keys(MAP_STATE_PRESETS);
    mapMonitor.gateData.forEach(function(gate) {
        if (Math.random() < 0.3) {
            var nextState = statuses[Math.floor(Math.random() * statuses.length)];
            var nextPreset = MAP_STATE_PRESETS[nextState];
            gate.doorState = nextPreset.doorState;
            gate.lockState = nextPreset.lockState;
            gate.alarmState = nextPreset.alarmState;
            gate.securityState = nextPreset.securityState;
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
