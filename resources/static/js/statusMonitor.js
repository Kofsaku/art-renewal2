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
        this.layoutFrameId = null;
        this.layoutTimeoutId = null;
        this.gridResizeObserver = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.generateGateData();
        this.generateGateGroups();
        this.renderGateGroupDropdown();
        this.renderGateButtons();
        this.renderGates();
        this.observeGridContainer();
        this.startAutoRefresh();
        this.handleResize();
        // 初回表示はフォント・凡例描画で高さが変わるため、読み込み完了後にも再計算する
        window.addEventListener('load', () => this.scheduleGridLayoutUpdate(), { once: true });
        this.scheduleGridLayoutUpdate();
    }

    setupEventListeners() {
        // レイアウト切替ボタン
        document.querySelectorAll('.td-layout-btn').forEach(btn => {
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
                    online: Math.random() > 0.3, // TODO: 確認用に30%オフライン（本番は0.05に戻す）
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

    generateIconStatuses() {
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

    renderGateGroupDropdown() {
        var dropdown = document.getElementById('gateListDropdown');
        if (!dropdown) return;
        dropdown.innerHTML = '';
        this.gateGroups.forEach((group) => {
            var li = document.createElement('li');
            var a = document.createElement('a');
            a.className = 'dropdown-item d-flex align-items-center justify-content-between';
            a.href = '#';
            a.style.fontSize = '0.85rem';

            var label = document.createElement('span');
            label.textContent = group.name;

            var dot = document.createElement('span');
            dot.className = 'gate-group-dot gate-group-' + group.status;

            a.appendChild(label);
            a.appendChild(dot);
            a.addEventListener('click', (e) => {
                e.preventDefault();
                this.selectedGateGroup = group.id;
                this.renderGates();
                // ドロップダウンを閉じる
                var btn = document.querySelector('.td-gate-list-btn');
                if (btn) btn.click();
            });
            li.appendChild(a);
            dropdown.appendChild(li);
        });
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
        document.querySelectorAll('.td-layout-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.layout) === layout);
        });

        // レイアウト変更時にゲートグループを再生成
        this.generateGateGroups();
        this.renderGateButtons();

        // ドロップダウンも更新
        this.renderGateGroupDropdown();
        
        this.renderGates();
    }

    observeGridContainer() {
        const container = document.querySelector('.gate-grid-container');
        if (!container || typeof ResizeObserver === 'undefined') return;

        this.gridResizeObserver = new ResizeObserver(() => {
            this.scheduleGridLayoutUpdate();
        });
        this.gridResizeObserver.observe(container);
    }

    scheduleGridLayoutUpdate() {
        if (this.layoutFrameId) {
            cancelAnimationFrame(this.layoutFrameId);
        }
        if (this.layoutTimeoutId) {
            clearTimeout(this.layoutTimeoutId);
        }

        this.layoutFrameId = requestAnimationFrame(() => {
            this.layoutFrameId = null;
            this.updateGridLayout();

            // 初回描画直後の遅延リフローも拾う
            this.layoutTimeoutId = window.setTimeout(() => {
                this.layoutTimeoutId = null;
                this.updateGridLayout();
            }, 120);
        });
    }

    updateGridLayout() {
        const grid = document.getElementById('gateGrid');
        const container = document.querySelector('.gate-grid-container');
        if (!grid || !container) return;

        // レイアウトクラスを切替
        grid.classList.remove('layout-16', 'layout-64');
        if (this.currentLayout === 16) grid.classList.add('layout-16');
        else if (this.currentLayout === 64) grid.classList.add('layout-64');

        // レイアウト別パラメータ
        const layoutConfig = {
            16: { minCardWidth: 210, gap: 5, maxCols: 4, minRowH: 60, maxRowH: 200 },
            32: { minCardWidth: 175, gap: 4, maxCols: 4, minRowH: 44, maxRowH: 140 },
            64: { minCardWidth: 135, gap: 3, maxCols: 8, minRowH: 32, maxRowH: 130 }
        };
        const config = layoutConfig[this.currentLayout] || layoutConfig[32];
        const containerPad = 12; // padding 6px×2
        const containerWidth = container.clientWidth - containerPad;

        let cols = Math.max(1, Math.floor((containerWidth + config.gap) / (config.minCardWidth + config.gap)));
        cols = Math.min(cols, config.maxCols);

        // ビューポートから利用可能な高さを計算（container.clientHeightに依存しない）
        const rows = Math.ceil(this.currentLayout / cols);
        const headerH = document.querySelector('.td-header')?.offsetHeight || 48;
        const legendEl = document.querySelector('.sm-legend');
        const footerEl = document.querySelector('.td-footer');
        const legendH = legendEl ? legendEl.offsetHeight : 0;
        const footerH = footerEl ? footerEl.offsetHeight : 0;
        const smOuter = document.querySelector('.sm-outer');
        const smInner = document.querySelector('.sm-inner');
        const outerPad = smOuter ? (parseFloat(getComputedStyle(smOuter).paddingTop) + parseFloat(getComputedStyle(smOuter).paddingBottom)) : 8;
        const innerBorder = smInner ? (parseFloat(getComputedStyle(smInner).borderTopWidth) + parseFloat(getComputedStyle(smInner).borderBottomWidth)) : 2;
        const availableHeight = window.innerHeight - headerH - legendH - footerH - outerPad - innerBorder - containerPad;

        let rowHeight;
        if (availableHeight > 0) {
            rowHeight = Math.floor((availableHeight - (rows - 1) * config.gap) / rows);
            rowHeight = Math.max(config.minRowH, Math.min(config.maxRowH, rowHeight));
        } else {
            rowHeight = config.minRowH;
        }

        grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        grid.style.gridAutoRows = rowHeight + 'px';
    }

    updateStatusFilters() {
        this.statusFilters = [];
        document.querySelectorAll('.status-filter-checkbox:checked').forEach(checkbox => {
            this.statusFilters.push(checkbox.value);
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
        displayGates = displayGates.filter(gate => {
            const gateStatus = gate.online ? gate.status : 'offline';
            return this.statusFilters.includes(gateStatus);
        });

        displayGates.forEach(gate => {
            const gateCard = this.createGateCard(gate);
            grid.appendChild(gateCard);
        });

        this.scheduleGridLayoutUpdate();
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
        card.classList.add('status-' + frameStatus);
        card.style.borderColor = this.getStatusColor(frameStatus);

        // アイコングリッドを生成 (ゲートのオンライン状態を渡す)
        const iconGridHtml = this.createIconGrid(gate.icons);

        card.innerHTML = `
            <div class="gate-info">
                <div class="gate-status-indicator indicator-${frameStatus}"></div>
                <div class="gate-number">${common.escapeHtml(gate.number)} : ${common.escapeHtml(gate.name)}</div>
            </div>
            ${iconGridHtml}
        `;

        // 左クリックで操作選択モーダルを表示
        card.addEventListener('click', (e) => {
            if (e.button === 0) {
                this.showActionModal(gate);
            }
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
        return gateNames[(id - 1) % gateNames.length] || `ゲート${id}`;
    }

    getLocationName(id) {
        const locations = [
            'エントランス', 'サーバールーム', '会議室A', '会議室B', '役員室',
            'オフィス1F', 'オフィス2F', 'オフィス3F', '資料室', '倉庫',
            '駐車場', '屋上', '地下室', '休憩室', '応接室'
        ];
        return locations[(id - 1) % locations.length] || `エリア${id}`;
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

    createIconGrid(icons) {
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
            'warning': '#e07b00',
            'error': '#dc3545',
            'offline': '#6c757d'
        };
        return colors[status] || '#dee2e6';
    }






    // 外部からアクセス可能なメソッド
    refreshData() {
        this.generateGateData();
        this.generateGateGroups();
        this.renderGateButtons();
        this.renderGates();
    }

    setRefreshInterval(interval) {
        this.refreshInterval = interval;
    }

    getStatusText(gate) {
        if (!gate.online) return 'オフライン';
        const map = { normal: '正常', warning: '警告', error: '異常', offline: 'オフライン' };
        return map[gate.status] || '不明';
    }

    formatDateTime(date) {
        if (!date) return '-';
        const d = new Date(date);
        return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
    }

    getGateDisplayName(gate) {
        return `ゲート${gate.name}(${gate.number})`;
    }

    showRemoteControl(gate) {
        this.currentGateId = gate.number;
        this.showRemoteControlModal(gate);
    }

    showActionModal(gate) {
        const existingModal = document.getElementById('actionSelectModal');
        if (existingModal) existingModal.remove();

        const safeDisplayName = common.escapeHtml(this.getGateDisplayName(gate));

        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'actionSelectModal';
        modal.tabIndex = -1;
        modal.setAttribute('aria-hidden', 'true');

        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header py-2">
                        <h6 class="modal-title mb-0">操作選択 - ${safeDisplayName}</h6>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <button type="button" class="btn btn-outline-secondary w-100 mb-2" id="openRemoteControlBtn">遠隔操作</button>
                        <button type="button" class="btn btn-outline-secondary w-100" id="openHistorySettingsBtn">報告書</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);

        modal.querySelector('#openRemoteControlBtn').addEventListener('click', () => {
            modal.addEventListener('hidden.bs.modal', () => this.showRemoteControlModal(gate), { once: true });
            bootstrapModal.hide();
        });

        modal.querySelector('#openHistorySettingsBtn').addEventListener('click', () => {
            modal.addEventListener('hidden.bs.modal', () => this.showHistorySettingsModal(gate), { once: true });
            bootstrapModal.hide();
        });

        bootstrapModal.show();
        modal.addEventListener('hidden.bs.modal', function () { modal.remove(); });
    }

    showRemoteControlModal(gate) {
        const existingModal = document.getElementById('remoteControlModal');
        if (existingModal) existingModal.remove();

        const safeDisplayName = common.escapeHtml(this.getGateDisplayName(gate));
        const statusText = common.escapeHtml(this.getStatusText(gate));
        const lastUpdated = common.escapeHtml(this.formatDateTime(gate.lastUpdated));

        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'remoteControlModal';
        modal.tabIndex = -1;
        modal.setAttribute('aria-hidden', 'true');

        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header py-2">
                        <h6 class="modal-title mb-0">遠隔操作 - ${safeDisplayName}</h6>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row g-3">
                            <div class="col-5">
                                <div class="mb-3">
                                    <div class="fw-bold small mb-1">現在状態</div>
                                    <div>${statusText}</div>
                                </div>
                                <div>
                                    <div class="fw-bold small mb-1">最終更新</div>
                                    <div class="small">${lastUpdated}</div>
                                </div>
                            </div>
                            <div class="col-7">
                                <div class="fw-bold small mb-2">遠隔操作 <span class="text-muted" style="font-size: 0.85em;">※複数選択不可</span></div>
                                <div class="form-check mb-1">
                                    <input class="form-check-input" type="radio" name="remoteOperation" value="continuous_unlock" id="op1">
                                    <label class="form-check-label small" for="op1">連続解錠</label>
                                </div>
                                <div class="form-check mb-1">
                                    <input class="form-check-input" type="radio" name="remoteOperation" value="unlock" id="op2">
                                    <label class="form-check-label small" for="op2">解錠</label>
                                </div>
                                <div class="form-check mb-1">
                                    <input class="form-check-input" type="radio" name="remoteOperation" value="lock" id="op3">
                                    <label class="form-check-label small" for="op3">施錠</label>
                                </div>
                                <div class="form-check mb-1">
                                    <input class="form-check-input" type="radio" name="remoteOperation" value="security_set" id="op4">
                                    <label class="form-check-label small" for="op4">警備セット</label>
                                </div>
                                <div class="form-check mb-1">
                                    <input class="form-check-input" type="radio" name="remoteOperation" value="security_release" id="op5">
                                    <label class="form-check-label small" for="op5">警備セット解除</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer py-2">
                        <button type="button" class="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1" data-bs-dismiss="modal"><span class="material-symbols-outlined" style="font-size:18px">cancel</span> 中止</button>
                        <button type="button" class="btn btn-outline-success btn-sm d-inline-flex align-items-center gap-1" id="executeRemoteBtn"><span class="material-symbols-outlined" style="font-size:18px">play_arrow</span> 実行</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.querySelector('#executeRemoteBtn').addEventListener('click', () => {
            this.executeRemoteOperation(gate.number);
        });
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        modal.addEventListener('hidden.bs.modal', function () { modal.remove(); });
    }

    showHistorySettingsModal(gateInfo) {
        let gate = typeof gateInfo === 'object' ? gateInfo : this.gates.find(g => g.number === gateInfo || g.id === gateInfo);
        if (!gate) return;

        const existingModal = document.getElementById('historySettingsModal');
        if (existingModal) existingModal.remove();

        const safeDisplayName = common.escapeHtml(this.getGateDisplayName(gate));

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
                            <i class="fas fa-history text-info me-2"></i>履歴表示設定 - ${safeDisplayName}
                        </h6>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info py-2 mb-3" style="font-size: 0.9em;">
                            ${safeDisplayName}の報告書を抽出します。
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
                                    <input class="form-check-input" type="radio" name="histType" id="t1" value="all" checked>
                                    <label class="form-check-label" for="t1">全て</label>
                                </div>
                                <div class="form-check small">
                                    <input class="form-check-input" type="radio" name="histType" id="t2" value="normal">
                                    <label class="form-check-label" for="t2">正常データのみ</label>
                                </div>
                                <div class="form-check small">
                                    <input class="form-check-input" type="radio" name="histType" id="t3" value="warning">
                                    <label class="form-check-label" for="t3">軽エラーデータのみ</label>
                                </div>
                                <div class="form-check small">
                                    <input class="form-check-input" type="radio" name="histType" id="t4" value="error">
                                    <label class="form-check-label" for="t4">重エラーデータのみ</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer py-2">
                        <button type="button" class="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1" data-bs-dismiss="modal"><span class="material-symbols-outlined" style="font-size:18px">cancel</span> 中止</button>
                        <button type="button" class="btn btn-outline-success btn-sm d-inline-flex align-items-center gap-1" id="navigateReportBtn"><span class="material-symbols-outlined" style="font-size:18px">play_arrow</span> 実行</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.querySelector('#navigateReportBtn').addEventListener('click', () => {
            // モーダルから選択値を読み取り
            var periodRadio = modal.querySelector('input[name="histPeriod"]:checked');
            var period = periodRadio ? periodRadio.value : '1day';
            var typeRadio = modal.querySelector('input[name="histType"]:checked');
            var dataType = typeRadio ? typeRadio.value : 'all';

            // URLパラメータで報告書画面に遷移
            var params = new URLSearchParams();
            params.set('gate', gate.number);
            params.set('period', period);
            params.set('dataType', dataType);
            // Preview環境対応: -preview.html内ならプレビューURLへ遷移
            var basePath = window.location.pathname.includes('-preview.html')
                ? '/resources/historyReport-preview.html'
                : '/historyReport';
            window.location.href = basePath + '?' + params.toString();
        });
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
        alert(`ゲート${gateNumber}に「${operationName}」を実行します`);

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
                gate.online = Math.random() > 0.05;
                gate.icons = this.generateIconStatuses();
                gate.status = this.determineFrameStatus(gate);
                gate.lastUpdated = new Date();
            }
        }
        this.gateGroups.forEach(group => group.status = this.getGroupStatus(group.range));
        this.renderGateButtons();
        this.renderGates();
    }

    handleResize() {
        this.scheduleGridLayoutUpdate();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.statusMonitor = new StatusMonitor();
});
