/**
 * マップモニター JavaScript
 * ゲート状態をマップ上で視覚的に表示・管理
 */

// グローバル変数
let mapMonitor = {
    // ゲートデータ
    gateData: [
        { id: 1, name: 'ゲート①', status: 'normal', position: { x: 110, y: 60 }, lastUpdate: new Date() },
        { id: 2, name: 'ゲート②', status: 'warning', position: { x: 210, y: 60 }, lastUpdate: new Date() },
        { id: 3, name: 'ゲート③', status: 'normal', position: { x: 310, y: 60 }, lastUpdate: new Date() },
        { id: 4, name: 'ゲート④', status: 'error', position: { x: 210, y: 110 }, lastUpdate: new Date() },
        { id: 5, name: 'ゲート⑤', status: 'normal', position: { x: 330, y: 110 }, lastUpdate: new Date() },
        { id: 6, name: 'ゲート⑥', status: 'offline', position: { x: 110, y: 170 }, lastUpdate: new Date() },
        { id: 7, name: 'ゲート⑦', status: 'normal', position: { x: 110, y: 270 }, lastUpdate: new Date() },
        { id: 8, name: 'ゲート⑧', status: 'warning', position: { x: 110, y: 240 }, lastUpdate: new Date() }
    ],
    
    // ズーム設定
    zoomLevel: 1,
    maxZoom: 3,
    minZoom: 0.5,
    
    // 更新間隔（ミリ秒）
    updateInterval: 5000,

    // 現在のフロア
    currentFloor: 1
};

/**
 * 初期化処理
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeMapMonitor();
    setupEventListeners();
    renderGateButtons();
    startAutoUpdate();
});

/**
 * マップモニター初期化
 */
function initializeMapMonitor() {
    renderGateIndicators();
    updateGateStatuses();
}

/**
 * イベントリスナー設定
 */
