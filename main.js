// main.js - CAMADA UI PARA MBA (VERSÃO DIAGNÓSTICO)
// ============================================================
// Sistema de diagnóstico integrado para identificar problemas de conexão
// ============================================================

import { GameEngine, GAME_PHASES, ACTION_TYPES } from './game.js';

class UIManager {
    constructor() {
        this.gameEngine = null;
        this.uiState = {
            currentView: 'loading',
            selectedTeamId: null,
            gameSpeed: 1,
            isSimulationRunning: false,
            autoSimulate: true,
            updateInterval: null
        };
        
        this.renderFunction = null;
        this.initialized = false;
        
        console.log('[MBA-DEBUG] UIManager construído');
    }

    // ==================== INICIALIZAÇÃO ====================
    async initialize() {
        try {
            console.log('[MBA-DEBUG] Iniciando inicialização...');
            
            // PASSO 1: Atualizar loading inicial
            this.dispatchViewUpdate({
                type: 'LOADING',
                data: { 
                    percent: 10, 
                    message: 'Iniciando MBA...',
                    debug: 'PASSO 1: Loading inicial'
                }
            });
            
            // PASSO 2: Carregar dados
            console.log('[MBA-DEBUG] Carregando data.json...');
            this.dispatchViewUpdate({
                type: 'LOADING',
                data: { 
                    percent: 30, 
                    message: 'Carregando dados mitológicos...',
                    debug: 'PASSO 2: Fetch data.json'
                }
            });
            
            let gameData;
            try {
                const response = await fetch('./data.json');
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                gameData = await response.json();
                console.log('[MBA-DEBUG] Data.json carregado com sucesso:', {
                    teams: gameData.teams?.length || 0,
                    archetypes: Object.keys(gameData.archetypes || {}).length
                });
            } catch (fetchError) {
                console.error('[MBA-DEBUG] Erro ao carregar data.json:', fetchError);
                throw new Error(`Falha ao carregar dados: ${fetchError.message}`);
            }
            
            // PASSO 3: Criar motor de jogo
            this.dispatchViewUpdate({
                type: 'LOADING',
                data: { 
                    percent: 60, 
                    message: 'Inicializando motor de jogo...',
                    debug: 'PASSO 3: Criando GameEngine'
                }
            });
            
            try {
                this.gameEngine = new GameEngine(gameData);
                console.log('[MBA-DEBUG] GameEngine criado com sucesso');
                console.log('[MBA-DEBUG] Estado inicial:', {
                    phase: this.gameEngine.getState().phase,
                    teams: this.gameEngine.getState().teams?.length || 0
                });
            } catch (engineError) {
                console.error('[MBA-DEBUG] Erro ao criar GameEngine:', engineError);
                throw new Error(`Falha no motor de jogo: ${engineError.message}`);
            }
            
            // PASSO 4: Configurar sistema
            this.dispatchViewUpdate({
                type: 'LOADING',
                data: { 
                    percent: 80, 
                    message: 'Configurando interface...',
                    debug: 'PASSO 4: Setup completo'
                }
            });
            
            this.setupEventListeners();
            
            // PASSO 5: Completar
            this.dispatchViewUpdate({
                type: 'LOADING',
                data: { 
                    percent: 100, 
                    message: 'Pronto para jogar!',
                    debug: 'PASSO 5: Completo'
                }
            });
            
            console.log('[MBA-DEBUG] Inicialização completa');
            
            // Pequeno delay para garantir que o loading é visível
            setTimeout(() => {
                this.render();
                this.initialized = true;
                
                // Disparar evento customizado para informar que o UIManager está pronto
                const event = new CustomEvent('mba:uimanager-ready', {
                    detail: { 
                        uiManager: this,
                        gameEngine: this.gameEngine,
                        timestamp: Date.now()
                    }
                });
                document.dispatchEvent(event);
                console.log('[MBA-DEBUG] Evento mba:uimanager-ready disparado');
                
            }, 500);
            
        } catch (error) {
            console.error('[MBA-DEBUG] ERRO FATAL na inicialização:', error);
            
            // Enviar erro para a UI
            this.dispatchViewUpdate({
                type: 'ERROR',
                data: { 
                    message: `Erro crítico: ${error.message}`,
                    error: error.toString(),
                    stack: error.stack
                }
            });
            
            // Mostrar erro no console do navegador
            console.error('MBA - Erro de inicialização:', {
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
        }
    }

    // ==================== RENDERIZAÇÃO ====================
    render() {
        if (!this.gameEngine) {
            console.warn('[MBA-DEBUG] Tentativa de render sem gameEngine');
            this.dispatchViewUpdate({
                type: 'ERROR',
                data: { message: 'Motor de jogo não disponível' }
            });
            return;
        }
        
        const gameState = this.gameEngine.getState();
        console.log('[MBA-DEBUG] Renderizando...', {
            phase: gameState.phase,
            currentDay: gameState.currentDay,
            teams: gameState.teams?.length,
            playerTeamId: gameState.playerTeamId
        });
        
        switch (gameState.phase) {
            case GAME_PHASES.INIT:
                this.renderLoading();
                break;
                
            case GAME_PHASES.TEAM_SELECTION:
                this.renderTeamSelection(gameState);
                break;
                
            case GAME_PHASES.REGULAR_SEASON:
            case GAME_PHASES.PLAYOFFS:
            case GAME_PHASES.FINALS:
                this.renderDashboard(gameState);
                break;
                
            default:
                console.warn('[MBA-DEBUG] Fase desconhecida:', gameState.phase);
                this.renderDefault();
        }
    }

    renderTeamSelection(gameState) {
        console.log('[MBA-DEBUG] Renderizando seleção de equipas');
        this.uiState.currentView = 'team-selection';
        
        const teams = gameState.teams.map(team => ({
            id: team.id,
            name: team.name,
            mythology: team.mythology,
            conference: team.conference,
            division: team.division,
            style: team.style,
            dominantArchetype: team.dominantArchetype,
            teamPower: Math.round(team.teamPower || 70),
            stats: team.stats || { wins: 0, losses: 0, streak: 0 },
            players: team.players?.slice(0, 3) || []
        }));
        
        console.log('[MBA-DEBUG] Dados das equipas:', {
            totalTeams: teams.length,
            sampleTeam: teams[0]
        });
        
        this.dispatchViewUpdate({
            type: 'TEAM_SELECTION',
            data: { teams }
        });
    }

    renderDashboard(gameState) {
        console.log('[MBA-DEBUG] Renderizando dashboard');
        this.uiState.currentView = 'dashboard';
        
        const userTeam = this.gameEngine.getUserTeamInfo();
        if (!userTeam) {
            console.warn('[MBA-DEBUG] Sem equipa do usuário, voltando para seleção');
            this.renderTeamSelection(gameState);
            return;
        }
        
        console.log('[MBA-DEBUG] Equipa do usuário:', userTeam);
        
        try {
            const standings = this.gameEngine.getStandings();
            const liveGames = this.gameEngine.getLiveGames();
            const liveFeed = this.gameEngine.getLiveFeed();
            const upcomingGames = userTeam.id ? this.gameEngine.getUpcomingGames(userTeam.id) : [];
            const jobOffers = gameState.jobOffers || [];
            
            console.log('[MBA-DEBUG] Dados do dashboard:', {
                standingsAvailable: !!standings,
                liveGamesCount: liveGames?.live?.length || 0,
                liveFeedCount: liveFeed?.length || 0,
                upcomingGamesCount: upcomingGames?.length || 0,
                jobOffersCount: jobOffers?.length || 0
            });
            
            this.dispatchViewUpdate({
                type: 'DASHBOARD',
                data: {
                    userTeam: {
                        ...userTeam,
                        teamPower: Math.round(userTeam.teamPower || 70)
                    },
                    reputation: gameState.userReputation || 50,
                    phase: gameState.phase,
                    currentDay: gameState.currentDay || 1,
                    totalDays: gameState.totalDays || 82,
                    seasonYear: gameState.seasonYear || 2026,
                    standings: standings || { EAST: [], WEST: [] },
                    liveGames: liveGames || { live: [], completed: [] },
                    liveFeed: liveFeed || [],
                    upcomingGames: upcomingGames || [],
                    jobOffers: jobOffers,
                    simulationSpeed: gameState.simulationSpeed || 1,
                    autoSimulate: gameState.autoSimulate !== false
                }
            });
            
        } catch (error) {
            console.error('[MBA-DEBUG] Erro ao renderizar dashboard:', error);
            this.dispatchViewUpdate({
                type: 'ERROR',
                data: { 
                    message: 'Erro ao carregar dashboard',
                    error: error.message 
                }
            });
        }
    }

    renderLoading() {
        this.uiState.currentView = 'loading';
        this.dispatchViewUpdate({ 
            type: 'LOADING',
            data: { percent: 100, message: 'Carregamento completo' }
        });
    }

    renderDefault() {
        this.uiState.currentView = 'default';
        this.dispatchViewUpdate({ 
            type: 'DEFAULT',
            data: { message: 'Bem-vindo ao MBA!' }
        });
    }

    // ==================== SISTEMA DE EVENTOS ====================
    setupEventListeners() {
        console.log('[MBA-DEBUG] Configurando event listeners internos');
        
        this.eventHandlers = {
            selectTeam: this.handleSelectTeam.bind(this),
            simulateDay: this.handleSimulateDay.bind(this),
            simulateGame: this.handleSimulateGame.bind(this),
            setSpeed: this.handleSetSpeed.bind(this),
            toggleAuto: this.handleToggleAuto.bind(this),
            toggleSimulation: this.toggleSimulation.bind(this),
            acceptJobOffer: this.handleAcceptJobOffer.bind(this),
            switchTeam: this.handleSwitchTeam.bind(this),
            viewRoster: () => console.log('[MBA] View roster chamado'),
            viewSchedule: () => console.log('[MBA] View schedule chamado'),
            viewHistory: this.handleViewHistory.bind(this)
        };
        
        console.log('[MBA-DEBUG] Event handlers configurados:', Object.keys(this.eventHandlers));
    }

    // ==================== HANDLERS ====================
    handleSelectTeam(teamId) {
        console.log('[MBA-DEBUG] handleSelectTeam chamado com teamId:', teamId);
        
        if (!teamId || !this.gameEngine) {
            this.dispatchViewUpdate({
                type: 'ERROR',
                data: { message: 'ID de equipa inválido' }
            });
            return;
        }
        
        try {
            const result = this.gameEngine.dispatch({
                type: ACTION_TYPES.SELECT_TEAM,
                payload: { teamId }
            });
            
            console.log('[MBA-DEBUG] Resultado da seleção:', result);
            
            if (result.success) {
                this.uiState.selectedTeamId = teamId;
                this.dispatchViewUpdate({
                    type: 'STATUS_UPDATE',
                    data: { 
                        message: `🏀 ${result.team.name} selecionada! Reputação: ${result.reputation}`,
                        type: 'success'
                    }
                });
                
                // Pequeno delay para garantir que a mensagem é visível
                setTimeout(() => this.render(), 300);
                
            } else {
                this.dispatchViewUpdate({
                    type: 'ERROR',
                    data: { message: result.error || 'Erro desconhecido' }
                });
            }
        } catch (error) {
            console.error('[MBA-DEBUG] Erro em handleSelectTeam:', error);
            this.dispatchViewUpdate({
                type: 'ERROR',
                data: { 
                    message: `Erro: ${error.message}`,
                    error: error.toString()
                }
            });
        }
    }

    handleSimulateDay(dayNumber = null) {
        console.log('[MBA-DEBUG] Simulando dia:', dayNumber);
        
        if (!this.gameEngine) return;
        
        try {
            const result = this.gameEngine.dispatch({
                type: ACTION_TYPES.SIMULATE_DAY,
                payload: { day: dayNumber }
            });
            
            if (result.success) {
                if (result.userGame) {
                    console.log('[MBA-DEBUG] Jogo do usuário detectado');
                    this.handleUserGame(result.userGame);
                } else {
                    this.dispatchViewUpdate({
                        type: 'STATUS_UPDATE',
                        data: { 
                            message: `Dia ${result.day} simulado`,
                            type: 'info'
                        }
                    });
                    
                    setTimeout(() => this.render(), 500);
                }
            } else {
                this.dispatchViewUpdate({
                    type: 'ERROR',
                    data: { message: result.error || 'Erro na simulação' }
                });
            }
        } catch (error) {
            console.error('[MBA-DEBUG] Erro em handleSimulateDay:', error);
        }
    }

    handleSimulateGame(gameData) {
        console.log('[MBA-DEBUG] Simulando jogo específico');
        
        if (!gameData || !this.gameEngine) return;
        
        try {
            const result = this.gameEngine.dispatch({
                type: ACTION_TYPES.PLAYER_GAME,
                payload: { 
                    gameData: gameData,
                    actions: []
                }
            });
            
            if (result.success) {
                this.dispatchViewUpdate({
                    type: 'STATUS_UPDATE',
                    data: { 
                        message: `Jogo concluído! Reputação: ${result.userReputation}`,
                        type: 'success'
                    }
                });
                
                setTimeout(() => this.render(), 1000);
            }
        } catch (error) {
            console.error('[MBA-DEBUG] Erro em handleSimulateGame:', error);
        }
    }

    handleSetSpeed(speed) {
        console.log('[MBA-DEBUG] Alterando velocidade para:', speed);
        
        if (!this.gameEngine) return;
        
        try {
            const result = this.gameEngine.dispatch({
                type: ACTION_TYPES.SET_SPEED,
                payload: { speed }
            });
            
            if (result.success) {
                this.uiState.gameSpeed = speed;
            }
        } catch (error) {
            console.error('[MBA-DEBUG] Erro em handleSetSpeed:', error);
        }
    }

    handleToggleAuto() {
        console.log('[MBA-DEBUG] Alternando modo automático');
        
        if (!this.gameEngine) return;
        
        try {
            const result = this.gameEngine.dispatch({
                type: ACTION_TYPES.TOGGLE_AUTO,
                payload: {}
            });
            
            if (result.success) {
                this.uiState.autoSimulate = result.autoSimulate;
            }
        } catch (error) {
            console.error('[MBA-DEBUG] Erro em handleToggleAuto:', error);
        }
    }

    handleAcceptJobOffer(teamId) {
        console.log('[MBA-DEBUG] Aceitando oferta para equipa:', teamId);
        
        if (!this.gameEngine) return;
        
        try {
            const result = this.gameEngine.dispatch({
                type: ACTION_TYPES.ACCEPT_JOB_OFFER,
                payload: { teamId }
            });
            
            if (result.success) {
                this.uiState.selectedTeamId = teamId;
                this.dispatchViewUpdate({
                    type: 'STATUS_UPDATE',
                    data: { 
                        message: `🎉 Nova equipa: ${teamId}!`,
                        type: 'success'
                    }
                });
                
                setTimeout(() => this.render(), 1000);
            }
        } catch (error) {
            console.error('[MBA-DEBUG] Erro em handleAcceptJobOffer:', error);
        }
    }

    handleSwitchTeam() {
        console.log('[MBA-DEBUG] Mudando de equipa');
        
        if (!this.gameEngine) return;
        
        if (confirm('Mudar de equipa reduz reputação. Continuar?')) {
            const gameState = this.gameEngine.getState();
            gameState.phase = GAME_PHASES.TEAM_SELECTION;
            gameState.playerTeamId = null;
            this.uiState.selectedTeamId = null;
            
            this.dispatchViewUpdate({
                type: 'STATUS_UPDATE',
                data: { 
                    message: 'Selecione uma nova equipa',
                    type: 'info'
                }
            });
            
            this.render();
        }
    }

    handleUserGame(gameData) {
        console.log('[MBA-DEBUG] Iniciando jogo do usuário:', gameData);
        
        this.dispatchViewUpdate({
            type: 'USER_GAME',
            data: { gameData }
        });
    }

    handleViewHistory() {
        console.log('[MBA-DEBUG] Visualizando histórico');
        
        if (!this.gameEngine) return;
        
        try {
            const gameState = this.gameEngine.getState();
            const userHistory = this.gameEngine.getGameHistory({ userOnly: true });
            
            this.dispatchViewUpdate({
                type: 'HISTORY',
                data: {
                    userHistory: userHistory || [],
                    totalGames: userHistory?.length || 0,
                    wins: userHistory?.filter(game => {
                        const isHome = game.homeTeam.id === gameState.playerTeamId;
                        return (isHome && game.result.winner === 'home') || 
                               (!isHome && game.result.winner === 'away');
                    }).length || 0
                }
            });
        } catch (error) {
            console.error('[MBA-DEBUG] Erro em handleViewHistory:', error);
        }
    }

    // ==================== SISTEMA DE SIMULAÇÃO ====================
    startAutoSimulation() {
        console.log('[MBA-DEBUG] Iniciando simulação automática');
        
        if (this.uiState.updateInterval) {
            clearInterval(this.uiState.updateInterval);
        }
        
        this.uiState.updateInterval = setInterval(() => {
            if (this.uiState.isSimulationRunning && this.uiState.autoSimulate) {
                this.handleSimulateDay();
            }
        }, 5000 / this.uiState.gameSpeed);
        
        this.uiState.isSimulationRunning = true;
    }

    stopAutoSimulation() {
        console.log('[MBA-DEBUG] Parando simulação automática');
        
        if (this.uiState.updateInterval) {
            clearInterval(this.uiState.updateInterval);
            this.uiState.updateInterval = null;
        }
        
        this.uiState.isSimulationRunning = false;
    }

    toggleSimulation() {
        if (this.uiState.isSimulationRunning) {
            this.stopAutoSimulation();
        } else {
            this.startAutoSimulation();
        }
    }

    // ==================== COMUNICAÇÃO ====================
    dispatchViewUpdate(payload) {
        console.log('[MBA-DEBUG] dispatchViewUpdate:', {
            type: payload.type,
            data: payload.data ? 'DATA PRESENT' : 'NO DATA',
            timestamp: Date.now()
        });
        
        // 1. Tentar via função de renderização anexada
        if (this.renderFunction) {
            try {
                this.renderFunction(payload);
                console.log('[MBA-DEBUG] Renderizado via renderFunction');
            } catch (error) {
                console.error('[MBA-DEBUG] Erro no renderFunction:', error);
            }
        } else {
            console.warn('[MBA-DEBUG] renderFunction não disponível');
        }
        
        // 2. Tentar via sistema global (para compatibilidade)
        if (window.onUIUpdate) {
            try {
                window.onUIUpdate(payload);
                console.log('[MBA-DEBUG] Enviado via window.onUIUpdate');
            } catch (error) {
                console.error('[MBA-DEBUG] Erro no window.onUIUpdate:', error);
            }
        } else {
            console.warn('[MBA-DEBUG] window.onUIUpdate não disponível');
        }
        
        // 3. Disparar evento customizado
        try {
            const event = new CustomEvent('mba:ui-update', {
                detail: payload
            });
            document.dispatchEvent(event);
            console.log('[MBA-DEBUG] Evento mba:ui-update disparado');
        } catch (error) {
            console.error('[MBA-DEBUG] Erro ao disparar evento:', error);
        }
    }

    updateStatus(message, type = 'info') {
        this.dispatchViewUpdate({
            type: 'STATUS_UPDATE',
            data: { message, type }
        });
    }

    // ==================== API PÚBLICA ====================
    getUIState() {
        return { ...this.uiState, initialized: this.initialized };
    }

    getGameState() {
        return this.gameEngine ? this.gameEngine.getState() : null;
    }

    getGameEngine() {
        return this.gameEngine;
    }

    attachRenderer(renderFunction) {
        console.log('[MBA-DEBUG] attachRenderer chamado');
        this.renderFunction = renderFunction;
        
        // Se já estiver inicializado, renderizar imediatamente
        if (this.initialized) {
            console.log('[MBA-DEBUG] Renderizando após attach (já inicializado)');
            this.render();
        }
    }

    // Método de diagnóstico
    diagnose() {
        return {
            timestamp: Date.now(),
            uiManager: {
                initialized: this.initialized,
                currentView: this.uiState.currentView,
                gameEngineAvailable: !!this.gameEngine,
                renderFunctionAvailable: !!this.renderFunction
            },
            window: {
                onUIUpdate: typeof window.onUIUpdate,
                uiManager: typeof window.uiManager,
                gameEngine: typeof window.gameEngine
            },
            document: {
                readyState: document.readyState,
                hidden: document.hidden
            }
        };
    }
}

// ==================== INICIALIZAÇÃO GLOBAL ====================
let uiManager = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('[MBA-DEBUG] DOMContentLoaded disparado');
    console.log('[MBA-DEBUG] Documento pronto:', {
        readyState: document.readyState,
        location: window.location.href,
        timestamp: Date.now()
    });
    
    // Verificar se há elementos críticos do DOM
    const criticalElements = {
        'loading-screen': document.getElementById('loading-screen'),
        'app': document.getElementById('app'),
        'progress-fill': document.getElementById('progress-fill'),
        'loading-progress': document.getElementById('loading-progress')
    };
    
    console.log('[MBA-DEBUG] Elementos críticos do DOM:', criticalElements);
    
    // Criar e inicializar UIManager
    uiManager = new UIManager();
    
    // Expor globalmente
    window.uiManager = uiManager;
    console.log('[MBA-DEBUG] window.uiManager exposto');
    
    // Adicionar listener para eventos customizados
    document.addEventListener('mba:request-diagnosis', () => {
        console.log('[MBA-DEBUG] Diagnóstico solicitado');
        if (uiManager) {
            const diagnosis = uiManager.diagnose();
            console.log('[MBA-DEBUG] Resultado do diagnóstico:', diagnosis);
            
            // Disparar evento com resultados
            const event = new CustomEvent('mba:diagnosis-result', {
                detail: diagnosis
            });
            document.dispatchEvent(event);
        }
    });
    
    // Iniciar após pequeno delay
    setTimeout(() => {
        console.log('[MBA-DEBUG] Iniciando UIManager...');
        uiManager.initialize().catch(error => {
            console.error('[MBA-DEBUG] Erro na inicialização:', error);
            
            // Tentar mostrar erro na interface
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.innerHTML = `
                    <div style="
                        position: fixed;
                        top: 0; left: 0; right: 0; bottom: 0;
                        background: #0a0a1a;
                        color: white;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        font-family: sans-serif;
                        padding: 20px;
                        text-align: center;
                        z-index: 9999;
                    ">
                        <h1 style="color: #ef476f; margin-bottom: 20px;">❌ Erro na Inicialização</h1>
                        <pre style="
                            background: rgba(255,255,255,0.1);
                            padding: 20px;
                            border-radius: 8px;
                            max-width: 800px;
                            overflow: auto;
                            text-align: left;
                        ">${error.message}\n\n${error.stack}</pre>
                        <button onclick="location.reload()" style="
                            margin-top: 20px;
                            background: #4a1e8c;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            font-size: 16px;
                            cursor: pointer;
                        ">Recarregar Página</button>
                    </div>
                `;
            }
        });
    }, 100);
});

