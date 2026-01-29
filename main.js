// main.js - CAMADA UI PARA MBA (VERSÃO COMPLETA)
// ============================================================
// Sistema completo com feedback, animações e gestão avançada
// ============================================================

import { GameEngine, GAME_PHASES, ACTION_TYPES } from './game.js';

// Sistema de feedback e notificações
class FeedbackSystem {
  constructor() {
    this.toasts = [];
    this.notifications = [];
    this.toastContainer = null;
  }
  
  initialize() {
    // Criar container para toasts se não existir
    if (!document.getElementById('toast-container')) {
      this.toastContainer = document.createElement('div');
      this.toastContainer.id = 'toast-container';
      this.toastContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 2000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 350px;
      `;
      document.body.appendChild(this.toastContainer);
    } else {
      this.toastContainer = document.getElementById('toast-container');
    }
  }
  
  showToast(message, type = 'info', duration = 4000) {
    const toast = {
      id: Date.now(),
      message,
      type,
      duration
    };
    
    this.toasts.push(toast);
    this.renderToast(toast);
    
    setTimeout(() => this.removeToast(toast.id), duration);
  }
  
  renderToast(toast) {
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };
    
    const colors = {
      success: '#06d6a0',
      error: '#ef476f',
      warning: '#ffd166',
      info: '#118ab2'
    };
    
    const toastElement = document.createElement('div');
    toastElement.className = `toast-notification toast-${toast.type}`;
    toastElement.id = `toast-${toast.id}`;
    toastElement.style.cssText = `
      background: linear-gradient(135deg, #1a1a2e, #252542);
      border-left: 4px solid ${colors[toast.type]};
      color: white;
      padding: 15px 20px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      gap: 12px;
      animation: slideInRight 0.3s ease;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(106, 44, 179, 0.3);
      transform: translateX(120%);
      opacity: 0;
    `;
    
    toastElement.innerHTML = `
      <i class="fas ${icons[toast.type]}" style="color: ${colors[toast.type]}; font-size: 1.2rem;"></i>
      <div style="flex: 1; font-size: 0.9rem;">${toast.message}</div>
      <button onclick="window.feedbackSystem?.removeToast(${toast.id})" 
              style="background: none; border: none; color: #8a8aa8; cursor: pointer; font-size: 1rem;">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    this.toastContainer.appendChild(toastElement);
    
    // Animar entrada
    setTimeout(() => {
      toastElement.style.transform = 'translateX(0)';
      toastElement.style.opacity = '1';
      toastElement.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    }, 10);
  }
  
  removeToast(toastId) {
    const toastElement = document.getElementById(`toast-${toastId}`);
    if (toastElement) {
      toastElement.style.transform = 'translateX(120%)';
      toastElement.style.opacity = '0';
      
      setTimeout(() => {
        if (toastElement.parentNode) {
          toastElement.parentNode.removeChild(toastElement);
        }
        this.toasts = this.toasts.filter(t => t.id !== toastId);
      }, 300);
    }
  }
  
  showStreakNotification(type, value, playerName = null) {
    const notifications = {
      'winning': `🏆 Winning streak: ${value} games!`,
      'losing': `⚠️ Losing streak: ${value} games...`,
      'player_hot': `🔥 ${playerName || 'Player'} is on fire!`,
      'team_form': `📈 Team form: ${value}`,
      'chemistry_up': `🤝 Team chemistry improving!`,
      'chemistry_down': `😔 Team chemistry dropping...`,
      'injury': `🚑 Player injured!`,
      'recovery': `💪 Player recovered from injury!`
    };
    
    if (notifications[type]) {
      this.showToast(
        notifications[type],
        type.includes('down') || type === 'losing' || type === 'injury' ? 'warning' : 'success',
        3000
      );
    }
  }
}

// Sistema de animações
class AnimationManager {
  constructor() {
    this.transitions = new Map();
  }
  
  prepareTransition() {
    // Marcar elementos para animação
    const animatedElements = document.querySelectorAll('.animate-in, .fade-in, .slide-in');
    animatedElements.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
    });
  }
  
  executeTransition() {
    // Executar animações com delay
    setTimeout(() => {
      const animatedElements = document.querySelectorAll('.animate-in, .fade-in, .slide-in');
      animatedElements.forEach((el, index) => {
        setTimeout(() => {
          el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }, index * 50);
      });
    }, 100);
  }
  
  animateElement(element, animation) {
    const animations = {
      'pulse': 'pulse 0.5s ease',
      'shake': 'shake 0.5s ease',
      'bounce': 'bounce 0.5s ease',
      'fadeIn': 'fadeIn 0.5s ease'
    };
    
    if (animations[animation]) {
      element.style.animation = animations[animation];
      setTimeout(() => {
        element.style.animation = '';
      }, 500);
    }
  }
}

