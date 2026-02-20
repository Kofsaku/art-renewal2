/**
 * システムステータス監視 JavaScript
 * ゲート機器の稼働状況をリアルタイム監視
 */
class StatusMonitor {
    constructor() {
        this.gates = [];
        this.gateGroups = []; // ゲートグループ
        this.currentLayout = 32; // デフォルト表示数
        this.statusTypes = ['normal', 'warning', 'error', 'offline'];
        this.refreshInterval = 5000; // 5秒間隔
        this.legendVisible = true;
        this.currentGateId = null;
        this.selectedGateGroup = null; // 選択されたゲートグループ
        this.sidebarCollapsed = false;
        this.statusFilters = ['normal', 'warning', 'error', 'offline']; // フィルター設定
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.generateGateData();
        this.generateGateGroups();
        this.renderGateButtons();
        this.renderGates();
        this.startAutoRefresh();
        this.handleResize();
    }

    setupEventListeners() {
        // レイアウト切替ボタン
        document.querySelectorAll('.layout-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const layout = parseInt(e.target.dataset.layout);
                this.switchLayout(layout);
            });
        });


        // ウィンドウリサイズ対応
        window.addEventListener('resize', () => {
            this.handleResize();
        });


        // サイドバートグルボタン
        document.getElementById('sidebarToggle')?.addEventListener('click', () => {
            this.toggleSidebar();
        });

        // ステータスフィルターチェックボックス（遅延実行で確実にDOM要素を取得）
        setTimeout(() => {
            document.querySelectorAll('.status-filter-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    this.updateStatusFilters();
                });
            });
        }, 100);
    }

    generateGateData() {
        this.gates = [];
        try {
            for (let i = 1; i <= 1000; i++) {
                const gateNumber = i.toString().padStart(4, '0');
                const gateName = this.getGateName(i);
                const icons = this.generateIconStatuses();
                
                this.gates.push({
                    id: i,
                    number: gateNumber,
                    name: gateName,
                    status: 'normal', // 初期値、後で更新
                    lastUpdated: new Date(),
                    online: Math.random() > 0.05,
                    location: this.getLocationName(i),
                    icons: icons
                });
                
                // 初回ステータス確定
                this.gates[i-1].status = this.determineFrameStatus(this.gates[i-1]);
            }
        } catch (e) {
            console.error('Error generating gate data:', e);
        }
    }

    generateIconStatuses(isOffline = false) {
        // 4つのアイコンの状態を生成：①開閉、②施解錠、③異常、④警備
        const iconTypes = ['door', 'lock', 'alarm', 'security'];
        return iconTypes.map((type, index) => {
            const rand = Math.random();
            let status = 'normal';
            
            if (type === 'door') {
                // 開扉/閉扉: 30%で開扉
                status = rand < 0.3 ? 'active' : 'normal';
            } else if (type === 'lock') {
                // 解錠/施錠: 30%で解錠
                status = rand < 0.3 ? 'active' : 'normal';
            } else if (type === 'alarm') {
                // 異常アイコン：10%の確率で異常
                status = rand < 0.1 ? 'error' : 'normal';
            } else if (type === 'security') {
                // 警備アイコン：20%の確率で警備セット状態
                status = rand < 0.2 ? 'warning' : 'normal';
            }
            
            return {
                type: type,
                status: status,
                label: '',
                position: index + 1
            };
        });
    }

    generateGateGroups() {
        this.gateGroups = [];
        const itemsPerGroup = this.currentLayout;
        const totalGates = this.gates.length;
        const maxGroups = Math.min(10, Math.ceil(totalGates / itemsPerGroup));
        
        for (let i = 0; i < maxGroups; i++) {
            const startGate = i * itemsPerGroup + 1;
            const endGate = Math.min((i + 1) * itemsPerGroup, totalGates);
            const groupNumber = (i + 1);
            
            this.gateGroups.push({
                id: `gate-group-${groupNumber}`,
                name: `${startGate}～${endGate}件`,
                range: [startGate, endGate],
                status: this.getGroupStatus([startGate, endGate])
            });
        }
    }

    getGroupStatus(range) {
        // IDは1始まりなので、インデックスは-1
        const gatesInRange = this.gates.slice(range[0] - 1, range[1]);
        
        if (gatesInRange.some(gate => gate.online && gate.status === 'error')) return 'error';
        if (gatesInRange.some(gate => gate.online && gate.status === 'warning')) return 'warning';
        if (gatesInRange.some(gate => !gate.online)) return 'offline';
        return 'normal';
    }

    switchLayout(layout) {
        this.currentLayout = layout;
        
        // ボタンのアクティブ状態更新
        document.querySelectorAll('.layout-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.layout) === layout);
        });

        // レイアウト変更時にゲートグループを再生成
        this.generateGateGroups();
        this.renderGateButtons();
        
        this.updateGridLayout();
        this.renderGates();
    }

    updateGridLayout() {
        const grid = document.getElementById('gateGrid');
        const container = document.querySelector('.gate-grid-container');
        if (!grid || !container) return;

        // コンテナの実際の幅を取得（完全に安全な計算）
        const containerWidth = container.clientWidth;
        const gapSize = 6;
        const cardPadding = 16; // カード内のpadding
        const minCardContentWidth = 140; // カード内容の最小幅
        const minCardWidth = minCardContentWidth + cardPadding;
        
        // 完全に安全な列数計算（レイアウトに応じて調整）
        let maxCols = this.currentLayout === 64 ? 8 : 5;
        const totalGapWidth = gapSize * (maxCols - 1);
        const safetyMargin = this.currentLayout === 64 ? 10 : 20; // 64件時は余裕を少なく、全体的に余裕を減らす
        const availableWidthForCards = containerWidth - totalGapWidth - safetyMargin;
        let cols = Math.floor(availableWidthForCards / minCardWidth);
        
        // レイアウトに応じた制限
        if (this.currentLayout === 16) {
            cols = Math.min(cols, 4);
            cols = Math.max(cols, 2);
        } else if (this.currentLayout === 32) {
            cols = Math.min(cols, 5); // 確実に表示するため5列制限
            cols = Math.max(cols, 3);
        } else { // 64件
            cols = Math.min(cols, 8); // 64件は8列まで許可
            cols = Math.max(cols, 6);
        }
        
        const rows = Math.ceil(this.currentLayout / cols);
        const actualCardWidth = Math.floor((containerWidth - (cols-1) * gapSize) / cols);

        grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        
        // 64件表示用のCSSクラスを適用
        if (this.currentLayout === 64) {
            grid.classList.add('layout-64');
        } else {
            grid.classList.remove('layout-64');
        }
        
    }

    updateStatusFilters() {
        
        this.statusFilters = [];
        const checkboxes = document.querySelectorAll('.status-filter-checkbox:checked');
        
        checkboxes.forEach(checkbox => {
            this.statusFilters.push(checkbox.value);
        });
        
        
        // ゲートのステータス分布を確認
        const statusCounts = {};
        this.gates.slice(0, this.currentLayout).forEach(gate => {
            const status = gate.online ? gate.status : 'offline';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        
        this.renderGates();
        this.renderGateButtons(); // ボタン一覧も更新
    }

    renderGates() {
        const grid = document.getElementById('gateGrid');
        if (!grid) return;

        grid.innerHTML = '';

        let displayGates;
        if (this.selectedGateGroup) {
            const group = this.gateGroups.find(g => g.id === this.selectedGateGroup);
            if (group) {
                // グループ範囲を表示
                displayGates = this.gates.slice(group.range[0] - 1, group.range[1]);
            } else {
                displayGates = this.gates.slice(0, this.currentLayout);
            }
        } else {
            // 初期表示は最初のLayout分
            displayGates = this.gates.slice(0, this.currentLayout);
        }


        // ステータスフィルターを適用
        const beforeFilterCount = displayGates.length;
        
        const filteredGates = [];
        displayGates.forEach((gate, index) => {
            const gateStatus = gate.online ? gate.status : 'offline';
            const shouldInclude = this.statusFilters.includes(gateStatus);
            
            
            if (shouldInclude) {
                filteredGates.push(gate);
            }
        });
        
        displayGates = filteredGates;

        displayGates.forEach(gate => {
            const gateCard = this.createGateCard(gate);
            grid.appendChild(gateCard);
        });
    }

    renderGateButtons() {
        const buttonList = document.getElementById('gateButtonList');
        if (!buttonList) return;

        buttonList.innerHTML = '';

        this.gateGroups.forEach(group => {
            // グループが現在のフィルターに該当するかチェック
            const shouldShow = this.statusFilters.includes(group.status);
            if (!shouldShow) return;

            const button = document.createElement('button');
            button.className = 'gate-button';
            button.setAttribute('data-group-id', group.id);
            
            const statusClass = `status-${group.status}`;
            button.innerHTML = `
                <span class="gate-button-text">${group.name}</span>
                <span class="gate-button-short">${group.name.substring(0, 3)}</span>
                <div class="gate-button-status ${statusClass}"></div>
                <div class="collapsed-gate-icon ${statusClass}"></div>
            `;
            
            button.addEventListener('click', () => {
                this.selectGateGroup(group.id);
            });
            
            buttonList.appendChild(button);
        });
    }

    selectGateGroup(groupId) {
        // 以前のアクティブボタンを解除
        document.querySelectorAll('.gate-button.active').forEach(btn => {
            btn.classList.remove('active');
        });

        // 新しいボタンをアクティブに
        const button = document.querySelector(`[data-group-id="${groupId}"]`);
        if (button) {
            button.classList.add('active');
        }

        this.selectedGateGroup = groupId;
        this.renderGates();
    }

    toggleSidebar() {
        const sidebar = document.getElementById('leftSidebar');
        const container = document.querySelector('.status-monitor-container');
        const toggleIcon = document.getElementById('toggleIcon');
        
        this.sidebarCollapsed = !this.sidebarCollapsed;
        
        if (this.sidebarCollapsed) {
            sidebar.classList.add('collapsed');
            container.classList.add('sidebar-collapsed');
            toggleIcon.textContent = '›';
        } else {
            sidebar.classList.remove('collapsed');
            container.classList.remove('sidebar-collapsed');
            toggleIcon.textContent = '‹';
        }
        
        // グリッドレイアウトを再計算
        setTimeout(() => {
            this.handleResize();
        }, 300); // CSS transitionの完了を待つ
    }

    createGateCard(gate) {
        const card = document.createElement('div');
        card.className = 'gate-card';
        card.setAttribute('data-gate-id', gate.id);

        // アイコンの③④状態に基づいてフレーム色を決定
        const frameStatus = this.determineFrameStatus(gate);
        card.style.borderColor = this.getStatusColor(frameStatus);

        // アイコングリッドを生成 (ゲートのオンライン状態を渡す)
        const iconGridHtml = this.createIconGrid(gate.icons, gate.online);

        card.innerHTML = `
            <div class="gate-info">
                <div class="gate-number">${gate.number}/${gate.name}</div>
                <div class="gate-status-indicator status-${frameStatus}"></div>
            </div>
            ${iconGridHtml}
        `;

        // クリックで遠隔操作画面を表示 (Mapモニター合わせ)
        card.addEventListener('click', (e) => {
            if (e.button === 0) { // 左クリック
                this.showRemoteControl(gate.number);
            }
        });
        
        // 右クリックで履歴表示設定表示 (個人一覧合わせ)
        card.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showHistorySettingsModal(gate);
        });

        return card;
    }

    getGateName(id) {
        const gateNames = [
            '正面玄関', '裏口', '東口', '西口', '北口',
            '南口', 'サーバー室', '会議室入口', '役員室', 'オフィス東',
            'オフィス西', '資料室', '倉庫', '駐車場', '屋上',
            '地下', '休憩室', '応接室', 'ラボ入口', '工場入口'
        ];
        return gateNames[id % gateNames.length] || `ゲート${id}`;
    }

    getLocationName(id) {
        const locations = [
            'エントランス', 'サーバールーム', '会議室A', '会議室B', '役員室',
            'オフィス1F', 'オフィス2F', 'オフィス3F', '資料室', '倉庫',
            '駐車場', '屋上', '地下室', '休憩室', '応接室'
        ];
        return locations[id % locations.length] || `エリア${id}`;
    }

    determineFrameStatus(gate) {
        // オフライン(灰)枠：gate.online が假
        if (!gate.online) {
            return 'offline';
        }
        
        const alarmIcon = gate.icons.find(icon => icon.type === 'alarm');
        const securityIcon = gate.icons.find(icon => icon.type === 'security');
        
        // 異常(赤)枠：③が異常状態（①②③は関係なし）
        if (alarmIcon && alarmIcon.status === 'error') {
            return 'error';
        }
        
        // 警告(黄)枠：③が通常 & ④が警備セット状態（①②は関係なし）
        if (alarmIcon && alarmIcon.status === 'normal' && 
            securityIcon && securityIcon.status === 'warning') {
            return 'warning';
        }
        
        // 正常(緑)枠：③④が通常（①②は関係なし）
        return 'normal';
    }

    createIconGrid(icons, online) {
        let iconHtml = '<div class="icon-grid">';
        icons.forEach(icon => {
            // オフライン時でもアイコンはそのまま表示（ユーザー要望：ランダム）
            // onlineフラグはフレーム色決定には使うが、アイコン表示自体はstatusに従う
            const iconClass = this.getIconClass(icon.status, icon.type);
            iconHtml += `<div class="status-icon ${iconClass}" data-type="${icon.type}"></div>`;
        });
        iconHtml += '</div>';
        return iconHtml;
    }

    getIconClass(status, type) {
        if (status === 'offline') return 'icon-offline';
        if (status === 'error' && type === 'alarm') return 'icon-error';
        if (status === 'warning' && type === 'security') return 'icon-security-active';
        
        // 各アイコンタイプに応じた通常/アクティブ表示
        switch (type) {
            case 'door':
                return status === 'active' ? 'icon-door-open' : 'icon-door-closed';
            case 'lock':
                return status === 'active' ? 'icon-lock-unlocked' : 'icon-lock-locked';
            case 'alarm':
                return 'icon-alarm-normal';
            case 'security':
                return 'icon-security-normal';
            default:
                return `icon-${type}`;
        }
    }

    getStatusColor(status) {
        const colors = {
            'normal': '#28a745',
            'warning': '#ffc107', 
            'error': '#dc3545',
            'offline': '#6c757d'
        };
        return colors[status] || '#dee2e6';
    }






    handleResize() {
        // レスポンシブ対応: 画面サイズに応じて自動調整
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // 画面サイズに応じた推奨表示数を計算
        let recommendedLayout = 32;
        
        if (screenWidth >= 1920 && screenHeight >= 1080) {
            recommendedLayout = 64;
        } else if (screenWidth >= 1400) {
            recommendedLayout = 32;
        } else if (screenWidth < 992) {
            recommendedLayout = 16;
        }

        // 現在のレイアウトが画面サイズに適さない場合は自動調整
        if (this.currentLayout > recommendedLayout) {
            this.switchLayout(recommendedLayout);
        }

        this.updateGridLayout();
    }

    // 外部からアクセス可能なメソッド
    refreshData() {
        this.generateGateData();
        this.renderGates();
    }

    setRefreshInterval(interval) {
        this.refreshInterval = interval;
    }

    showGateOperations(gateNumber) {
        // ゲートカード全体をクリックした時に履歴/遠隔操作選択ポップアップを表示
        this.showGateSelectionModal(gateNumber);
    }

    showGateSelectionModal(gateNumber) {
        // 既存のポップアップがあれば削除
        const existingPopup = document.getElementById('gateSelectionPopup');
        if (existingPopup) {
            existingPopup.remove();
        }

        // ポップアップを作成
        const popup = document.createElement('div');
        popup.id = 'gateSelectionPopup';
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid #007bff;
            border-radius: 8px;
            padding: 20px;
            z-index: 9999;
            box-shadow: 0 4px 16px rgba(0,0,0,0.3);
            min-width: 300px;
        `;

        popup.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h5 style="margin: 0; color: #007bff;">${gateNumber}</h5>
                <p style="margin: 5px 0 0 0; color: #666;">※枠内クリック<br>※複数選択不可</p>
            </div>
            <div style="display: flex; gap: 20px; justify-content: center;">
                <div style="text-align: center;">
                    <div style="border: 2px solid #17a2b8; border-radius: 8px; padding: 15px; cursor: pointer; background: #f8f9fa;" 
                         onclick="statusMonitor.showHistoryOptions('${gateNumber}')">
                        <div style="display: flex; align-items: center; margin-bottom: 10px;">
                            <span style="color: #17a2b8; font-size: 1.5em; margin-right: 8px;">✓</span>
                            <span style="color: #17a2b8; font-size: 1.5em;">✗</span>
                        </div>
                        <strong>履歴操作</strong>
                    </div>
                </div>
                <div style="text-align: center;">
                    <div style="border: 2px solid #6f42c1; border-radius: 8px; padding: 15px; cursor: pointer; background: #f8f9fa;" 
                         onclick="statusMonitor.showRemoteOptions('${gateNumber}')">
                        <div style="display: flex; align-items: center; margin-bottom: 10px;">
                            <span style="color: #6f42c1; font-size: 1.5em; margin-right: 8px;">✓</span>
                            <span style="color: #6f42c1; font-size: 1.5em;">✗</span>
                        </div>
                        <strong>遠隔操作</strong>
                    </div>
                </div>
            </div>
            <div style="text-align: center; margin-top: 15px;">
                <button onclick="statusMonitor.closeGateSelectionModal()" 
                        style="padding: 5px 15px; border: 1px solid #ccc; border-radius: 4px; background: #f8f9fa; cursor: pointer;">
                    閉じる
                </button>
            </div>
        `;

        // オーバーレイを作成
        const overlay = document.createElement('div');
        overlay.id = 'gateSelectionOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 9998;
        `;
        overlay.onclick = () => this.closeGateSelectionModal();

        document.body.appendChild(overlay);
        document.body.appendChild(popup);
    }

    showHistoryOptions(gateNumber) {
        this.closeGateSelectionModal();
        alert(`${gateNumber}の履歴表示機能（未実装）`);
    }

    showRemoteOptions(gateNumber) {
        this.closeGateSelectionModal();
        this.showRemoteControl(gateNumber);
    }

    showRemoteControl(gateNumber) {
        this.currentGateId = gateNumber;
        this.showRemoteControlModal(gateNumber);
    }

    showRemoteControlModal(gateNumber) {
        const existingModal = document.getElementById('remoteControlModal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'remoteControlModal';
        modal.tabIndex = -1;
        modal.setAttribute('aria-hidden', 'true');

        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">ゲート詳細 - ゲート${gateNumber}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-12">
                                <h6>遠隔操作 <span class="text-muted" style="font-size: 0.8em;">※複数選択不可</span></h6>
                                <div class="form-check mb-2">
                                    <input class="form-check-input" type="radio" name="remoteOperation" value="continuous_unlock" id="op1">
                                    <label class="form-check-label" for="op1">連続解錠</label>
                                </div>
                                <div class="form-check mb-2">
                                    <input class="form-check-input" type="radio" name="remoteOperation" value="unlock" id="op2">
                                    <label class="form-check-label" for="op2">解錠</label>
                                </div>
                                <div class="form-check mb-2">
                                    <input class="form-check-input" type="radio" name="remoteOperation" value="lock" id="op3">
                                    <label class="form-check-label" for="op3">施錠</label>
                                </div>
                                <div class="form-check mb-2">
                                    <input class="form-check-input" type="radio" name="remoteOperation" value="security_set" id="op4">
                                    <label class="form-check-label" for="op4">警備セット</label>
                                </div>
                                <div class="form-check mb-2">
                                    <input class="form-check-input" type="radio" name="remoteOperation" value="security_release" id="op5">
                                    <label class="form-check-label" for="op5">警備セット解除</label>
                                </div>
                            </div>
                        </div>
                        <div class="text-end">
                            <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">キャンセル</button>
                            <button type="button" class="btn btn-primary" onclick="statusMonitor.executeRemoteOperation('${gateNumber}')">実行</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        modal.addEventListener('hidden.bs.modal', function () { modal.remove(); });
    }

    showHistorySettingsModal(gateInfo) {
        // もし引数がIDなどの場合はオブジェクトを探す
        let gate = typeof gateInfo === 'object' ? gateInfo : this.gates.find(g => g.number === gateInfo || g.id === gateInfo);
        if (!gate) return;

        const existingModal = document.getElementById('historySettingsModal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'historySettingsModal';
        modal.tabIndex = -1;
        modal.setAttribute('aria-hidden', 'true');

        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-history text-info me-2"></i>履歴表示設定 - ゲート${gate.number}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info py-2 mb-3" style="font-size: 0.9em;">
                            <i class="fas fa-door-open me-2"></i>ゲート${gate.number}(${gate.number})の履歴を表示します
                        </div>
                        <div class="row g-3">
                            <div class="col-6">
                                <h6 class="border-bottom pb-1 mb-2" style="font-size: 0.9em;"><i class="fas fa-calendar-alt me-1"></i>期間</h6>
                                <div class="form-check small">
                                    <input class="form-check-input" type="radio" name="histPeriod" id="p1" checked>
                                    <label class="form-check-label" for="p1">当日</label>
                                </div>
                                <div class="form-check small">
                                    <input class="form-check-input" type="radio" name="histPeriod" id="p2">
                                    <label class="form-check-label" for="p2">前日～</label>
                                </div>
                                <div class="form-check small">
                                    <input class="form-check-input" type="radio" name="histPeriod" id="p3">
                                    <label class="form-check-label" for="p3">1週間前～</label>
                                </div>
                            </div>
                            <div class="col-6">
                                <h6 class="border-bottom pb-1 mb-2" style="font-size: 0.9em;"><i class="fas fa-filter me-1"></i>履歴種類</h6>
                                <div class="form-check small">
                                    <input class="form-check-input" type="checkbox" id="t1" checked>
                                    <label class="form-check-label" for="t1">全て</label>
                                </div>
                                <div class="form-check small">
                                    <input class="form-check-input" type="checkbox" id="t2">
                                    <label class="form-check-label" for="t2">軽エラー</label>
                                </div>
                                <div class="form-check small">
                                    <input class="form-check-input" type="checkbox" id="t3">
                                    <label class="form-check-label" for="t3">重エラー</label>
                                </div>
                                <div class="form-check small">
                                    <input class="form-check-input" type="checkbox" id="t4">
                                    <label class="form-check-label" for="t4">重エラー復旧</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">キャンセル</button>
                        <button type="button" class="btn btn-primary btn-sm" onclick="alert('報告書画面へ遷移します')">
                            <i class="fas fa-arrow-right me-1"></i>報告書画面へ遷移
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        modal.addEventListener('hidden.bs.modal', function () { modal.remove(); });
    }

    executeRemoteOperation(gateNumber) {
        const selectedRadio = document.querySelector('input[name="remoteOperation"]:checked');
        if (!selectedRadio) {
            alert('操作を選択してください。');
            return;
        }
        
        const operationName = selectedRadio.nextElementSibling.textContent;
        alert(`${gateNumber}に${operationName}を実行します`);
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('remoteControlModal'));
        if (modal) modal.hide();
    }

    toggleLegend() {
        const legendPanel = document.getElementById('legendPanel');
        const toggleBtn = document.getElementById('toggleLegend');
        if (legendPanel && toggleBtn) {
            this.legendVisible = !this.legendVisible;
            legendPanel.style.display = this.legendVisible ? 'block' : 'none';
            toggleBtn.textContent = this.legendVisible ? '凡例非表示' : '凡例表示';
        }
    }

    startAutoRefresh() {
        setInterval(() => this.updateGateStatuses(), this.refreshInterval);
    }

    updateGateStatuses() {
        const updateCount = Math.floor(Math.random() * 5) + 2; 
        for (let i = 0; i < updateCount; i++) {
            const randomIndex = Math.floor(Math.random() * this.gates.length);
            const gate = this.gates[randomIndex];
            if (Math.random() < 0.2) {
                gate.icons = this.generateIconStatuses();
                gate.status = this.determineFrameStatus(gate);
                gate.lastUpdated = new Date();
                gate.online = Math.random() > 0.05;
            }
        }
        this.gateGroups.forEach(group => group.status = this.getGroupStatus(group.range));
        this.renderGateButtons();
        this.renderGates();
    }

    handleResize() {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        let recommendedLayout = 32;
        if (screenWidth >= 1920 && screenHeight >= 1080) recommendedLayout = 64;
        else if (screenWidth >= 1400) recommendedLayout = 32;
        else if (screenWidth < 992) recommendedLayout = 16;
        if (this.currentLayout > recommendedLayout) this.switchLayout(recommendedLayout);
        this.updateGridLayout();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.statusMonitor = new StatusMonitor();
});