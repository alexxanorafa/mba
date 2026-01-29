// main.js - UI MANAGER OTIMIZADO
// ============================================================
// VERSÃO 2.0: Delegação de eventos, UI dinâmica, integração completa
// ============================================================

import { GameEngine, GAME_PHASES, ACTION_TYPES } from './game.js';

// ============================================================
// SUGESTÃO 4: UI DINÂMICA (Estados visuais responsivos)
// ============================================================
const UI_STATES = {
    LOADING: 'loading',
    TEAM_SELECTION: 'team_selection',
    DASHBOARD: 'dashboard',
    GAME_VIEW: 'game_view',
    ROSTER: 'roster',
    MARKET: 'market'
};

class UIManager {
    constructor() {
        this.engine = null;
        this.currentView = UI_STATES.LOADING;
        this.autoSimulationInterval = null;
        this.selectedConference = 'EAST';
        this.feedFilter = 'all';
        this.currentDay = 1;
        this.elements = {};
        this.listeners = new Map();
    }

    // ============================================================
    // INICIALIZAÇÃO
    // ============================================================
    async init() {
        console.log('[UI] Inicializando...');
        
        this.cacheElements();
        this.setupEventDelegation();
        
        try {
            const gameData = await this.loadGameData();
            this.engine = new GameEngine(gameData);
            
            if (!this.engine.init(gameData)) {
                throw new Error('Falha ao inicializar motor do jogo');
            }

            await this.simulateLoading();
            this.switchView(UI_STATES.TEAM_SELECTION);
            this.log('Sistema MBA 2.0 carregado com sucesso', 'success');
            
        } catch (error) {
            console.error('[UI] Erro fatal:', error);
            this.log(`Erro fatal: ${error.message}`, 'error');
        }
    }

    cacheElements() {
        this.elements = {
            // Containers principais
            loadingScreen: document.getElementById('loading-screen'),
            app: document.getElementById('app'),
            
            // Header
            phaseText: document.getElementById('game-phase-text'),
            dayText: document.getElementById('current-day-text'),
            userTeamCompact: document.getElementById('user-team-compact'),
            userTeamNameCompact: document.getElementById('user-team-name-compact'),
            userTeamRecord: document.getElementById('user-team-record'),
            userReputationHeader: document.getElementById('user-reputation-header'),
            userChemistryHeader: document.getElementById('user-chemistry-header'),
            
            // Views
            viewTeamSelection: document.getElementById('view-team-selection'),
            viewDashboard: document.getElementById('view-dashboard'),
            
            // Dashboard components
            liveGamesContainer: document.getElementById('live-games-container'),
            liveFeedContainer: document.getElementById('live-feed-container'),
            standingsContainer: document.getElementById('standings-container'),
            teamStatsContainer: document.getElementById('team-stats-container'),
            upcomingGamesContainer: document.getElementById('upcoming-games-container'),
            chemistryValue: document.getElementById('chemistry-value'),
            chemistryFill: document.getElementById('chemistry-fill'),
            developmentContainer: document.getElementById('development-container'),
            currentDayDisplay: document.getElementById('current-day-display'),
            
            // Console
            consoleOutput: document.getElementById('console-output'),
            
            // Modals
            modalOverlay: document.getElementById('modal-overlay'),
            teamSelectionModal: document.getElementById('team-selection-modal'),
            gameDetailsModal: document.getElementById('game-details-modal'),
            rosterManagementModal: document.getElementById('roster-management-modal')
        };
    }

    // ============================================================
    // SUGESTÃO 4: DELEGAÇÃO DE EVENTOS (Performance++)
    // ============================================================
    setupEventDelegation() {
        // Delegação global no documento
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (target) {
                e.preventDefault();
                const action = target.dataset.action;
                const payload = target.dataset.payload ? JSON.parse(target.dataset.payload) : {};
                this.handleAction(action, payload, target);
            }

            // Speed buttons
            if (e.target.closest('.speed-btn')) {
                const btn = e.target.closest('.speed-btn');
                const speed = parseInt(btn.dataset.speed);
                this.setSimulationSpeed(speed);
                document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }

            // Conference tabs
            if (e.target.closest('.conf-tab')) {
                const btn = e.target.closest('.conf-tab');
                const conf = btn.dataset.conf;
                this.selectedConference = conf;
                document.querySelectorAll('.conf-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderStandings();
            }

            // Feed filters
            if (e.target.closest('.feed-filter')) {
                const btn = e.target.closest('.feed-filter');
                const filter = btn.dataset.filter;
                this.feedFilter = filter;
                document.querySelectorAll('.feed-filter').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderLiveFeed();
            }

            // Modal close
            if (e.target.closest('.modal-close') || e.target.closest('.modal-overlay')) {
                this.closeAllModals();
            }

            // Team selection
            if (e.target.closest('.team-option')) {
                const teamCard = e.target.closest('.team-option');
                const teamId = parseInt(teamCard.dataset.teamId);
                this.selectTeam(teamId);
            }

            // Game card
            if (e.target.closest('.game-card')) {
                const gameCard = e.target.closest('.game-card');
                const gameData = JSON.parse(gameCard.dataset.game || '{}');
                if (gameData.homeTeamId) {
                    this.showGameDetails(gameData);
                }
            }
        });