class UIManager {
  constructor() {
    this.gameEngine = null;
    this.uiState = {
      currentView: 'loading',
      selectedTeamId: null,
      gameSpeed: 1,
      isSimulationRunning: false,
      autoSimulate: true,
      updateInterval: null,
      notificationsEnabled: true,
      animationsEnabled: true
    };
    
    this.renderFunction = null;
    this.initialized = false;
    
    // Novos sistemas
    this.feedbackSystem = new FeedbackSystem();
    this.animationManager = new AnimationManager();
    this.dataManager = new DataManager();
    
    console.log('[MBA] UIManager construído com sistemas avançados');
  }

  // ==================== INICIALIZAÇÃO ====================
  async initialize() {
    try {
      console.log('[MBA] Iniciando inicialização...');
      
      // Inicializar sistemas
      this.feedbackSystem.initialize();
      
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
      console.log('[MBA] Carregando data.json...');
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
        console.log('[MBA] Data.json carregado com sucesso:', {
          teams: gameData.teams?.length || 0,
          archetypes: Object.keys(gameData.archetypes || {}).length
        });
      } catch (fetchError) {
        console.error('[MBA] Erro ao carregar data.json:', fetchError);
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
        console.log('[MBA] GameEngine criado com sucesso');
        console.log('[MBA] Estado inicial:', {
          phase: this.gameEngine.getState().phase,
          teams: this.gameEngine.getState().teams?.length || 0
        });
      } catch (engineError) {
        console.error('[MBA] Erro ao criar GameEngine:', engineError);
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
      this.setupKeyboardShortcuts();
      
      // PASSO 5: Completar
      this.dispatchViewUpdate({
        type: 'LOADING',
        data: { 
          percent: 100, 
          message: 'Pronto para jogar!',
          debug: 'PASSO 5: Completo'
        }
      });
      
      console.log('[MBA] Inicialização completa');
      
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
        console.log('[MBA] Evento mba:uimanager-ready disparado');
        
        // Toast de boas-vindas
        this.feedbackSystem.showToast('🏀 MBA - Mythology Basketball Ascension carregado com sucesso!', 'success');
        
      }, 800);
      
    } catch (error) {
      console.error('[MBA] ERRO FATAL na inicialização:', error);
      
      // Enviar erro para a UI
      this.dispatchViewUpdate({
        type: 'ERROR',
        data: { 
          message: `Erro crítico: ${error.message}`,
          error: error.toString(),
          stack: error.stack
        }
      });
      
      // Mostrar erro usando feedback system
      this.feedbackSystem.showToast(`Erro de inicialização: ${error.message}`, 'error');
    }
  }

  // ==================== RENDERIZAÇÃO ====================
  render() {
    if (!this.gameEngine) {
      console.warn('[MBA] Tentativa de render sem gameEngine');
      this.dispatchViewUpdate({
        type: 'ERROR',
        data: { message: 'Motor de jogo não disponível' }
      });
      return;
    }
    
    const gameState = this.gameEngine.getState();
    console.log('[MBA] Renderizando...', {
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
        
      case GAME_PHASES.OFFSEASON:
      case GAME_PHASES.OFFSEASON_ACTIVITIES:
        this.renderOffseason(gameState);
        break;
        
      default:
        console.warn('[MBA] Fase desconhecida:', gameState.phase);
        this.renderDefault();
    }
  }

  renderTeamSelection(gameState) {
    console.log('[MBA] Renderizando seleção de equipas');
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
      players: team.players?.slice(0, 3) || [],
      finances: gameState.teamFinances?.[team.id] || {}
    }));
    
    console.log('[MBA] Dados das equipas:', {
      totalTeams: teams.length,
      sampleTeam: teams[0]
    });
    
    this.dispatchViewUpdate({
      type: 'TEAM_SELECTION',
      data: { 
        teams,
        userReputation: gameState.userReputation
      }
    });
  }

  renderDashboard(gameState) {
    console.log('[MBA] Renderizando dashboard');
    this.uiState.currentView = 'dashboard';
    
    const userTeam = this.gameEngine.getUserTeamInfo();
    if (!userTeam) {
      console.warn('[MBA] Sem equipa do usuário, voltando para seleção');
      this.renderTeamSelection(gameState);
      return;
    }
    
    console.log('[MBA] Equipa do usuário:', userTeam);
    
    try {
      const standings = this.gameEngine.getStandings();
      const liveGames = this.gameEngine.getLiveGames();
      const liveFeed = gameState.liveFeed || [];
      const upcomingGames = userTeam.id ? this.gameEngine.getUpcomingGames(userTeam.id) : [];
      const jobOffers = gameState.jobOffers || [];
      
      // Obter estatísticas avançadas
      const advancedStats = this.getAdvancedStats(gameState, userTeam);
      
      console.log('[MBA] Dados do dashboard:', {
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
            teamPower: Math.round(userTeam.teamPower || 70),
            chemistry: gameState.teamChemistry || 75,
            injuries: gameState.injuryList?.filter(i => i.team === userTeam.name) || []
          },
          reputation: gameState.userReputation || 50,
          phase: gameState.phase,
          currentDay: gameState.currentDay || 1,
          totalDays: gameState.totalDays || 82,
          seasonYear: gameState.seasonYear || 2026,
          standings: standings || { EAST: [], WEST: [] },
          liveGames: liveGames || { live: [], completed: [] },
          liveFeed: liveFeed.slice(-15), // Últimos 15 eventos
          upcomingGames: upcomingGames || [],
          jobOffers: jobOffers,
          simulationSpeed: gameState.simulationSpeed || 1,
          autoSimulate: gameState.autoSimulate !== false,
          advancedStats,
          teamChemistry: gameState.teamChemistry || 75,
          playerDevelopment: gameState.playerDevelopment || {}
        }
      });
      
      // Verificar notificações
      this.checkNotifications(gameState, userTeam);
      
    } catch (error) {
      console.error('[MBA] Erro ao renderizar dashboard:', error);
      this.dispatchViewUpdate({
        type: 'ERROR',
        data: { 
          message: 'Erro ao carregar dashboard',
          error: error.message 
        }
      });
    }
  }

  renderOffseason(gameState) {
    console.log('[MBA] Renderizando offseason');
    this.uiState.currentView = 'offseason';
    
    const offseasonData = this.gameEngine.startOffseason();
    const userTeam = this.gameEngine.getUserTeamInfo();
    
    this.dispatchViewUpdate({
      type: 'OFFSEASON',
      data: {
        awards: offseasonData.awards,
        statLeaders: offseasonData.statLeaders,
        freeAgents: offseasonData.freeAgents,
        userTeam,
        userReputation: gameState.userReputation,
        draftPicks: gameState.draftPicks?.filter(p => p.currentTeam === gameState.playerTeamId) || []
      }
    });
  }

  getAdvancedStats(gameState, userTeam) {
    if (!userTeam) return {};
    
    const stats = {
      team: {
        offensiveRating: Math.round(100 + (Math.random() * 20)),
        defensiveRating: Math.round(100 + (Math.random() * 20)),
        pace: Math.round(95 + (Math.random() * 10)),
        efficiency: Math.round(50 + (Math.random() * 40))
      },
      players: [],
      trends: []
    };
    
    // Adicionar estatísticas de jogadores da equipa do usuário
    if (userTeam.roster?.players) {
      stats.players = userTeam.roster.players
        .filter(p => p.rating > 70)
        .slice(0, 5)
        .map(p => ({
          name: p.name,
          position: p.position,
          rating: p.rating,
          form: this.getPlayerForm(p.id, gameState)
        }));
    }
    
    return stats;
  }

  getPlayerForm(playerId, gameState) {
    // Simular forma do jogador
    const forms = ['📈', '➡️', '📉'];
    return forms[Math.floor(Math.random() * forms.length)];
  }

  checkNotifications(gameState, userTeam) {
    if (!this.uiState.notificationsEnabled) return;
    
    // Verificar streaks
    if (userTeam?.stats?.streak) {
      if (userTeam.stats.streak >= 3) {
        this.feedbackSystem.showStreakNotification('winning', userTeam.stats.streak);
      } else if (userTeam.stats.streak <= -3) {
        this.feedbackSystem.showStreakNotification('losing', Math.abs(userTeam.stats.streak));
      }
    }
    
    // Verificar química
    const chemistry = gameState.teamChemistry || 75;
    if (chemistry > 80) {
      this.feedbackSystem.showStreakNotification('chemistry_up', chemistry);
    } else if (chemistry < 40) {
      this.feedbackSystem.showStreakNotification('chemistry_down', chemistry);
    }
    
    // Verificar lesões recentes
    const recentInjuries = gameState.injuryList?.filter(i => 
      i.team === userTeam.name && 
      Date.now() - new Date(i.timestamp).getTime() < 30000
    );
    
    if (recentInjuries?.length > 0) {
      this.feedbackSystem.showStreakNotification('injury');
    }
  }

  // ==================== SISTEMA DE EVENTOS ====================
  setupEventListeners() {
    console.log('[MBA] Configurando event listeners internos');
    
    this.eventHandlers = {
      selectTeam: this.handleSelectTeam.bind(this),
      simulateDay: this.handleSimulateDay.bind(this),
      simulateGame: this.handleSimulateGame.bind(this),
      setSpeed: this.handleSetSpeed.bind(this),
      toggleAuto: this.handleToggleAuto.bind(this),
      toggleSimulation: this.toggleSimulation.bind(this),
      acceptJobOffer: this.handleAcceptJobOffer.bind(this),
      switchTeam: this.handleSwitchTeam.bind(this),
      viewRoster: this.handleViewRoster.bind(this),
      viewSchedule: this.handleViewSchedule.bind(this),
      viewHistory: this.handleViewHistory.bind(this),
      manageRoster: this.handleManageRoster.bind(this),
      trainPlayer: this.handleTrainPlayer.bind(this),
      setLineup: this.handleSetLineup.bind(this),
      signFreeAgent: this.handleSignFreeAgent.bind(this)
    };
    
    console.log('[MBA] Event handlers configurados:', Object.keys(this.eventHandlers));
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ignorar se estiver em input ou textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch(e.key) {
        case ' ':
          // Espaço para simular dia
          e.preventDefault();
          this.handleSimulateDay();
          break;
        case 'ArrowRight':
          // Seta direita para aumentar velocidade
          e.preventDefault();
          this.handleSetSpeed(Math.min(10, this.uiState.gameSpeed + 1));
          break;
        case 'ArrowLeft':
          // Seta esquerda para diminuir velocidade
          e.preventDefault();
          this.handleSetSpeed(Math.max(1, this.uiState.gameSpeed - 1));
          break;
        case 'a':
        case 'A':
          // A para alternar modo automático
          e.preventDefault();
          this.handleToggleAuto();
          break;
        case 'r':
        case 'R':
          // R para ver roster
          e.preventDefault();
          this.handleViewRoster();
          break;
        case 'h':
        case 'H':
          // H para histórico
          e.preventDefault();
          this.handleViewHistory();
          break;
      }
    });
  }

  // ==================== HANDLERS ====================
  handleSelectTeam(teamId) {
    console.log('[MBA] handleSelectTeam chamado com teamId:', teamId);
    
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
      
      console.log('[MBA] Resultado da seleção:', result);
      
      if (result.success) {
        this.uiState.selectedTeamId = teamId;
        
        // Feedback visual
        this.feedbackSystem.showToast(
          `🏀 ${result.team.name} selecionada! Reputação: ${Math.round(result.reputation)}`,
          'success'
        );
        
        // Animar transição
        this.animationManager.executeTransition();
        
        // Pequeno delay para garantir que a mensagem é visível
        setTimeout(() => this.render(), 500);
        
      } else {
        this.feedbackSystem.showToast(
          `Erro: ${result.error || 'Desconhecido'}`,
          'error'
        );
      }
    } catch (error) {
      console.error('[MBA] Erro em handleSelectTeam:', error);
      this.feedbackSystem.showToast(`Erro: ${error.message}`, 'error');
    }
  }

  handleSimulateDay(dayNumber = null) {
    console.log('[MBA] Simulando dia:', dayNumber);
    
    if (!this.gameEngine) return;
    
    try {
      const result = this.gameEngine.dispatch({
        type: ACTION_TYPES.SIMULATE_DAY,
        payload: { day: dayNumber }
      });
      
      if (result.success) {
        if (result.userGame) {
          console.log('[MBA] Jogo do usuário detectado');
          this.handleUserGame(result.userGame);
        } else {
          // Feedback de sucesso
          this.feedbackSystem.showToast(
            `Dia ${result.day} simulado com sucesso`,
            'info'
          );
          
          // Animar atualização
          this.animationManager.prepareTransition();
          setTimeout(() => {
            this.render();
            this.animationManager.executeTransition();
          }, 300);
        }
      } else {
        this.feedbackSystem.showToast(
          `Erro na simulação: ${result.error}`,
          'error'
        );
      }
    } catch (error) {
      console.error('[MBA] Erro em handleSimulateDay:', error);
      this.feedbackSystem.showToast(`Erro: ${error.message}`, 'error');
    }
  }

  handleSimulateGame(gameData) {
    console.log('[MBA] Simulando jogo específico');
    
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
        this.feedbackSystem.showToast(
          `Jogo concluído! Reputação: ${result.userReputation}`,
          'success'
        );
        
        // Animação especial para vitória/derrota
        const gameResult = result.game?.result;
        if (gameResult) {
          const userWon = this.didUserWin(gameResult, gameData);
          if (userWon) {
            this.animationManager.animateElement(
              document.getElementById('user-team-info'),
              'pulse'
            );
          }
        }
        
        setTimeout(() => this.render(), 1000);
      }
    } catch (error) {
      console.error('[MBA] Erro em handleSimulateGame:', error);
    }
  }

  didUserWin(gameResult, gameData) {
    if (!this.gameEngine) return false;
    
    const gameState = this.gameEngine.getState();
    const userTeamId = gameState.playerTeamId;
    
    if (!userTeamId) return false;
    
    const isHome = gameData.homeTeam.id === userTeamId;
    return (isHome && gameResult.winner === 'home') || 
           (!isHome && gameResult.winner === 'away');
  }

  handleSetSpeed(speed) {
    console.log('[MBA] Alterando velocidade para:', speed);
    
    if (!this.gameEngine) return;
    
    try {
      const result = this.gameEngine.dispatch({
        type: ACTION_TYPES.SET_SPEED,
        payload: { speed }
      });
      
      if (result.success) {
        this.uiState.gameSpeed = speed;
        
        // Atualizar UI dos botões de velocidade
        this.updateSpeedButtons(speed);
        
        this.feedbackSystem.showToast(
          `Velocidade alterada para ${speed}x`,
          'info'
        );
      }
    } catch (error) {
      console.error('[MBA] Erro em handleSetSpeed:', error);
    }
  }

  updateSpeedButtons(currentSpeed) {
    document.querySelectorAll('.speed-btn').forEach(btn => {
      const btnSpeed = parseInt(btn.dataset.speed);
      if (btnSpeed === currentSpeed) {
        btn.classList.add('active');
        this.animationManager.animateElement(btn, 'pulse');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  handleToggleAuto() {
    console.log('[MBA] Alternando modo automático');
    
    if (!this.gameEngine) return;
    
    try {
      const result = this.gameEngine.dispatch({
        type: ACTION_TYPES.TOGGLE_AUTO,
        payload: {}
      });
      
      if (result.success) {
        this.uiState.autoSimulate = result.autoSimulate;
        
        // Atualizar botão na UI
        const autoBtn = document.getElementById('btn-auto-toggle');
        if (autoBtn) {
          autoBtn.classList.toggle('active', result.autoSimulate);
          this.animationManager.animateElement(autoBtn, 'pulse');
        }
        
        this.feedbackSystem.showToast(
          result.autoSimulate ? '🤖 Modo automático ATIVADO' : '👤 Modo manual ATIVADO',
          'info'
        );
      }
    } catch (error) {
      console.error('[MBA] Erro em handleToggleAuto:', error);
    }
  }

  handleAcceptJobOffer(teamId) {
    console.log('[MBA] Aceitando oferta para equipa:', teamId);
    
    if (!this.gameEngine) return;
    
    try {
      const result = this.gameEngine.dispatch({
        type: ACTION_TYPES.ACCEPT_JOB_OFFER,
        payload: { teamId }
      });
      
      if (result.success) {
        this.uiState.selectedTeamId = teamId;
        
        this.feedbackSystem.showToast(
          `🎉 Nova equipa contratada! Reputação: ${result.newReputation}`,
          'success'
        );
        
        setTimeout(() => this.render(), 1000);
      }
    } catch (error) {
      console.error('[MBA] Erro em handleAcceptJobOffer:', error);
    }
  }

  handleSwitchTeam() {
    console.log('[MBA] Mudando de equipa');
    
    if (!this.gameEngine) return;
    
    if (confirm('Mudar de equipa reduz reputação. Continuar?')) {
      const gameState = this.gameEngine.getState();
      gameState.phase = GAME_PHASES.TEAM_SELECTION;
      gameState.playerTeamId = null;
      this.uiState.selectedTeamId = null;
      
      this.feedbackSystem.showToast(
        'Selecione uma nova equipa',
        'info'
      );
      
      this.render();
    }
  }

  handleUserGame(gameData) {
    console.log('[MBA] Iniciando jogo do usuário:', gameData);
    
    // Mostrar modal de jogo
    this.showGameModal(gameData);
  }

  showGameModal(gameData) {
    const modal = document.getElementById('game-details-modal');
    const overlay = document.getElementById('modal-overlay');
    
    if (!modal || !overlay) {
      // Fallback: simular automaticamente
      this.handleSimulateGame(gameData);
      return;
    }
    
    // Preencher modal com detalhes do jogo
    const content = modal.querySelector('.game-details-content');
    if (content) {
      content.innerHTML = `
        <div class="game-modal-header">
          <div class="game-team home">
            <div class="team-logo-large">🏛️</div>
            <div class="team-name">${gameData.homeTeam.name}</div>
          </div>
          <div class="vs">VS</div>
          <div class="game-team away">
            <div class="team-logo-large">⚡</div>
            <div class="team-name">${gameData.awayTeam.name}</div>
          </div>
        </div>
        
        <div class="game-options">
          <h4>Estratégia do Jogo</h4>
          <div class="strategy-options">
            <button class="strategy-btn" data-strategy="balanced">
              <i class="fas fa-balance-scale"></i>
              <span>Equilibrado</span>
            </button>
            <button class="strategy-btn" data-strategy="offensive">
              <i class="fas fa-bolt"></i>
              <span>Ofensivo</span>
            </button>
            <button class="strategy-btn" data-strategy="defensive">
              <i class="fas fa-shield-alt"></i>
              <span>Defensivo</span>
            </button>
          </div>
          
          <div class="game-predictions">
            <h5>Previsões:</h5>
            <p>${this.getGamePrediction(gameData)}</p>
          </div>
          
          <button id="btn-play-game" class="btn-control btn-play">
            <i class="fas fa-play-circle"></i>
            <span>JOGAR</span>
          </button>
        </div>
      `;
      
      // Adicionar event listeners aos botões de estratégia
      content.querySelectorAll('.strategy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          content.querySelectorAll('.strategy-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });
      
      // Botão para jogar
      const playBtn = content.querySelector('#btn-play-game');
      if (playBtn) {
        playBtn.addEventListener('click', () => {
          closeModal('game-details-modal');
          this.handleSimulateGame(gameData);
        });
      }
    }
    
    // Mostrar modal
    modal.classList.add('active');
    overlay.classList.add('active');
    
    // Configurar botão de fechar
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.onclick = () => this.closeModal('game-details-modal');
    }
    
    // Configurar overlay para fechar
    overlay.onclick = () => this.closeModal('game-details-modal');
  }

  getGamePrediction(gameData) {
    const homePower = this.gameEngine.calculateTeamPower(gameData.homeTeam);
    const awayPower = this.gameEngine.calculateTeamPower(gameData.awayTeam);
    
    if (homePower > awayPower + 10) {
      return `${gameData.homeTeam.name} é forte favorito em casa.`;
    } else if (awayPower > homePower + 10) {
      return `${gameData.awayTeam.name} vem confiante para esta partida.`;
    } else {
      return 'Jogo equilibrado, qualquer resultado é possível.';
    }
  }

  handleViewRoster() {
    console.log('[MBA] Visualizando roster');
    
    if (!this.gameEngine) return;
    
    const gameState = this.gameEngine.getState();
    const userTeam = this.gameEngine.getUserTeamInfo();
    
    if (!userTeam) {
      this.feedbackSystem.showToast('Selecione uma equipa primeiro', 'warning');
      return;
    }
    
    // Mostrar modal de roster
    this.showRosterModal(userTeam, gameState);
  }

  showRosterModal(userTeam, gameState) {
    const modal = document.getElementById('roster-management-modal') || 
                  this.createRosterModal();
    const overlay = document.getElementById('modal-overlay');
    
    if (!modal || !overlay) return;
    
    // Preencher com dados do roster
    const content = modal.querySelector('.modal-content');
    if (content && userTeam.roster) {
      content.innerHTML = `
        <div class="roster-management">
          <div class="roster-header">
            <h4>${userTeam.name} - Plantel Completo</h4>
            <div class="roster-stats">
              <span class="stat">Química: ${gameState.teamChemistry || 75}</span>
              <span class="stat">Orçamento: $${Math.round(userTeam.finances?.capSpace || 0).toLocaleString()}</span>
            </div>
          </div>
          
          <div class="roster-positions">
            ${this.generateRosterByPosition(userTeam.roster.players)}
          </div>
          
          <div class="roster-actions">
            <h5>Ações:</h5>
            <div class="action-buttons">
              <button class="btn-control btn-small" onclick="window.uiManager?.handleTrainPlayerPrompt()">
                <i class="fas fa-dumbbell"></i> Treinar Jogador
              </button>
              <button class="btn-control btn-small" onclick="window.uiManager?.handleSetLineupPrompt()">
                <i class="fas fa-chess-board"></i> Alterar Titulares
              </button>
            </div>
          </div>
        </div>
      `;
    }
    
    modal.classList.add('active');
    overlay.classList.add('active');
  }

  generateRosterByPosition(players) {
    const positions = {
      PG: { title: 'Base', players: [] },
      SG: { title: 'Escola', players: [] },
      SF: { title: 'Ala', players: [] },
      PF: { title: 'Ala-Pivô', players: [] },
      C: { title: 'Pivô', players: [] }
    };
    
    players.forEach(player => {
      if (positions[player.position]) {
        positions[player.position].players.push(player);
      }
    });
    
    let html = '';
    Object.entries(positions).forEach(([pos, data]) => {
      if (data.players.length > 0) {
        html += `
          <div class="position-group">
            <h6>${data.title} (${pos})</h6>
            <div class="players-list">
              ${data.players.map(player => `
                <div class="player-row ${player.isStarter ? 'starter' : ''}">
                  <span class="player-name">${player.name}</span>
                  <span class="player-rating">${player.rating}</span>
                  <span class="player-salary">$${(player.salary / 1000000).toFixed(1)}M</span>
                  ${player.injury ? '<span class="badge-injured">Lesionado</span>' : ''}
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }
    });
    
    return html;
  }

  createRosterModal() {
    const modal = document.createElement('div');
    modal.id = 'roster-management-modal';
    modal.className = 'modal modal-lg';
    modal.innerHTML = `
      <div class="modal-header">
        <h3><i class="fas fa-chess-board"></i> GESTÃO DE PLANTEL</h3>
        <button class="modal-close"><i class="fas fa-times"></i></button>
      </div>
      <div class="modal-content"></div>
      <div class="modal-footer">
        <button class="btn-control" onclick="window.uiManager?.closeModal('roster-management-modal')">
          Fechar
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
    return modal;
  }

  handleTrainPlayer(payload) {
    console.log('[MBA] Treinando jogador:', payload);
    
    if (!this.gameEngine) return;
    
    try {
      const result = this.gameEngine.dispatch({
        type: ACTION_TYPES.TRAIN_PLAYER,
        payload
      });
      
      if (result.success) {
        this.feedbackSystem.showToast(
          `Jogador treinado com sucesso! +${Object.values(result.improvements)[0]} atributo`,
          'success'
        );
        
        // Animar atualização
        this.animationManager.executeTransition();
        
        setTimeout(() => this.render(), 500);
      }
    } catch (error) {
      console.error('[MBA] Erro em handleTrainPlayer:', error);
      this.feedbackSystem.showToast(`Erro no treino: ${error.message}`, 'error');
    }
  }

  handleTrainPlayerPrompt() {
    // Implementar interface para selecionar jogador e tipo de treino
    const players = this.getUserTeamPlayers();
    
    if (players.length === 0) {
      this.feedbackSystem.showToast('Nenhum jogador disponível', 'warning');
      return;
    }
    
    // Simples por enquanto - treinar o primeiro jogador
    this.handleTrainPlayer({
      playerId: players[0].id,
      trainingType: 'balanced'
    });
  }

  getUserTeamPlayers() {
    if (!this.gameEngine) return [];
    
    const gameState = this.gameEngine.getState();
    const userTeam = this.gameEngine.getUserTeamInfo();
    
    return userTeam?.roster?.players || [];
  }

  handleSetLineup(payload) {
    console.log('[MBA] Definindo lineup:', payload);
    
    if (!this.gameEngine) return;
    
    try {
      const result = this.gameEngine.dispatch({
        type: ACTION_TYPES.SET_LINEUP,
        payload
      });
      
      if (result.success) {
        this.feedbackSystem.showToast(
          'Titulares alterados com sucesso!',
          'success'
        );
        
        setTimeout(() => this.render(), 500);
      }
    } catch (error) {
      console.error('[MBA] Erro em handleSetLineup:', error);
      this.feedbackSystem.showToast(`Erro: ${error.message}`, 'error');
    }
  }

  handleSetLineupPrompt() {
    // Implementar interface para definir titulares
    this.feedbackSystem.showToast('Funcionalidade em desenvolvimento', 'info');
  }

  handleViewHistory() {
    console.log('[MBA] Visualizando histórico');
    
    if (!this.gameEngine) return;
    
    try {
      const gameState = this.gameEngine.getState();
      const userHistory = gameState.userGameHistory || [];
      
      this.dispatchViewUpdate({
        type: 'HISTORY',
        data: {
          userHistory: userHistory.slice(-20), // Últimos 20 jogos
          totalGames: userHistory.length,
          wins: userHistory.filter(game => {
            const isHome = game.homeTeam.id === gameState.playerTeamId;
            return (isHome && game.result.winner === 'home') || 
                   (!isHome && game.result.winner === 'away');
          }).length || 0
        }
      });
    } catch (error) {
      console.error('[MBA] Erro em handleViewHistory:', error);
    }
  }

  handleViewSchedule() {
    this.feedbackSystem.showToast('Calendário em desenvolvimento', 'info');
  }

  handleManageRoster(action) {
    console.log('[MBA] Gerindo roster:', action);
    this.feedbackSystem.showToast('Gestão de plantel em desenvolvimento', 'info');
  }

  handleSignFreeAgent() {
    this.feedbackSystem.showToast('Free agency em desenvolvimento', 'info');
  }

  // ==================== SISTEMA DE SIMULAÇÃO ====================
  startAutoSimulation() {
    console.log('[MBA] Iniciando simulação automática');
    
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
    console.log('[MBA] Parando simulação automática');
    
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
    console.log('[MBA] dispatchViewUpdate:', {
      type: payload.type,
      data: payload.data ? 'DATA PRESENT' : 'NO DATA',
      timestamp: Date.now()
    });
    
    // 1. Tentar via função de renderização anexada
    if (this.renderFunction) {
      try {
        this.renderFunction(payload);
        console.log('[MBA] Renderizado via renderFunction');
      } catch (error) {
        console.error('[MBA] Erro no renderFunction:', error);
      }
    } else {
      console.warn('[MBA] renderFunction não disponível');
    }
    
    // 2. Tentar via sistema global (para compatibilidade)
    if (window.onUIUpdate) {
      try {
        window.onUIUpdate(payload);
        console.log('[MBA] Enviado via window.onUIUpdate');
      } catch (error) {
        console.error('[MBA] Erro no window.onUIUpdate:', error);
      }
    } else {
      console.warn('[MBA] window.onUIUpdate não disponível');
    }
    
    // 3. Disparar evento customizado
    try {
      const event = new CustomEvent('mba:ui-update', {
        detail: payload
      });
      document.dispatchEvent(event);
      console.log('[MBA] Evento mba:ui-update disparado');
    } catch (error) {
      console.error('[MBA] Erro ao disparar evento:', error);
    }
  }

  updateStatus(message, type = 'info') {
    this.dispatchViewUpdate({
      type: 'STATUS_UPDATE',
      data: { message, type }
    });
    
    // Também mostrar toast se for importante
    if (type === 'error' || type === 'success') {
      this.feedbackSystem.showToast(message, type);
    }
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
    console.log('[MBA] attachRenderer chamado');
    this.renderFunction = renderFunction;
    
    // Se já estiver inicializado, renderizar imediatamente
    if (this.initialized) {
      console.log('[MBA] Renderizando após attach (já inicializado)');
      this.render();
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modal-overlay');
    
    if (modal) modal.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
  }

  // Método de diagnóstico
  diagnose() {
    return {
      timestamp: Date.now(),
      uiManager: {
        initialized: this.initialized,
        currentView: this.uiState.currentView,
        gameEngineAvailable: !!this.gameEngine,
        renderFunctionAvailable: !!this.renderFunction,
        feedbackSystem: !!this.feedbackSystem,
        animationManager: !!this.animationManager
      },
      window: {
        onUIUpdate: typeof window.onUIUpdate,
        uiManager: typeof window.uiManager,
        gameEngine: typeof window.gameEngine,
        feedbackSystem: typeof window.feedbackSystem
      },
      document: {
        readyState: document.readyState,
        hidden: document.hidden
      }
    };
  }
}

// ==================== DATA MANAGER ====================
class DataManager {
  constructor() {
    this.cache = new Map();
    this.statsHistory = [];
  }
  
  async loadAdvancedStats() {
    // Placeholder para estatísticas avançadas
    return {
      leagueTrends: [],
      playerComparisons: [],
      teamMatchups: []
    };
  }
  
  generateScoutingReport(teamId) {
    return {
      strengths: ['Ofensiva', 'Defesa interior'],
      weaknesses: ['Rotação curta', 'Arremesso de 3'],
      tendencies: {
        offense: { pace: 'rápido', focus: 'pintura' },
        defense: { style: 'homem-a-homem', pressure: 'média' }
      },
      keyPlayers: [],
      matchupAdvice: 'Forçar arremessos de longa distância'
    };
  }
  
  calculateSynergy(players) {
    // Simulação simples de sinergia
    let synergy = 50;
    
    // Fatores básicos
    const positions = players.map(p => p.position);
    const uniquePositions = new Set(positions).size;
    synergy += uniquePositions * 5;
    
    // Arquétipos complementares
    const archetypes = players.map(p => p.archetype);
    const hasPlaymaker = archetypes.some(a => a.includes('Sabedoria') || a.includes('Magia'));
    const hasDefender = archetypes.some(a => a.includes('Proteção') || a.includes('Ordem'));
    
    if (hasPlaymaker && hasDefender) synergy += 15;
    
    return Math.min(100, synergy);
  }
}

// ==================== INICIALIZAÇÃO GLOBAL ====================
let uiManager = null;

document.addEventListener('DOMContentLoaded', () => {
  console.log('[MBA] DOMContentLoaded disparado');
  console.log('[MBA] Documento pronto:', {
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
  
  console.log('[MBA] Elementos críticos do DOM:', criticalElements);
  
  // Criar e inicializar UIManager
  uiManager = new UIManager();
  
  // Expor globalmente
  window.uiManager = uiManager;
  window.feedbackSystem = uiManager.feedbackSystem;
  console.log('[MBA] Sistemas expostos globalmente');
  
  // Adicionar listener para eventos customizados
  document.addEventListener('mba:request-diagnosis', () => {
    console.log('[MBA] Diagnóstico solicitado');
    if (uiManager) {
      const diagnosis = uiManager.diagnose();
      console.log('[MBA] Resultado do diagnóstico:', diagnosis);
      
      // Disparar evento com resultados
      const event = new CustomEvent('mba:diagnosis-result', {
        detail: diagnosis
      });
      document.dispatchEvent(event);
    }
  });
  
  // Iniciar após pequeno delay
  setTimeout(() => {
    console.log('[MBA] Iniciando UIManager...');
    uiManager.initialize().catch(error => {
      console.error('[MBA] Erro na inicialização:', error);
      
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
  console.log('[MBA] Diagnóstico manual solicitado');
  
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
  console.log('[MBA] Renderização forçada');
  if (window.uiManager && window.uiManager.render) {
    window.uiManager.render();
  }
};

// Função para testar comunicação
window.mbaTestCommunication = function() {
  console.log('[MBA] Teste de comunicação');
  
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

console.log('[MBA] main.js carregado com sucesso');

// Exportar para uso em módulos
export { uiManager };