// ==================== UTILITÁRIOS GLOBAIS ====================
// Função global para diagnóstico
window.mbaDiagnose = function() {
    console.log('[MBA-DEBUG] Diagnóstico manual solicitado');
    
    if (window.uiManager) {
        const diagnosis = window.uiManager.diagnose();
        console.log('=== MBA DIAGNÓSTICO ===');
        console.log('Timestamp:', new Date(diagnosis.timestamp).toISOString());
        console.log('UI Manager:', diagnosis.uiManager);
        console.log('Window:', diagnosis.window);
        console.log('Document:', diagnosis.document);
        console.log('=== FIM DIAGNÓSTICO ===');
        
        return diagnosis;
    } else {
        console.warn('UI Manager não disponível');
        return { error: 'UI Manager não disponível' };
    }
};

// Função para forçar renderização
window.mbaForceRender = function() {
    console.log('[MBA-DEBUG] Renderização forçada');
    if (window.uiManager && window.uiManager.render) {
        window.uiManager.render();
    }
};

// Função para testar comunicação
window.mbaTestCommunication = function() {
    console.log('[MBA-DEBUG] Teste de comunicação');
    
    // Testar via evento
    const testEvent = new CustomEvent('mba:test', {
        detail: { message: 'Teste de comunicação', timestamp: Date.now() }
    });
    document.dispatchEvent(testEvent);
    
    // Testar via função global
    if (window.onUIUpdate) {
        window.onUIUpdate({
            type: 'TEST',
            data: { message: 'Teste via onUIUpdate', success: true }
        });
    }
    
    return { success: true, timestamp: Date.now() };
};

console.log('[MBA-DEBUG] main.js carregado');

// Exportar para uso em módulos
export { uiManager };