function setupEventListeners() {
    // サイドバー開閉
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }

    // フロア切り替え
    document.querySelectorAll('.floor-button').forEach(button => {
        button.addEventListener('click', function() {
            const floor = parseInt(this.dataset.floor);
            switchFloor(floor);
        });
    });
    
    // ゲートクリックイベント
    document.querySelectorAll('.gate-indicator').forEach(indicator => {
        indicator.addEventListener('click', function() {
            const gateId = parseInt(this.dataset.gate);
            showGateDetail(gateId);
        });
    });
    
    // キーボードショートカット
    document.addEventListener('keydown', function(e) {
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
 * ゲートボタンリスト描画
 */
function renderGateButtons() {
    const gateButtonList = document.getElementById('gateButtonList');
    if (!gateButtonList) return;
    
    gateButtonList.innerHTML = '';
    
    mapMonitor.gateData.forEach(gate => {
        const button = document.createElement('button');
        button.className = 'gate-button';
        button.dataset.gate = gate.id;
        
        const statusIndicator = document.createElement('div');
        statusIndicator.className = `gate-button-status status-${gate.status}`;
        
        const text = document.createElement('span');
        text.className = 'gate-button-text';
        text.textContent = gate.name;
        
        const shortText = document.createElement('span');
        shortText.className = 'gate-button-short';
        shortText.textContent = `G${gate.id}`;
        
        const collapsedIcon = document.createElement('div');
        collapsedIcon.className = `collapsed-gate-icon status-${gate.status}`;
        
        button.appendChild(text);
        button.appendChild(shortText);
        button.appendChild(statusIndicator);
        button.appendChild(collapsedIcon);
        
        button.addEventListener('click', () => {
            showGateDetail(gate.id);
            // アクティブ状態の切り替え
            document.querySelectorAll('.gate-button').forEach(b => b.classList.remove('active'));
            button.classList.add('active');
        });
        
        gateButtonList.appendChild(button);
    });
}

/**
 * ゲートインジケーター描画
 */
function renderGateIndicators() {
    const floorPlan = document.getElementById('floorPlan');
    if (!floorPlan) return;
    
    // 既存のインジケーターをクリアして再描画
    const existingIndicators = floorPlan.querySelectorAll('.gate-indicator, .gate-pointer');
    existingIndicators.forEach(el => el.remove());
    
    mapMonitor.gateData.forEach(gate => {
        const pointer = document.createElement('div');
        pointer.className = `gate-pointer`;
        pointer.style.left = `${gate.position.x}px`;
        pointer.style.top = `${gate.position.y}px`;
        pointer.dataset.gate = gate.id;
        
        const circle = document.createElement('div');
        circle.className = `pointer-circle status-${gate.status}`;
        
        const tooltip = document.createElement('div');
        tooltip.className = `gate-tooltip status-${gate.status}`;
        
        // ツールチップの内容
        tooltip.innerHTML = `
            <div class="tooltip-header">
                <div class="status-dot status-${gate.status}" style="background: ${getStatusColorHex(gate.status)}"></div>
                <span>${gate.id.toString().padStart(4, '0')}<br>${gate.name}</span>
            </div>
            <div class="tooltip-icons-grid">
                <div class="tooltip-icon-item tooltip-icon-door"></div>
                <div class="tooltip-icon-item tooltip-icon-lock"></div>
                <div class="tooltip-icon-item tooltip-icon-security"></div>
                <div class="tooltip-icon-item tooltip-icon-comm"></div>
            </div>
        `;
        
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
    const colorMap = {
        normal: '#28a745',
        warning: '#ffc107',
        error: '#dc3545',
        offline: '#6c757d'
    };
    return colorMap[status] || '#6c757d';
}

/**
 * ゲート状態更新
 */
function updateGateStatuses() {
    mapMonitor.gateData.forEach(gate => {
        const indicator = document.querySelector(`.gate-indicator[data-gate="${gate.id}"]`);
        if (indicator) {
            // 状態クラスを更新
            indicator.className = `gate-indicator status-${gate.status}`;
            
            // アニメーション効果（状態変更時）
            indicator.style.transform = 'scale(1.2)';
            setTimeout(() => {
                indicator.style.transform = 'scale(1)';
            }, 300);
        }
        
        // ボタンの状態も更新
        const button = document.querySelector(`.gate-button[data-gate="${gate.id}"]`);
        if (button) {
            const statusIndicator = button.querySelector('.gate-button-status');
            const collapsedIcon = button.querySelector('.collapsed-gate-icon');
            if (statusIndicator) {
                statusIndicator.className = `gate-button-status status-${gate.status}`;
            }
            if (collapsedIcon) {
                collapsedIcon.className = `collapsed-gate-icon status-${gate.status}`;
            }
        }
    });
    
}

/**
 * サイドバー開閉
 */
function toggleSidebar() {
    const sidebar = document.getElementById('leftSidebar');
    const container = document.querySelector('.map-monitor-container');
    const toggleIcon = document.getElementById('toggleIcon');
    
    if (!sidebar || !container || !toggleIcon) return;
    
    mapMonitor.sidebarCollapsed = !mapMonitor.sidebarCollapsed;
    
    if (mapMonitor.sidebarCollapsed) {
        sidebar.classList.add('collapsed');
        container.classList.add('sidebar-collapsed');
        toggleIcon.textContent = '›';
    } else {
        sidebar.classList.remove('collapsed');
        container.classList.remove('sidebar-collapsed');
        toggleIcon.textContent = '‹';
    }
}

/**
 * ズームイン
 */
function zoomIn() {
    if (mapMonitor.zoomLevel < mapMonitor.maxZoom) {
        mapMonitor.zoomLevel += 0.1;
        applyZoom();
    }
}

/**
 * ズームアウト
 */
function zoomOut() {
    if (mapMonitor.zoomLevel > mapMonitor.minZoom) {
        mapMonitor.zoomLevel -= 0.1;
        applyZoom();
    }
}

/**
 * ズームリセット
 */
function resetZoom() {
    mapMonitor.zoomLevel = 1;
    applyZoom();
    
    // マップを中央に配置
    const mapContainer = document.querySelector('.map-container');
    if (mapContainer) {
        mapContainer.scrollTo({
            left: (mapContainer.scrollWidth - mapContainer.clientWidth) / 2,
            top: (mapContainer.scrollHeight - mapContainer.clientHeight) / 2,
            behavior: 'smooth'
        });
    }
}

/**
 * ズーム適用
 */
function applyZoom() {
    const floorPlan = document.getElementById('floorPlan');
    const viewport = document.getElementById('mapViewport');
    if (!floorPlan || !viewport) return;

    floorPlan.style.transform = `scale(${mapMonitor.zoomLevel})`;
    floorPlan.style.transformOrigin = '50% 50%';

    const baseWidth = 800;
    const baseHeight = 500;
    const scaledWidth = baseWidth * mapMonitor.zoomLevel;
    const scaledHeight = baseHeight * mapMonitor.zoomLevel;
    
    const marginX = Math.max(50, (viewport.clientWidth - scaledWidth) / 2);
    const marginY = Math.max(50, (viewport.clientHeight - scaledHeight) / 2);

    floorPlan.style.marginTop = `${marginY}px`;
    floorPlan.style.marginBottom = `${marginY}px`;
    viewport.style.textAlign = 'center';
}

/**
 * フロア切り替え
 */
function switchFloor(floor) {
    mapMonitor.currentFloor = floor;
    
    // ボタンの表示更新
    document.querySelectorAll('.floor-button').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.floor) === floor);
    });

    // ゲートの再配置（フロア2/3はランダム）
    if (floor === 1) {
        // 固定配置（初期値）
        mapMonitor.gateData = [
            { id: 1, name: 'ゲート①', status: 'normal', position: { x: 110, y: 60 } },
            { id: 2, name: 'ゲート②', status: 'normal', position: { x: 210, y: 60 } },
            { id: 3, name: 'ゲート③', status: 'warning', position: { x: 310, y: 60 } },
            { id: 4, name: 'ゲート④', status: 'error', position: { x: 210, y: 110 } },
            { id: 5, name: 'ゲート⑤', status: 'error', position: { x: 330, y: 110 } },
            { id: 6, name: 'ゲート⑥', status: 'normal', position: { x: 110, y: 170 } },
            { id: 7, name: 'ゲート⑦', status: 'normal', position: { x: 110, y: 270 } },
            { id: 8, name: 'ゲート⑧', status: 'offline', position: { x: 110, y: 240 } }
        ];
    } else {
        // ランダム配置（ダミー）
        mapMonitor.gateData.forEach(gate => {
            gate.position = {
                x: Math.floor(Math.random() * 600) + 100,
                y: Math.floor(Math.random() * 300) + 100
            };
        });
    }

    renderGateIndicators();
    updateFloorTitle();
}