        // Botões especiais
        const btnSimulateDay = document.getElementById('btn-simulate-day');
        const btnAutoToggle = document.getElementById('btn-auto-toggle');
        const btnPrevDay = document.getElementById('btn-prev-day');
        const btnNextDay = document.getElementById('btn-next-day');

        if (btnSimulateDay) {
            btnSimulateDay.addEventListener('click', () => {
                this.simulateDay();
            });
        }

        if (btnAutoToggle) {
            btnAutoToggle.addEventListener('click', () => this.toggleAutoSimulation());
        }

        if (btnPrevDay) {
            btnPrevDay.addEventListener('click', () => this.changeDay(-1));
        }

        if (btnNextDay) {
            btnNextDay.addEventListener('click', () => this.changeDay(1));
        }
    }

    handleAction(action, payload, element) {
        console.log('[UI] Action:', action, payload);

        const actionMap = {
            'view-roster': () => this.showRosterManagement(),
            'view-schedule': () => this.showSchedule(),
            'view-history': () => this.showHistory(),
            'free-agents': () => this.showFreeAgents(),
            'trades': () => this.showTrades(),
            'draft': () => this.showDraft(),
            'save-game': () => this.saveGame(),
            'load-game': () => this.loadGame(),
            'settings': () => this.showSettings(),
            'play-game': () => this.playGame(payload),
            'train-player': () => this.trainPlayer(payload),
            'sign-free-agent': () => this.signFreeAgent(payload)
        };

        const handler = actionMap[action];
        if (handler) {
            handler();
        } else {
            console.warn('[UI] Ação desconhecida:', action);
        }
    }

    // ============================================================
    // LOADING
    // ============================================================
    async loadGameData() {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error('Falha ao carregar data.json');
        }
        return await response.json();
    }

    async simulateLoading() {
        const steps = [
            { progress: 20, message: 'Carregando mitologias...' },
            { progress: 40, message: 'Criando equipas...' },
            { progress: 60, message: 'Gerando calendário...' },
            { progress: 80, message: 'Inicializando sistemas...' },
            { progress: 100, message: 'Preparando interface...' }
        ];

        for (const step of steps) {
            await new Promise(resolve => setTimeout(resolve, 300));
            this.updateLoadingProgress(step.progress, step.message);
        }

        await new Promise(resolve => setTimeout(resolve, 500));
    }

    updateLoadingProgress(progress, message) {
        const progressFill = document.getElementById('progress-fill');
        const loadingMessage = document.getElementById('loading-message');

        if (progressFill) progressFill.style.width = `${progress}%`;
        if (loadingMessage) loadingMessage.textContent = message;
    }

    // ============================================================
    // SUGESTÃO 4: TRANSIÇÕES DE VIEW (UI Dinâmica)
    // ============================================================
    switchView(viewName) {
        console.log('[UI] Switch view:', viewName);
        this.currentView = viewName;

        // Hide all views
        Object.values(this.elements).forEach(el => {
            if (el && el.classList && el.classList.contains('content-view')) {
                el.style.display = 'none';
            }
        });

        // Show target view
        switch (viewName) {
            case UI_STATES.LOADING:
                if (this.elements.loadingScreen) {
                    this.elements.loadingScreen.classList.remove('hidden');
                }
                if (this.elements.app) {
                    this.elements.app.classList.add('hidden');
                }
                break;

            case UI_STATES.TEAM_SELECTION:
                if (this.elements.loadingScreen) {
                    this.elements.loadingScreen.classList.add('hidden');
                }
                if (this.elements.app) {
                    this.elements.app.classList.remove('hidden');
                }
                if (this.elements.viewTeamSelection) {
                    this.elements.viewTeamSelection.style.display = 'block';
                }
                this.renderTeamSelection();
                break;

            case UI_STATES.DASHBOARD:
                if (this.elements.viewDashboard) {
                    this.elements.viewDashboard.style.display = 'block';
                }
                this.renderDashboard();
                break;
        }
    }

    // ============================================================
    // TEAM SELECTION
    // ============================================================
    renderTeamSelection() {
        const container = document.getElementById('team-selection-container');
        if (!container) return;

        const state = this.engine.getState();
        const teams = state.teams;

        const html = `
            <div class="team-selection-wrapper">
                <div class="selection-header">
                    <h1>🏀 Escolha Sua Equipa Mitológica</h1>
                    <p>Assuma o comando de uma das 12 equipas lendárias e leve-a à glória!</p>
                </div>
                
                <div class="team-filters">
                    <button class="filter-btn active" data-filter="all">Todas</button>
                    <button class="filter-btn" data-filter="EAST">Eastern Conference</button>
                    <button class="filter-btn" data-filter="WEST">Western Conference</button>
                </div>

                <div class="teams-grid">
                    ${teams.map(team => this.createTeamCard(team)).join('')}
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Filter buttons
        container.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const filter = btn.dataset.filter;
                const teamCards = container.querySelectorAll('.team-option');
                
                teamCards.forEach(card => {
                    const conf = card.dataset.conference;
                    if (filter === 'all' || conf === filter) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }

    createTeamCard(team) {
        const power = this.engine.calculateTeamPower(team);
        const powerColor = power >= 75 ? '#06d6a0' : power >= 65 ? '#ffd166' : '#8a8aa8';
        
        // SUGESTÃO 5: Emoji do arquétipo dominante
        const emoji = this.getArchetypeEmoji(team.dominantArchetype);

        return `
            <div class="team-option" data-team-id="${team.id}" data-conference="${team.conference}">
                <div class="team-card-header">
                    <div class="team-icon">${emoji}</div>
                    <div class="team-power-badge" style="background: ${powerColor}">
                        ${power.toFixed(1)}
                    </div>
                </div>
                
                <div class="team-card-body">
                    <h3 class="team-name">${team.name}</h3>
                    <div class="team-meta">
                        <span class="team-mythology">📜 ${team.mythology}</span>
                        <span class="team-conference">${team.conference === 'EAST' ? '🧭 East' : '🧭 West'}</span>
                    </div>
                    <p class="team-style">${team.style}</p>
                    <div class="team-archetype">
                        <span class="archetype-badge">${emoji} ${team.dominantArchetype}</span>
                    </div>
                </div>
                
                <div class="team-card-footer">
                    <div class="team-roster-preview">
                        <span class="roster-count">👥 ${team.players.length} jogadores</span>
                    </div>
                    <button class="btn-select-team" data-team-id="${team.id}">
                        <i class="fas fa-check"></i> Selecionar
                    </button>
                </div>
            </div>
        `;
    }

    getArchetypeEmoji(archetype) {
        const emojis = {
            'Força': '💪', 'Sabedoria': '🧠', 'Velocidade': '⚡', 'Magia': '✨',
            'Proteção': '🛡️', 'Natureza': '🌿', 'Luz': '☀️', 'Sombra': '🌑',
            'Ordem': '📐', 'Fogo': '🔥', 'Caos': '💫'
        };
        return emojis[archetype] || '⭐';
    }

    selectTeam(teamId) {
        const result = this.engine.dispatch({
            type: ACTION_TYPES.SELECT_TEAM,
            payload: { teamId, userName: 'Coach' }
        });

        if (result.success) {
            this.log(`✅ Assumiu comando de ${result.team.name}!`, 'success');
            this.switchView(UI_STATES.DASHBOARD);
        } else {
            this.log(`❌ Erro ao selecionar equipa: ${result.error}`, 'error');
        }
    }

    // ============================================================
    // DASHBOARD
    // ============================================================
    renderDashboard() {
        this.updateHeader();
        this.renderLiveGames();
        this.renderLiveFeed();
        this.renderStandings();
        this.renderTeamStats();
        this.renderUpcomingGames();
        this.renderChemistry();
        this.renderDevelopment();
    }

    updateHeader() {
        const state = this.engine.getState();
        
        if (this.elements.phaseText) {
            const phaseNames = {
                [GAME_PHASES.REGULAR_SEASON]: 'Temporada Regular',
                [GAME_PHASES.PLAYOFFS]: 'Playoffs',
                [GAME_PHASES.FINALS]: 'Finais',
                [GAME_PHASES.OFFSEASON]: 'Off-Season'
            };
            this.elements.phaseText.textContent = phaseNames[state.phase] || state.phase;
        }

        if (this.elements.dayText) {
            this.elements.dayText.textContent = `Dia ${state.currentDay}/${state.totalDays}`;
        }

        if (state.playerTeamId && this.elements.userTeamCompact) {
            const team = this.engine.getUserTeamInfo();
            if (team) {
                this.elements.userTeamCompact.style.display = 'flex';
                this.elements.userTeamNameCompact.textContent = team.name;
                this.elements.userTeamRecord.textContent = `${team.stats.wins}-${team.stats.losses}`;
            }
        }

        if (this.elements.userReputationHeader) {
            this.elements.userReputationHeader.textContent = Math.round(state.userReputation);
        }

        if (this.elements.userChemistryHeader) {
            this.elements.userChemistryHeader.textContent = Math.round(state.teamChemistry);
        }

        if (this.elements.currentDayDisplay) {
            this.elements.currentDayDisplay.textContent = `Dia ${state.currentDay}`;
        }
    }

    renderLiveGames() {
        if (!this.elements.liveGamesContainer) return;

        const { live, completed } = this.engine.getLiveGames();

        if (live.length === 0 && completed.length === 0) {
            this.elements.liveGamesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <p>Nenhum jogo hoje</p>
                </div>
            `;
            return;
        }

        const html = `
            ${live.map(game => this.createLiveGameCard(game)).join('')}
            ${completed.map(game => this.createCompletedGameCard(game)).join('')}
        `;

        this.elements.liveGamesContainer.innerHTML = html;
    }

    createLiveGameCard(game) {
        const userGame = game.isUserGame ? 'user-game' : '';
        const gameData = JSON.stringify({
            homeTeamId: game.homeTeam.id,
            awayTeamId: game.awayTeam.id
        });

        return `
            <div class="game-card live-game ${userGame}" data-game='${gameData}'>
                <div class="game-status">
                    <span class="status-badge live">🔴 AO VIVO</span>
                    <span class="game-time">${game.time}</span>
                </div>
                <div class="game-matchup">
                    <div class="team">
                        <span class="team-emoji">${this.getArchetypeEmoji(game.awayTeam.dominantArchetype)}</span>
                        <span class="team-name">${game.awayTeam.name}</span>
                        <span class="team-power">${this.engine.calculateTeamPower(game.awayTeam).toFixed(1)}</span>
                    </div>
                    <div class="vs">VS</div>
                    <div class="team">
                        <span class="team-emoji">${this.getArchetypeEmoji(game.homeTeam.dominantArchetype)}</span>
                        <span class="team-name">${game.homeTeam.name}</span>
                        <span class="team-power">${this.engine.calculateTeamPower(game.homeTeam, true).toFixed(1)}</span>
                    </div>
                </div>
                ${game.isUserGame ? '<button class="btn-play-game" data-action="play-game" data-payload=\''+gameData+'\'>⚡ JOGAR</button>' : ''}
            </div>
        `;
    }

    createCompletedGameCard(game) {
        const homeWin = game.result.homeScore > game.result.awayScore;

        return `
            <div class="game-card completed-game">
                <div class="game-status">
                    <span class="status-badge completed">✅ FINAL</span>
                </div>
                <div class="game-matchup">
                    <div class="team ${!homeWin ? 'winner' : ''}">
                        <span class="team-emoji">${this.getArchetypeEmoji(game.awayTeam.dominantArchetype)}</span>
                        <span class="team-name">${game.awayTeam.name}</span>
                        <span class="team-score ${!homeWin ? 'winning-score' : ''}">${game.result.awayScore}</span>
                    </div>
                    <div class="vs">-</div>
                    <div class="team ${homeWin ? 'winner' : ''}">
                        <span class="team-emoji">${this.getArchetypeEmoji(game.homeTeam.dominantArchetype)}</span>
                        <span class="team-name">${game.homeTeam.name}</span>
                        <span class="team-score ${homeWin ? 'winning-score' : ''}">${game.result.homeScore}</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderLiveFeed() {
        if (!this.elements.liveFeedContainer) return;

        const state = this.engine.getState();
        let feed = state.liveFeed.slice(0, 50);

        if (this.feedFilter === 'user' && state.playerTeamId) {
            const userTeam = this.engine.getUserTeamInfo();
            feed = feed.filter(entry => entry.text.includes(userTeam.name));
        }

        if (feed.length === 0) {
            this.elements.liveFeedContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>Nenhuma atividade recente</p>
                </div>
            `;
            return;
        }

        const html = feed.map(entry => `
            <div class="feed-entry ${entry.type || 'info'}">
                <div class="feed-icon">${this.getFeedIcon(entry.type)}</div>
                <div class="feed-content">
                    <p>${entry.text}</p>
                    <span class="feed-time">${this.formatTimestamp(entry.timestamp)}</span>
                </div>
            </div>
        `).join('');

        this.elements.liveFeedContainer.innerHTML = html;
        this.elements.liveFeedContainer.scrollTop = 0;
    }

    getFeedIcon(type) {
        const icons = {
            'game_result': '🏀',
            'playoffs': '🏆',
            'teamselection': '📋',
            'transaction': '💼',
            'injury': '🚑',
            'achievement': '⭐',
            'trade': '🔄'
        };
        return icons[type] || 'ℹ️';
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d atrás`;
        if (hours > 0) return `${hours}h atrás`;
        if (minutes > 0) return `${minutes}m atrás`;
        return 'Agora';
    }

    renderStandings() {
        if (!this.elements.standingsContainer) return;

        const standings = this.engine.getStandings();
        const confStandings = standings[this.selectedConference];

        if (!confStandings || confStandings.length === 0) {
            this.elements.standingsContainer.innerHTML = '<p>Nenhuma classificação disponível</p>';
            return;
        }

        const html = `
            <table class="standings-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Equipa</th>
                        <th>V</th>
                        <th>D</th>
                        <th>PCT</th>
                        <th>Streak</th>
                    </tr>
                </thead>
                <tbody>
                    ${confStandings.map(team => `
                        <tr class="${team.id === this.engine.getState().playerTeamId ? 'user-team-row' : ''}">
                            <td>${team.rank}</td>
                            <td>
                                <div class="team-cell">
                                    <span class="team-emoji">${this.getArchetypeEmoji(team.mythology)}</span>
                                    <span>${team.name}</span>
                                </div>
                            </td>
                            <td>${team.wins}</td>
                            <td>${team.losses}</td>
                            <td>${team.pct}</td>
                            <td class="${team.streak > 0 ? 'positive' : team.streak < 0 ? 'negative' : ''}">
                                ${team.streak > 0 ? 'V' : 'D'}${Math.abs(team.streak)}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        this.elements.standingsContainer.innerHTML = html;
    }

    renderTeamStats() {
        if (!this.elements.teamStatsContainer) return;

        const userTeam = this.engine.getUserTeamInfo();
        if (!userTeam) {
            this.elements.teamStatsContainer.innerHTML = '<p>Selecione uma equipa primeiro</p>';
            return;
        }

        const stats = userTeam.stats;
        const avgPointsFor = stats.games > 0 ? (stats.pointsFor / stats.games).toFixed(1) : 0;
        const avgPointsAgainst = stats.games > 0 ? (stats.pointsAgainst / stats.games).toFixed(1) : 0;

        const html = `
            <div class="stat-card">
                <div class="stat-icon">🎯</div>
                <div class="stat-details">
                    <span class="stat-label">Pontos/Jogo</span>
                    <span class="stat-value">${avgPointsFor}</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🛡️</div>
                <div class="stat-details">
                    <span class="stat-label">Def/Jogo</span>
                    <span class="stat-value">${avgPointsAgainst}</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🏠</div>
                <div class="stat-details">
                    <span class="stat-label">Casa</span>
                    <span class="stat-value">${stats.homeWins} vitórias</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">✈️</div>
                <div class="stat-details">
                    <span class="stat-label">Fora</span>
                    <span class="stat-value">${stats.awayWins} vitórias</span>
                </div>
            </div>
        `;

        this.elements.teamStatsContainer.innerHTML = html;
    }

    renderUpcomingGames() {
        if (!this.elements.upcomingGamesContainer) return;

        const state = this.engine.getState();
        if (!state.playerTeamId) {
            this.elements.upcomingGamesContainer.innerHTML = '<p>Selecione uma equipa</p>';
            return;
        }

        const upcoming = this.engine.getUpcomingGames(state.playerTeamId, 5);

        if (upcoming.length === 0) {
            this.elements.upcomingGamesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-check"></i>
                    <p>Sem jogos agendados</p>
                </div>
            `;
            return;
        }

        const html = upcoming.map(game => `
            <div class="upcoming-game-item">
                <div class="upcoming-day">
                    <span class="day-label">Dia</span>
                    <span class="day-number">${game.day}</span>
                </div>
                <div class="upcoming-details">
                    <div class="opponent-name">
                        <span class="location-badge ${game.isHome ? 'home' : 'away'}">
                            ${game.isHome ? '🏠' : '✈️'}
                        </span>
                        ${game.opponentName}
                    </div>
                    <div class="game-time">${game.time}</div>
                </div>
            </div>
        `).join('');

        this.elements.upcomingGamesContainer.innerHTML = html;

        const upcomingCount = document.getElementById('upcoming-count');
        if (upcomingCount) {
            upcomingCount.textContent = upcoming.length;
        }
    }

    renderChemistry() {
        const state = this.engine.getState();
        const chemistry = state.teamChemistry;

        if (this.elements.chemistryValue) {
            this.elements.chemistryValue.textContent = Math.round(chemistry);
        }

        if (this.elements.chemistryFill) {
            this.elements.chemistryFill.style.width = `${chemistry}%`;
            
            // Cor dinâmica baseada no valor
            let color;
            if (chemistry >= 80) color = 'linear-gradient(90deg, #06d6a0, #0af7b6)';
            else if (chemistry >= 60) color = 'linear-gradient(90deg, #4a1e8c, #06d6a0)';
            else if (chemistry >= 40) color = 'linear-gradient(90deg, #ffd166, #ffde8a)';
            else color = 'linear-gradient(90deg, #ef476f, #f77)';
            
            this.elements.chemistryFill.style.background = color;
        }
    }

    renderDevelopment() {
        if (!this.elements.developmentContainer) return;

        const userTeam = this.engine.getUserTeamInfo();
        if (!userTeam) {
            this.elements.developmentContainer.innerHTML = '<p>Selecione uma equipa</p>';
            return;
        }

        const topPlayers = userTeam.roster.players
            .sort((a, b) => b.power - a.power)
            .slice(0, 3);

        const html = topPlayers.map(player => `
            <div class="dev-player-card">
                <div class="dev-player-info">
                    <span class="player-emoji">${this.getArchetypeEmoji(player.archetype)}</span>
                    <div>
                        <div class="player-name">${player.name}</div>
                        <div class="player-position">${player.position}</div>
                    </div>
                </div>
                <div class="dev-player-stats">
                    <div class="stat-mini">
                        <span class="stat-label">Rating</span>
                        <span class="stat-value">${player.rating.toFixed(0)}</span>
                    </div>
                    <div class="stat-mini">
                        <span class="stat-label">Energia</span>
                        <span class="stat-value">${Math.round(player.energy)}%</span>
                    </div>
                </div>
            </div>
        `).join('');

        this.elements.developmentContainer.innerHTML = html;
    }

    // ============================================================
    // SIMULAÇÃO (CORREÇÃO PRINCIPAL - SEM POP-UPS)
    // ============================================================
    simulateDay() {
        const result = this.engine.dispatch({
            type: ACTION_TYPES.SIMULATE_DAY
        });

        if (result.success) {
            if (result.userGame) {
                // CORREÇÃO: APENAS pausar simulação, NÃO mostrar pop-up
                this.stopAutoSimulation();
                this.engine.state.autoSimulate = false;
                
                // Atualizar botão de auto-simulação
                const autoBtn = document.getElementById('btn-auto-toggle');
                if (autoBtn) autoBtn.classList.remove('active');
                
                // Mostrar indicador visual (não bloqueante)
                this.showGameIndicator(result.userGame);
                
                // Log apenas
                this.log(`⏸️ JOGO PENDENTE: Sua equipa joga hoje!`, 'warning');
                
                return result;
            } else {
                // Sem jogo do utilizador - continuar normal
                this.engine.state.currentDay++;
                this.log(`✅ Dia ${result.day} simulado`, 'success');
                this.renderDashboard();
            }

            // Verificar conquistas
            if (result.newAchievements && result.newAchievements.length > 0) {
                result.newAchievements.forEach(achievement => {
                    this.showAchievementNotification(achievement);
                });
            }
        } else {
            this.log(`❌ ${result.error}`, 'error');
        }
        
        return result;
    }

    // CORREÇÃO: Substituir showGamePrompt por indicador visual
    showGamePrompt(gameData) {
        // Esta função agora não faz NADA - evita pop-ups
        console.log('Jogo do utilizador detectado, simulação pausada');
        return;
    }

    // Novo método: Mostrar indicador visual de jogo pendente
    showGameIndicator(gameData) {
        // Remover indicador anterior se existir
        this.removeGameIndicator();
        
        // Criar indicador não bloqueante
        const indicator = document.createElement('div');
        indicator.id = 'game-pending-indicator';
        indicator.className = 'game-pending-indicator';
        
        const homeTeam = this.engine.getState().teams.find(t => t.id === gameData.homeTeamId);
        const awayTeam = this.engine.getState().teams.find(t => t.id === gameData.awayTeamId);
        const userIsHome = gameData.homeTeamId === this.engine.getState().playerTeamId;
        const userTeam = userIsHome ? homeTeam : awayTeam;
        const opponent = userIsHome ? awayTeam : homeTeam;
        
        indicator.innerHTML = `
            <div class="indicator-content">
                <div class="indicator-header">
                    <span class="indicator-icon">⚠️</span>
                    <h4>JOGO PENDENTE</h4>
                    <button class="indicator-close">&times;</button>
                </div>
                <div class="indicator-body">
                    <div class="matchup-info">
                        <span class="team-name user-team">${userTeam.name}</span>
                        <span class="vs">VS</span>
                        <span class="team-name opponent">${opponent.name}</span>
                    </div>
                    <p class="indicator-message">
                        Prepare sua equipa usando os menus. Quando estiver pronto, clique em "Jogar".
                    </p>
                    <div class="indicator-actions">
                        <button class="btn-indicator-action" id="btn-play-pending-game">
                            ⚡ Jogar Agora
                        </button>
                        <button class="btn-indicator-action secondary" id="btn-simulate-pending-game">
                            🤖 Simular Automaticamente
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Adicionar ao DOM
        document.body.appendChild(indicator);
        
        // Event listeners
        indicator.querySelector('.indicator-close').addEventListener('click', () => {
            this.removeGameIndicator();
        });
        
        indicator.querySelector('#btn-play-pending-game').addEventListener('click', () => {
            this.playGame(gameData);
            this.removeGameIndicator();
        });
        
        indicator.querySelector('#btn-simulate-pending-game').addEventListener('click', () => {
            this.simulatePendingGame(gameData);
            this.removeGameIndicator();
        });
        
        // Auto-remover após 1 minuto (opcional)
        setTimeout(() => {
            this.removeGameIndicator();
        }, 60000);
    }
    
    removeGameIndicator() {
        const indicator = document.getElementById('game-pending-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    simulatePendingGame(gameData) {
        // Simular automaticamente sem intervenção do utilizador
        const result = this.engine.simulateDetailedGame(gameData);
        
        if (result.success) {
            // Atualizar o jogo no calendário
            const game = this.engine.state.schedule
                .find(d => d.day === this.engine.state.currentDay)
                ?.games.find(g => g.homeTeamId === gameData.homeTeamId && g.awayTeamId === gameData.awayTeamId);

            if (game) {
                game.played = true;
                game.result = result.result;
            }

            // Avançar dia
            this.engine.state.currentDay++;
            
            // Log do resultado
            this.log(`🤖 Jogo simulado: ${result.homeTeam.name} ${result.result.homeScore} - ${result.result.awayScore} ${result.awayTeam.name}`, 'info');
            
            // Renderizar dashboard atualizado
            this.renderDashboard();
            
            // Retomar simulação automática (se estava ativa)
            if (this.engine.state.autoSimulate) {
                this.startAutoSimulation();
            }
        }
    }

    playGame(gameData) {
        const result = this.engine.dispatch({
            type: ACTION_TYPES.PLAYER_GAME,
            payload: { gameData }
        });

        if (result.success) {
            this.showGameResult(result);
            
            // Avançar dia
            this.engine.state.currentDay++;
            
            // Renderizar dashboard atualizado
            this.renderDashboard();
            
            // Retomar simulação automática (se estava ativa)
            if (this.engine.state.autoSimulate) {
                this.startAutoSimulation();
            }
        } else {
            this.log(`❌ Erro no jogo: ${result.error}`, 'error');
        }
    }

    showGameResult(result) {
        const homeTeam = result.homeTeam;
        const awayTeam = result.awayTeam;
        const gameResult = result.result;

        const winner = gameResult.winner === 'home' ? homeTeam.name : awayTeam.name;
        const margin = gameResult.margin;

        // Mostrar resultado de forma não bloqueante
        this.log(`🏀 RESULTADO: ${homeTeam.name} ${gameResult.homeScore} - ${gameResult.awayScore} ${awayTeam.name} | Vencedor: ${winner} (${margin} pts)`, 'success');
        
        // Opcional: mostrar notificação visual
        this.showResultNotification(result);
    }
    
    showResultNotification(result) {
        const notification = document.createElement('div');
        notification.className = 'result-notification';
        notification.innerHTML = `
            <div class="result-content">
                <h4>🏀 Resultado do Jogo</h4>
                <div class="result-score">
                    <span class="team">${result.homeTeam.name}</span>
                    <span class="score">${result.result.homeScore}</span>
                    <span class="separator">-</span>
                    <span class="score">${result.result.awayScore}</span>
                    <span class="team">${result.awayTeam.name}</span>
                </div>
                <p>Vencedor: <strong>${result.result.winner === 'home' ? result.homeTeam.name : result.awayTeam.name}</strong></p>
                <button class="result-close">OK</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
        
        notification.querySelector('.result-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    setSimulationSpeed(speed) {
        this.engine.dispatch({
            type: ACTION_TYPES.SET_SPEED,
            payload: { speed }
        });
        this.log(`⚡ Velocidade alterada para ${speed}x`, 'info');
    }

    toggleAutoSimulation() {
        const result = this.engine.dispatch({
            type: ACTION_TYPES.TOGGLE_AUTO
        });

        const btn = document.getElementById('btn-auto-toggle');
        if (result.autoSimulate) {
            btn.classList.add('active');
            this.startAutoSimulation();
            this.log('🔄 Simulação automática ATIVADA', 'success');
        } else {
            btn.classList.remove('active');
            this.stopAutoSimulation();
            this.log('⏸️ Simulação automática PAUSADA', 'warning');
        }
    }

    startAutoSimulation() {
        this.stopAutoSimulation();
        const speed = this.engine.getState().simulationSpeed;
        const delay = 2000 / speed;

        this.autoSimulationInterval = setInterval(() => {
            if (this.engine.getState().autoSimulate) {
                this.simulateDay();
            }
        }, delay);
    }

    stopAutoSimulation() {
        if (this.autoSimulationInterval) {
            clearInterval(this.autoSimulationInterval);
            this.autoSimulationInterval = null;
        }
    }

    changeDay(delta) {
        const state = this.engine.getState();
        const newDay = Math.max(1, Math.min(state.totalDays, this.currentDay + delta));
        
        if (newDay !== this.currentDay) {
            this.currentDay = newDay;
            this.renderLiveGames();
            
            if (this.elements.currentDayDisplay) {
                this.elements.currentDayDisplay.textContent = `Dia ${this.currentDay}`;
            }
        }
    }

    // ============================================================
    // MODALS
    // ============================================================
    showRosterManagement() {
        const modal = this.elements.rosterManagementModal;
        const overlay = this.elements.modalOverlay;
        const content = document.getElementById('roster-modal-content');

        if (!modal || !overlay || !content) return;

        const userTeam = this.engine.getUserTeamInfo();
        if (!userTeam) {
            alert('Selecione uma equipa primeiro');
            return;
        }

        const html = `
            <div class="roster-management">
                <div class="roster-header">
                    <h2>${userTeam.name}</h2>
                    <div class="roster-summary">
                        <span>👥 ${userTeam.roster.players.length} jogadores</span>
                        <span>💰 Salary Cap: ${(userTeam.finances.capSpace / 1000000).toFixed(1)}M disponível</span>
                    </div>
                </div>

                <div class="roster-tabs">
                    <button class="roster-tab active" data-tab="starters">Titulares</button>
                    <button class="roster-tab" data-tab="rotation">Rotação</button>
                    <button class="roster-tab" data-tab="bench">Banco</button>
                    <button class="roster-tab" data-tab="all">Todos</button>
                </div>

                <div class="roster-list">
                    ${userTeam.roster.players.map(player => this.createPlayerCard(player)).join('')}
                </div>
            </div>
        `;

        content.innerHTML = html;
        modal.classList.add('active');
        overlay.classList.add('active');
    }

    createPlayerCard(player) {
        const energyColor = player.energy >= 80 ? '#06d6a0' : player.energy >= 50 ? '#ffd166' : '#ef476f';

        return `
            <div class="player-card">
                <div class="player-header">
                    <div class="player-main-info">
                        <span class="player-emoji">${this.getArchetypeEmoji(player.archetype)}</span>
                        <div>
                            <h4>${player.name}</h4>
                            <span class="player-position">${player.position} • ${player.archetype}</span>
                        </div>
                    </div>
                    <div class="player-rating">${player.rating.toFixed(0)}</div>
                </div>

                <div class="player-attributes">
                    ${Object.entries(player.attributes).map(([attr, value]) => `
                        <div class="attribute-bar">
                            <span class="attr-name">${attr}</span>
                            <div class="attr-progress">
                                <div class="attr-fill" style="width: ${value}%; background: linear-gradient(90deg, #4a1e8c, #06d6a0)"></div>
                            </div>
                            <span class="attr-value">${Math.round(value)}</span>
                        </div>
                    `).join('')}
                </div>

                <div class="player-status">
                    <div class="status-item">
                        <span>Energia</span>
                        <div class="energy-bar">
                            <div class="energy-fill" style="width: ${player.energy}%; background: ${energyColor}"></div>
                        </div>
                        <span>${Math.round(player.energy)}%</span>
                    </div>
                    <div class="status-item">
                        <span>Moral</span>
                        <span>${Math.round(player.morale)}</span>
                    </div>
                </div>

                <div class="player-actions">
                    <button class="btn-small" data-action="train-player" data-payload='{"playerId":"${player.id}","trainingType":"balanced"}'>
                        <i class="fas fa-dumbbell"></i> Treinar
                    </button>
                </div>
            </div>
        `;
    }

    trainPlayer(payload) {
        const result = this.engine.dispatch({
            type: ACTION_TYPES.TRAIN_PLAYER,
            payload
        });

        if (result.success) {
            this.log(`✅ Treino concluído! Melhorias: ${Object.entries(result.improvements).map(([k,v]) => `${k}+${v.toFixed(1)}`).join(', ')}`, 'success');
            this.showRosterManagement(); // Refresh
        } else {
            this.log(`❌ ${result.error}`, 'error');
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        if (this.elements.modalOverlay) {
            this.elements.modalOverlay.classList.remove('active');
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
        if (this.elements.modalOverlay) {
            this.elements.modalOverlay.classList.remove('active');
        }
    }

    showGameDetails(gameData) {
        // TODO: Implementar modal de detalhes do jogo
        console.log('Show game details:', gameData);
    }

    showSchedule() {
        alert('📅 Vista de calendário em desenvolvimento');
    }

    showHistory() {
        alert('📊 Histórico em desenvolvimento');
    }

    showFreeAgents() {
        alert('👤 Free Agents em desenvolvimento');
    }

    showTrades() {
        alert('🔄 Sistema de trocas em desenvolvimento');
    }

    showDraft() {
        alert('📋 Draft em desenvolvimento');
    }

    showSettings() {
        alert('⚙️ Configurações em desenvolvimento');
    }

    showAchievementNotification(achievement) {
        this.log(`🏆 CONQUISTA DESBLOQUEADA: ${achievement.name} - ${achievement.description}`, 'success');
    }

    // ============================================================
    // SAVE/LOAD
    // ============================================================
    saveGame() {
        const result = this.engine.dispatch({
            type: ACTION_TYPES.SAVE_GAME,
            payload: { slot: 1 }
        });

        if (result.success) {
            this.log('💾 Jogo salvo com sucesso!', 'success');
        } else {
            this.log(`❌ Erro ao salvar: ${result.error}`, 'error');
        }
    }

    loadGame() {
        if (confirm('Carregar jogo salvo? (Progresso atual será perdido)')) {
            const result = this.engine.dispatch({
                type: ACTION_TYPES.LOAD_GAME,
                payload: { slot: 1 }
            });

            if (result.success) {
                this.log('📂 Jogo carregado com sucesso!', 'success');
                this.switchView(UI_STATES.DASHBOARD);
            } else {
                this.log(`❌ Erro ao carregar: ${result.error}`, 'error');
            }
        }
    }

    // ============================================================
    // CONSOLE LOG
    // ============================================================
    log(message, type = 'info') {
        if (!this.elements.consoleOutput) return;

        const time = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        entry.className = `console-entry ${type}`;
        entry.innerHTML = `
            <span class="console-time">[${time}]</span>
            <span>${message}</span>
        `;

        this.elements.consoleOutput.insertBefore(entry, this.elements.consoleOutput.firstChild);

        // Limitar a 100 entradas
        while (this.elements.consoleOutput.children.length > 100) {
            this.elements.consoleOutput.removeChild(this.elements.consoleOutput.lastChild);
        }
    }
}

// ============================================================
// INICIALIZAÇÃO GLOBAL
// ============================================================
window.uiManager = new UIManager();

document.addEventListener('DOMContentLoaded', () => {
    window.uiManager.init();
});