/**
 * フロアタイトルの更新
 */
function updateFloorTitle() {
    const title = document.querySelector('.monitor-header h2');
    if (title) {
        title.textContent = `マップモニター - フロア${mapMonitor.currentFloor}`;
    }
}

/**
 * ゲート詳細表示
 */
function showGateDetail(gateId) {
    const gate = mapMonitor.gateData.find(g => g.id === gateId);
    if (!gate) return;
    
    // モーダル要素取得
    const modal = document.getElementById('gateDetailModal');
    const modalGateNumber = document.getElementById('modalGateNumber');
    const modalGateStatus = document.getElementById('modalGateStatus');
    const modalLastUpdate = document.getElementById('modalLastUpdate');
    
    if (!modal || !modalGateNumber || !modalGateStatus || !modalLastUpdate) return;
    
    // モーダル内容設定
    modalGateNumber.textContent = gate.name;
    modalGateStatus.innerHTML = `<span class="badge bg-${getStatusColor(gate.status)}">${getStatusText(gate.status)}</span>`;
    modalLastUpdate.textContent = gate.lastUpdate.toLocaleString();
    
    // モーダル表示
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
}

/**
 * 状態に対応する色を取得
 */
function getStatusColor(status) {
    const colorMap = {
        normal: 'success',
        warning: 'warning',
        error: 'danger',
        offline: 'secondary'
    };
    return colorMap[status] || 'secondary';
}

/**
 * 状態に対応するテキストを取得
 */
function getStatusText(status) {
    const textMap = {
        normal: '正常',
        warning: '警告',
        error: '異常',
        offline: 'オフライン'
    };
    return textMap[status] || '不明';
}

/**
 * グループ制御モーダル表示
 */
function showGroupControlModal() {
    const modal = document.getElementById('groupControlModal');
    if (modal) {
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }
}

/**
 * グループ制御実行
 */
function executeGroupControl() {
    const selectedGroups = [];
    document.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
        selectedGroups.push(checkbox.value);
    });
    
    const selectedOperation = document.querySelector('input[name="remoteOperation"]:checked');
    
    if (selectedGroups.length === 0) {
        alert('グループを選択してください。');
        return;
    }
    
    if (!selectedOperation) {
        alert('遠隔操作を選択してください。');
        return;
    }
    
    const operationText = getOperationText(selectedOperation.value);
    const groupText = selectedGroups.join(', ');
    
    if (confirm(`グループ${groupText}に対して「${operationText}」を実行しますか？`)) {
        setTimeout(() => {
            alert(`グループ${groupText}に「${operationText}」を実行しました。`);
            bootstrap.Modal.getInstance(document.getElementById('groupControlModal')).hide();
        }, 500);
    }
}

/**
 * 単一ゲート遠隔操作実行
 */
function executeSingleRemoteCommand() {
    const selectedOperation = document.querySelector('input[name="singleRemoteOperation"]:checked');
    
    if (!selectedOperation) {
        alert('遠隔操作を選択してください。');
        return;
    }
    
    const operationText = getOperationText(selectedOperation.value);
    
    if (confirm(`「${operationText}」を実行しますか？`)) {
        setTimeout(() => {
            alert(`「${operationText}」を実行しました。`);
            bootstrap.Modal.getInstance(document.getElementById('gateDetailModal')).hide();
        }, 500);
    }
}

/**
 * 操作テキスト取得
 */
function getOperationText(operation) {
    const operationMap = {
        continuous_unlock: '連続解錠',
        unlock: '解錠',
        lock: '施錠',
        guard_set: '警備セット',
        guard_release: '警備セット解除'
    };
    return operationMap[operation] || '不明な操作';
}

/**
 * ゲート履歴表示
 */
function showGateHistory() {
    alert('ゲート履歴画面に遷移します（実装予定）');
}

/**
 * 遠隔操作実行（レガシー関数）
 */
function executeRemoteCommand(command) {
    const commandText = {
        unlock: 'ドア解錠',
        lock: 'ドア施錠',
        reset: 'リセット',
        status: 'ステータス確認'
    };
    
    const result = confirm(`${commandText[command]}を実行しますか？`);
    if (result) {
        // 実際のAPI呼び出しの代わりにダミー処理
        setTimeout(() => {
            alert(`${commandText[command]}を実行しました`);
        }, 500);
    }
}

/**
 * ゲートデータ更新（ダミー）
 */
function refreshGateData() {
    // ランダムに状態を変更（デモ用）
    mapMonitor.gateData.forEach(gate => {
        const statuses = ['normal', 'warning', 'error', 'offline'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        // 30%の確率で状態変更
        if (Math.random() < 0.3) {
            gate.status = randomStatus;
            gate.lastUpdate = new Date();
        }
    });
    
    updateGateStatuses();
}

/**
 * 自動更新開始
 */
function startAutoUpdate() {
    setInterval(() => {
        refreshGateData();
    }, mapMonitor.updateInterval);
}

/**
 * ページサイズ変更対応
 */
window.addEventListener('resize', function() {
    // ズームレベルの調整が必要な場合の処理
    applyZoom();
});

/**
 * ユーティリティ関数
 */

/**
 * 座標変換（スクリーン座標→マップ座標）
 */
function screenToMapCoordinate(x, y) {
    const floorPlan = document.getElementById('floorPlan');
    if (!floorPlan) return { x: 0, y: 0 };
    
    const rect = floorPlan.getBoundingClientRect();
    const mapX = (x - rect.left) / mapMonitor.zoomLevel;
    const mapY = (y - rect.top) / mapMonitor.zoomLevel;
    
    return { x: mapX, y: mapY };
}

/**
 * 座標変換（マップ座標→スクリーン座標）
 */
function mapToScreenCoordinate(x, y) {
    const floorPlan = document.getElementById('floorPlan');
    if (!floorPlan) return { x: 0, y: 0 };
    
    const rect = floorPlan.getBoundingClientRect();
    const screenX = rect.left + (x * mapMonitor.zoomLevel);
    const screenY = rect.top + (y * mapMonitor.zoomLevel);
    
    return { x: screenX, y: screenY };
}

// デバッグ用：グローバルスコープにマップモニターオブジェクトを公開
window.mapMonitor = mapMonitor;

// No.25: Extract map data function
function extractMapData() {
    const gateStatuses = mapMonitor.gates || [];
    const normalGates = gateStatuses.filter(g => g.status === 'normal').length;
    const warningGates = gateStatuses.filter(g => g.status === 'warning').length;
    const errorGates = gateStatuses.filter(g => g.status === 'error').length;
    const offlineGates = gateStatuses.filter(g => g.status === 'offline').length;
    
    let message = 'マップステータス抽出情報:\n';
    message += `正常: ${normalGates}件\n`;
    message += `警告: ${warningGates}件\n`;
    message += `異常: ${errorGates}件\n`;
    message += `オフライン: ${offlineGates}件\n`;
    message += `合計: ${gateStatuses.length}ゲート`;
    
    if (confirm(message + '\n\nこのデータを抽出しますか？')) {
        alert(`マップステータスデータを抽出しました。`);
    }
}