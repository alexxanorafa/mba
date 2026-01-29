// game.js - MOTOR PURO (ZERO HTML/CSS) - VERSÃO MELHORADA
// ============================================================
// ARQUITETURA SÉRIA: Máquina de estados, turn-based, estado único
// ============================================================

export const GAME_PHASES = {
  INIT: 'INIT',
  TEAM_SELECTION: 'TEAM_SELECTION',
  REGULAR_SEASON: 'REGULAR_SEASON',
  PLAYOFFS: 'PLAYOFFS',
  FINALS: 'FINALS',
  OFFSEASON: 'OFFSEASON',
  OFFSEASON_ACTIVITIES: 'OFFSEASON_ACTIVITIES',
  DRAFT: 'DRAFT',
  FREE_AGENCY: 'FREE_AGENCY',
  FINISHED: 'FINISHED'
};

export const ACTION_TYPES = {
  SELECT_TEAM: 'SELECT_TEAM',
  SIMULATE_DAY: 'SIMULATE_DAY',
  PLAYER_GAME: 'PLAYER_GAME',
  SET_SPEED: 'SET_SPEED',
  TOGGLE_AUTO: 'TOGGLE_AUTO',
  CHANGE_TACTICS: 'CHANGE_TACTICS',
  ACCEPT_JOB_OFFER: 'ACCEPT_JOB_OFFER',
  REJECT_JOB_OFFER: 'REJECT_JOB_OFFER',
  MANAGE_ROSTER: 'MANAGE_ROSTER',
  SET_LINEUP: 'SET_LINEUP',
  TRAIN_PLAYER: 'TRAIN_PLAYER',
  TRADE_PLAYER: 'TRADE_PLAYER',
  SIGN_FREE_AGENT: 'SIGN_FREE_AGENT',
  DRAFT_PLAYER: 'DRAFT_PLAYER'
};

// Sistema de cache para otimização
class GameCache {
  constructor() {
    this.teamPowerCache = new Map();
    this.matchupCache = new Map();
    this.standingsCache = null;
    this.playerPowerCache = new Map();
    this.cacheTTL = 30000; // 30 segundos
  }
  
  getTeamPower(teamId) {
    const cached = this.teamPowerCache.get(teamId);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.value;
    }
    return null;
  }
  
  setTeamPower(teamId, power) {
    this.teamPowerCache.set(teamId, {
      value: power,
      timestamp: Date.now()
    });
  }
  
  getPlayerPower(playerId) {
    const cached = this.playerPowerCache.get(playerId);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.value;
    }
    return null;
  }
  
  setPlayerPower(playerId, power) {
    this.playerPowerCache.set(playerId, {
      value: power,
      timestamp: Date.now()
    });
  }
  
  invalidateCache() {
    this.teamPowerCache.clear();
    this.matchupCache.clear();
    this.playerPowerCache.clear();
    this.standingsCache = null;
  }
}

export class GameEngine {
  constructor(gameData) {
    this.cache = new GameCache();
    
    this.state = {
      phase: GAME_PHASES.INIT,
      seasonYear: gameData?.seasonYear || 2026,
      currentDay: 1,
      totalDays: 82,
      
      teams: [],
      playerTeamId: null,
      userReputation: 50,
      userRole: 'Head Coach',
      
      conferences: { EAST: [], WEST: [] },
      standings: { EAST: [], WEST: [] },
      schedule: [],
      
      simulationSpeed: 1,
      autoSimulate: true,
      isSimulationRunning: false,
      
      gameHistory: [],
      userGameHistory: [],
      transactionLog: [],
      liveFeed: [],
      jobOffers: [],
      
      pendingActions: [],
      lastError: null,
      
      // NOVOS: Sistema avançado
      depthChart: {},
      playerDevelopment: {},
      teamChemistry: 75,
      fanSupport: 50,
      salaryCap: 109000000,
      luxuryTaxThreshold: 132000000,
      draftPicks: [],
      freeAgents: [],
      injuryList: [],
      teamFinances: {},
      playerMorale: {},
      teamTactics: {
        offense: 'balanced',
        defense: 'man',
        pace: 'normal',
        focus: 'balanced'
      },
      
      // Sistema de prémios
      seasonAwards: null,
      statLeaders: null,
      
      // Cache interno
      _lastUpdate: Date.now(),
      _dirtyFlags: {
        standings: true,
        teamPower: true,
        schedule: true
      }
    };
    
    if (gameData) this.init(gameData);
  }

  // ==================== INICIALIZAÇÃO ====================
  init(gameData) {
    if (!gameData?.teams) {
      this.state.lastError = 'Dados inválidos';
      return false;
    }

    this.state.teams = this.createTeams(gameData);
    this.organizeConferences();
    this.generateSchedule();
    this.updateStandings();
    this.initializeAdvancedSystems();
    this.state.phase = GAME_PHASES.TEAM_SELECTION;
    
    return true;
  }

  // ADICIONE ESTA FUNÇÃO QUE ESTAVA FALTANDO:
  organizeConferences() {
    this.state.conferences = { EAST: [], WEST: [] };
    this.state.teams.forEach(team => {
      if (team.conference && this.state.conferences[team.conference]) {
        this.state.conferences[team.conference].push(team.id);
      }
    });
  }

  // ==================== NOVOS SISTEMAS ====================
  initializeAdvancedSystems() {
    // Inicializar sistemas avançados
    this.state.teams.forEach(team => {
      this.state.depthChart[team.id] = this.getOptimalRotation(team.players);
      this.state.teamFinances[team.id] = {
        salaryTotal: team.players.reduce((sum, p) => sum + (p.salary || 5000000), 0),
        luxuryTax: 0,
        budget: 150000000,
        revenue: 0
      };
      
      // Inicializar moral dos jogadores
      team.players.forEach(player => {
        this.state.playerMorale[player.id] = player.morale || 70;
      });
    });
    
    // Gerar free agents iniciais
    this.generateFreeAgents();
    
    // Preparar draft
    this.prepareDraft();
  }

  generateFreeAgents() {
    const freeAgents = [];
    const archetypes = ['Força', 'Sabedoria', 'Velocidade', 'Magia', 'Proteção', 'Natureza', 'Luz', 'Sombra', 'Ordem', 'Fogo', 'Caos'];
    const positions = ['PG', 'SG', 'SF', 'PF', 'C'];
    
    for (let i = 0; i < 50; i++) {
      const archetype = archetypes[Math.floor(Math.random() * archetypes.length)];
      const position = positions[Math.floor(Math.random() * positions.length)];
      const age = 20 + Math.floor(Math.random() * 12);
      
      freeAgents.push({
        id: `fa-${i + 1}`,
        name: `Free Agent ${i + 1}`,
        position,
        archetype,
        age,
        attributes: this.generateAttributes(archetype, {}),
        salaryDemand: 2000000 + Math.random() * 10000000,
        yearsDemand: 1 + Math.floor(Math.random() * 4),
        rating: 60 + Math.random() * 30
      });
    }
    
    this.state.freeAgents = freeAgents;
  }

  prepareDraft() {
    const draftPicks = [];
    for (let round = 1; round <= 2; round++) {
      for (let pick = 1; pick <= 30; pick++) {
        draftPicks.push({
          round,
          pick,
          originalTeam: pick,
          currentTeam: pick,
          player: null
        });
      }
    }
    this.state.draftPicks = draftPicks;
  }

  // ==================== MÁQUINA DE ESTADOS ====================
  dispatch(action) {
    try {
      console.log(`[ENGINE] Action: ${action.type}`, action.payload);
      
      switch (action.type) {
        case ACTION_TYPES.SELECT_TEAM:
          return this.handleSelectTeam(action.payload);
        case ACTION_TYPES.SIMULATE_DAY:
          return this.handleSimulateDay(action.payload);
        case ACTION_TYPES.PLAYER_GAME:
          return this.handlePlayerGame(action.payload);
        case ACTION_TYPES.SET_SPEED:
          return this.handleSetSpeed(action.payload);
        case ACTION_TYPES.TOGGLE_AUTO:
          return this.handleToggleAuto(action.payload);
        case ACTION_TYPES.ACCEPT_JOB_OFFER:
          return this.handleAcceptJobOffer(action.payload);
        case ACTION_TYPES.MANAGE_ROSTER:
          return this.handleManageRoster(action.payload);
        case ACTION_TYPES.TRAIN_PLAYER:
          return this.handleTrainPlayer(action.payload);
        case ACTION_TYPES.SET_LINEUP:
          return this.handleSetLineup(action.payload);
        default:
          throw new Error(`Ação desconhecida: ${action.type}`);
      }
    } catch (error) {
      this.state.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  // ==================== HANDLERS AVANÇADOS ====================
  handleManageRoster(payload) {
    const { teamId, action, playerId, targetId } = payload;
    const team = this.state.teams.find(t => t.id === teamId);
    
    if (!team) {
      throw new Error('Equipa não encontrada');
    }
    
    switch (action) {
      case 'move_player':
        // Mover jogador na depth chart
        const player = team.players.find(p => p.id === playerId);
        if (player) {
          // Implementar lógica de movimento
          this.cache.invalidateCache();
          return { success: true, message: 'Jogador movido' };
        }
        break;
        
      case 'bench_player':
        // Colocar jogador no banco
        return { success: true, message: 'Jogador no banco' };
        
      case 'start_player':
        // Colocar jogador a titular
        return { success: true, message: 'Jogador a titular' };
        
      default:
        throw new Error('Ação de gestão desconhecida');
    }
    
    return { success: false, error: 'Operação falhou' };
  }

  handleTrainPlayer(payload) {
    const { playerId, trainingType } = payload;
    
    // Encontrar jogador
    let targetPlayer = null;
    let targetTeam = null;
    
    for (const team of this.state.teams) {
      const player = team.players.find(p => p.id === playerId);
      if (player) {
        targetPlayer = player;
        targetTeam = team;
        break;
      }
    }
    
    if (!targetPlayer) {
      throw new Error('Jogador não encontrado');
    }
    
    // Verificar energia
    if (targetPlayer.energy < 30) {
      return { 
        success: false, 
        error: 'Jogador sem energia suficiente para treinar' 
      };
    }
    
    // Efeitos do treino
    const trainingEffects = {
      'strength': { forca: [2, 5], stamina: [1, 3] },
      'shooting': { tecnica: [3, 6], disciplina: [1, 2] },
      'playmaking': { criatividade: [3, 6], tecnica: [1, 3] },
      'defense': { disciplina: [3, 6], forca: [1, 3] },
      'speed': { velocidade: [3, 7], stamina: [1, 2] },
      'mental': { aura: [2, 5], criatividade: [1, 3] }
    };
    
    const effect = trainingEffects[trainingType];
    if (!effect) {
      throw new Error('Tipo de treino inválido');
    }
    
    const improvements = {};
    
    // Aplicar melhorias
    Object.keys(effect).forEach(attr => {
      const [min, max] = effect[attr];
      const improvement = Math.floor(Math.random() * (max - min + 1)) + min;
      targetPlayer.attributes[attr] = Math.min(99, 
        (targetPlayer.attributes[attr] || 50) + improvement
      );
      improvements[attr] = improvement;
    });
    
    // Consumir energia
    targetPlayer.energy -= 30;
    
    // Chance de melhorar moral
    if (Math.random() > 0.7) {
      targetPlayer.morale = Math.min(100, targetPlayer.morale + 5);
    }
    
    // Atualizar cache
    this.cache.invalidateCache();
    this.state._dirtyFlags.teamPower = true;
    
    // Registar no histórico
    this.state.transactionLog.push({
      type: 'player_training',
      player: targetPlayer.name,
      team: targetTeam.name,
      training: trainingType,
      improvements,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      improvements,
      newAttributes: { ...targetPlayer.attributes },
      energy: targetPlayer.energy,
      morale: targetPlayer.morale
    };
  }

  handleSetLineup(payload) {
    const { teamId, starters, rotationOrder } = payload;
    const team = this.state.teams.find(t => t.id === teamId);
    
    if (!team) {
      throw new Error('Equipa não encontrada');
    }
    
    // Validar que todos os jogadores são da equipa
    const allPlayers = [...starters, ...rotationOrder];
    const invalidPlayer = allPlayers.find(playerId => 
      !team.players.some(p => p.id === playerId)
    );
    
    if (invalidPlayer) {
      throw new Error('Jogador não pertence à equipa');
    }
    
    // Atualizar depth chart
    this.state.depthChart[teamId] = {
      starters,
      rotation: rotationOrder,
      bench: team.players
        .filter(p => !allPlayers.includes(p.id))
        .map(p => p.id)
    };
    
    // Atualizar química da equipa
    this.updateTeamChemistry(teamId);
    
    // Invalida cache
    this.cache.invalidateCache();
    this.state._dirtyFlags.teamPower = true;
    
    return {
      success: true,
      depthChart: this.state.depthChart[teamId],
      teamChemistry: this.state.teamChemistry
    };
  }

  // ==================== HANDLERS EXISTENTES (MELHORADOS) ====================
  handleSelectTeam(payload) {
    if (this.state.phase !== GAME_PHASES.TEAM_SELECTION) {
      throw new Error('Não é possível selecionar equipa nesta fase');
    }

    const team = this.state.teams.find(t => t.id === payload.teamId);
    if (!team) throw new Error('Equipa não encontrada');

    this.state.playerTeamId = team.id;
    this.state.userReputation = this.calculateInitialReputation(team);
    this.state.phase = GAME_PHASES.REGULAR_SEASON;
    
    // Inicializar sistemas específicos da equipa do usuário
    this.initializeUserTeamSystems(team.id);
    
    return {
      success: true,
      team: this.getTeamInfo(team.id),
      reputation: this.state.userReputation,
      chemistry: this.state.teamChemistry,
      finances: this.state.teamFinances[team.id]
    };
  }

  initializeUserTeamSystems(teamId) {
    // Garantir que a depth chart existe
    if (!this.state.depthChart[teamId]) {
      const team = this.state.teams.find(t => t.id === teamId);
      this.state.depthChart[teamId] = {
        starters: team.players.slice(0, 5).map(p => p.id),
        rotation: team.players.slice(5, 10).map(p => p.id),
        bench: team.players.slice(10).map(p => p.id)
      };
    }
    
    // Inicializar moral dos jogadores
    const team = this.state.teams.find(t => t.id === teamId);
    team.players.forEach(player => {
      if (!this.state.playerMorale[player.id]) {
        this.state.playerMorale[player.id] = player.morale || 70;
      }
    });
    
    // Calcular química inicial
    this.updateTeamChemistry(teamId);
  }

  handleSimulateDay(payload) {
    const day = payload.day || this.state.currentDay;
    const result = this.simulateDay(day);
    
    if (result.success && !result.userGame) {
      this.state.currentDay++;
      
      // Verificar lesões
      if (Math.random() < 0.1) { // 10% de chance por dia
        this.checkInjuries();
      }
      
      // Atualizar energia dos jogadores
      this.updatePlayerEnergy();
      
      // Atualizar moral baseada em desempenho
      this.updatePlayerMorale();
      
      if (this.state.currentDay > this.state.totalDays && this.state.phase === GAME_PHASES.REGULAR_SEASON) {
        this.state.phase = GAME_PHASES.PLAYOFFS;
        this.setupPlayoffs();
      }
    }
    
    return result;
  }

  // ==================== LÓGICA DO JOGO AVANÇADA ====================
  simulateDay(dayNumber) {
    const daySchedule = this.state.schedule.find(d => d.day === dayNumber);
    if (!daySchedule) return { success: false, error: `Dia ${dayNumber} não encontrado` };

    const results = [];
    let userGame = null;

    for (const game of daySchedule.games) {
      if (game.played) continue;

      const homeTeam = this.state.teams.find(t => t.id === game.homeTeamId);
      const awayTeam = this.state.teams.find(t => t.id === game.awayTeamId);
      const isUserGame = this.state.playerTeamId && 
                        (game.homeTeamId === this.state.playerTeamId || game.awayTeamId === this.state.playerTeamId);

      if (isUserGame && !this.state.autoSimulate) {
        userGame = { game, homeTeam, awayTeam, day: dayNumber };
        continue;
      }

      // Usar simulação detalhada se disponível
      const gameResult = this.simulateDetailedGame(homeTeam, awayTeam);
      game.played = true;
      game.result = gameResult.result;
      game.events = gameResult.events;
      game.detailedStats = gameResult.detailedStats;

      this.updateTeamsAfterGame(homeTeam, awayTeam, gameResult);
      this.recordGameInHistory(gameResult, homeTeam, awayTeam, dayNumber, isUserGame);

      results.push(gameResult);
    }

    daySchedule.completed = !userGame;
    this.updateStandings();
    this.checkJobOffers();
    
    // Atualizar química após jogos
    if (this.state.playerTeamId) {
      this.updateTeamChemistry(this.state.playerTeamId);
    }

    return {
      success: true,
      day: dayNumber,
      results,
      userGame,
      standings: this.state.standings,
      chemistry: this.state.teamChemistry,
      injuries: this.state.injuryList.filter(i => i.returnDate === `Day ${dayNumber + 1}`)
    };
  }

  simulateDetailedGame(homeTeam, awayTeam) {
    // Calcular poder com cache
    const homePower = this.calculateTeamPowerWithCache(homeTeam);
    const awayPower = this.calculateTeamPowerWithCache(awayTeam);
    
    // Fatores de modificação
    const homeAdvantage = 1.05;
    const formFactor = (homeTeam.formFactor || 1.0) / (awayTeam.formFactor || 1.0);
    const chemistryFactor = 1.0 + ((this.state.teamChemistry || 50) - 50) * 0.002;
    
    // Simulação por quartos
    const quarters = [];
    let homeScore = 0, awayScore = 0;
    
    for (let q = 1; q <= 4; q++) {
      // Base score ajustada por poder
      const baseScore = 20 + Math.random() * 10;
      const powerDiff = (homePower - awayPower) * 0.1;
      
      const homeQuarter = Math.round(
        baseScore * homeAdvantage * formFactor * chemistryFactor + 
        powerDiff + (Math.random() * 5)
      );
      
      const awayQuarter = Math.round(
        baseScore + (Math.random() * 5) - powerDiff
      );
      
      quarters.push({ quarter: q, home: homeQuarter, away: awayQuarter });
      homeScore += homeQuarter;
      awayScore += awayQuarter;
    }
    
    // Overtime se necessário
    let overtime = null;
    if (homeScore === awayScore) {
      const otHome = Math.round(5 + Math.random() * 8);
      const otAway = Math.round(5 + Math.random() * 8);
      homeScore += otHome;
      awayScore += otAway;
      overtime = { home: otHome, away: otAway };
    }
    
    // Gerar estatísticas detalhadas
    const stats = this.generateGameStats(homeTeam, awayTeam, homeScore, awayScore);
    
    // Gerar highlights
    const highlights = this.generateHighlights(homeTeam, awayTeam);
    
    const result = {
      homePoints: homeScore,
      awayPoints: awayScore,
      winner: homeScore > awayScore ? 'home' : 'away',
      quarters: 4,
      isOvertime: !!overtime,
      overtime
    };

    return { 
      result, 
      events: highlights,
      detailedStats: {
        quarters,
        playerStats: stats,
        teamStats: {
          home: { points: homeScore, rebounds: Math.floor(Math.random() * 50) + 30 },
          away: { points: awayScore, rebounds: Math.floor(Math.random() * 50) + 30 }
        }
      }
    };
  }

  calculateTeamPowerWithCache(team) {
    // Tentar obter do cache primeiro
    const cachedPower = this.cache.getTeamPower(team.id);
    if (cachedPower !== null) {
      return cachedPower;
    }
    
    // Calcular se não estiver em cache
    const power = this.calculateTeamPower(team);
    this.cache.setTeamPower(team.id, power);
    return power;
  }

  generateGameStats(homeTeam, awayTeam, homeScore, awayScore) {
    const stats = {
      home: [],
      away: []
    };
    
    // Gerar stats para jogadores titulares
    const homeStarters = this.state.depthChart[homeTeam.id]?.starters?.slice(0, 5) || 
                        homeTeam.players.slice(0, 5);
    const awayStarters = this.state.depthChart[awayTeam.id]?.starters?.slice(0, 5) || 
                        awayTeam.players.slice(0, 5);
    
    homeStarters.forEach(playerId => {
      const player = homeTeam.players.find(p => p.id === playerId);
      if (player) {
        stats.home.push(this.generatePlayerStats(player, homeScore > awayScore));
      }
    });
    
    awayStarters.forEach(playerId => {
      const player = awayTeam.players.find(p => p.id === playerId);
      if (player) {
        stats.away.push(this.generatePlayerStats(player, awayScore > homeScore));
      }
    });
    
    return stats;
  }

  generatePlayerStats(player, teamWon) {
    const basePoints = 5 + Math.random() * 25;
    const multiplier = (this.calculatePlayerPower(player) / 100) * (teamWon ? 1.2 : 0.9);
    
    return {
      player: player.name,
      points: Math.round(basePoints * multiplier),
      rebounds: Math.round(2 + Math.random() * 12),
      assists: Math.round(1 + Math.random() * 10),
      steals: Math.round(Math.random() * 4),
      blocks: Math.round(Math.random() * 3),
      turnovers: Math.round(Math.random() * 5),
      minutes: Math.round(20 + Math.random() * 28),
      rating: Math.round(50 + Math.random() * 40)
    };
  }

  generateHighlights(homeTeam, awayTeam) {
    const highlights = [];
    const events = [
      `${homeTeam.players[0]?.name || 'Jogador'} marca um triple!`,
      `${awayTeam.players[0]?.name || 'Jogador'} com uma enterrada poderosa!`,
      `Excelente passe de ${homeTeam.players[1]?.name || 'Jogador'}`,
      `Defesa impressionante de ${awayTeam.players[1]?.name || 'Jogador'}`,
      `Cesto no último segundo!`
    ];
    
    // Gerar 3-5 highlights por jogo
    const numHighlights = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numHighlights; i++) {
      highlights.push({
        quarter: Math.floor(Math.random() * 4) + 1,
        time: `${Math.floor(Math.random() * 12)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
        text: events[Math.floor(Math.random() * events.length)]
      });
    }
    
    return highlights;
  }

  // ==================== SISTEMA DE LESIÕES ====================
  checkInjuries() {
    const injuryChance = 0.02; // 2% por jogo
    
    this.state.teams.forEach(team => {
      team.players.forEach(player => {
        if (player.injury) {
          // Reduzir tempo de lesão
          player.injury.gamesRemaining--;
          if (player.injury.gamesRemaining <= 0) {
            delete player.injury;
          }
          return;
        }
        
        if (Math.random() < injuryChance) {
          const injuryTypes = [
            { type: 'Leve', gamesOut: 1, severity: 1 },
            { type: 'Moderada', gamesOut: 5, severity: 2 },
            { type: 'Grave', gamesOut: 15, severity: 3 }
          ];
          const injury = injuryTypes[Math.floor(Math.random() * injuryTypes.length)];
          player.injury = { 
            ...injury, 
            gamesRemaining: injury.gamesOut 
          };
          
          this.state.injuryList.push({
            player: player.name,
            team: team.name,
            injury: injury.type,
            returnDate: `Day ${this.state.currentDay + injury.gamesOut}`,
            timestamp: new Date().toISOString()
          });
          
          // Adicionar ao feed
          this.state.liveFeed.push({
            timestamp: new Date().toISOString(),
            text: `🚑 ${player.name} lesionou-se! (${injury.type})`,
            type: 'injury'
          });
        }
      });
    });
  }

  updatePlayerEnergy() {
    this.state.teams.forEach(team => {
      team.players.forEach(player => {
        // Recuperar energia (5-15% por dia)
        const recovery = 5 + Math.random() * 10;
        player.energy = Math.min(100, player.energy + recovery);
      });
    });
  }

  updatePlayerMorale() {
    this.state.teams.forEach(team => {
      const winPct = team.stats.wins / (team.stats.games || 1);
      
      team.players.forEach(player => {
        // Base morale change based on team performance
        let moraleChange = 0;
        
        if (winPct > 0.6) {
          moraleChange = 1 + Math.random() * 2;
        } else if (winPct < 0.4) {
          moraleChange = -2 - Math.random() * 2;
        }
        
        // Playing time effect
        const isStarter = this.state.depthChart[team.id]?.starters?.includes(player.id);
        if (isStarter) {
          moraleChange += 1;
        }
        
        // Apply morale change
        player.morale = Math.max(20, Math.min(100, player.morale + moraleChange));
        this.state.playerMorale[player.id] = player.morale;
      });
    });
  }

  updateTeamChemistry(teamId) {
    const team = this.state.teams.find(t => t.id === teamId);
    if (!team) return;
    
    let chemistry = 50;
    
    // Fatores que afetam a química:
    
    // 1. Desempenho da equipa
    const winPct = team.stats.wins / (team.stats.games || 1);
    chemistry += (winPct - 0.5) * 20;
    
    // 2. Moral média dos jogadores
    const avgMorale = team.players.reduce((sum, p) => sum + (p.morale || 70), 0) / team.players.length;
    chemistry += (avgMorale - 70) * 0.5;
    
    // 3. Streak atual
    if (team.stats.streak > 3) chemistry += 5;
    if (team.stats.streak < -3) chemistry -= 5;
    
    // 4. Variação aleatória
    chemistry += (Math.random() * 10) - 5;
    
    // Limitar entre 0 e 100
    chemistry = Math.max(0, Math.min(100, chemistry));
    
    this.state.teamChemistry = Math.round(chemistry);
  }

  // ==================== FIM DA TEMPORADA ====================
  startOffseason() {
    this.state.phase = GAME_PHASES.OFFSEASON_ACTIVITIES;
    
    // Processar contractos
    this.processContracts();
    
    // Gerar lista de free agents
    this.generateFreeAgents();
    
    // Preparar draft
    this.prepareDraft();
    
    // Atualizar reputação baseada no desempenho
    this.updateEndOfSeasonReputation();
    
    // Calcular prémios
    this.calculateSeasonAwards();
    
    return {
      awards: this.state.seasonAwards,
      statLeaders: this.state.statLeaders,
      freeAgents: this.state.freeAgents.slice(0, 20),
      playerTeam: this.getUserTeamInfo()
    };
  }

  calculateSeasonAwards() {
    // Coletar estatísticas de todos os jogadores
    const allPlayers = [];
    this.state.teams.forEach(team => {
      team.players.forEach(player => {
        allPlayers.push({
          ...player,
          teamName: team.name,
          teamWins: team.stats.wins
        });
      });
    });
    
    // MVP - Maior poder + vitórias da equipa
    const mvp = allPlayers
      .sort((a, b) => {
        const aPower = this.calculatePlayerPower(a) * (a.teamWins / 41);
        const bPower = this.calculatePlayerPower(b) * (b.teamWins / 41);
        return bPower - aPower;
      })[0];
    
    // Rookie do Ano - Jogadores mais jovens com bom desempenho
    const rookies = allPlayers.filter(p => p.age < 22);
    const rookieOfTheYear = rookies
      .sort((a, b) => this.calculatePlayerPower(b) - this.calculatePlayerPower(a))[0];
    
    this.state.seasonAwards = {
      mvp: {
        player: mvp?.name || 'N/A',
        team: mvp?.teamName || 'N/A',
        rating: mvp ? Math.round(this.calculatePlayerPower(mvp)) : 0
      },
      rookieOfTheYear: {
        player: rookieOfTheYear?.name || 'N/A',
        team: rookieOfTheYear?.teamName || 'N/A',
        rating: rookieOfTheYear ? Math.round(this.calculatePlayerPower(rookieOfTheYear)) : 0
      },
      defensivePlayer: {
        player: allPlayers
          .sort((a, b) => (b.attributes.disciplina || 50) - (a.attributes.disciplina || 50))[0]?.name || 'N/A',
        team: allPlayers
          .sort((a, b) => (b.attributes.disciplina || 50) - (a.attributes.disciplina || 50))[0]?.teamName || 'N/A'
      },
      coachOfTheYear: {
        coach: 'Treinador do Ano',
        team: this.state.teams
          .sort((a, b) => b.stats.wins - a.stats.wins)[0]?.name || 'N/A'
      }
    };
    
    return this.state.seasonAwards;
  }

  updateEndOfSeasonReputation() {
    if (!this.state.playerTeamId) return;
    
    const userTeam = this.state.teams.find(t => t.id === this.state.playerTeamId);
    if (!userTeam) return;
    
    const winPct = userTeam.stats.wins / (userTeam.stats.games || 1);
    
    let repChange = 0;
    
    // Baseado em vitórias
    if (winPct > 0.6) repChange += 15;
    else if (winPct > 0.5) repChange += 5;
    else if (winPct < 0.3) repChange -= 10;
    
    // Playoffs
    if (this.state.phase === GAME_PHASES.PLAYOFFS || this.state.phase === GAME_PHASES.FINALS) {
      repChange += 20;
    }
    
    this.state.userReputation = Math.max(0, Math.min(100, 
      this.state.userReputation + repChange
    ));
  }

  processContracts() {
    this.state.teams.forEach(team => {
      team.players.forEach(player => {
        if (player.contractYears > 0) {
          player.contractYears--;
          
          // Se contrato terminou, tornar free agent
          if (player.contractYears === 0) {
            this.state.freeAgents.push({
              id: player.id,
              name: player.name,
              position: player.pos,
              archetype: player.archetype,
              attributes: player.attributes,
              salaryDemand: (player.salary || 5000000) * 1.1,
              yearsDemand: 3,
              rating: this.calculatePlayerPower(player),
              previousTeam: team.name
            });
          }
        }
      });
    });
  }

  // ==================== FUNÇÕES AUXILIARES (OTIMIZADAS) ====================
  calculateTeamPower(team) {
    // Usar cache se disponível
    if (!this.state._dirtyFlags.teamPower) {
      const cached = this.cache.getTeamPower(team.id);
      if (cached !== null) return cached;
    }
    
    if (!team.rotation || team.rotation.length === 0) {
      const power = 50;
      this.cache.setTeamPower(team.id, power);
      this.state._dirtyFlags.teamPower = false;
      return power;
    }
    
    // Calcular poder considerando lesões e moral
    let total = 0;
    let count = 0;
    
    const rotation = this.state.depthChart[team.id]?.starters || team.rotation;
    
    rotation.forEach(player => {
      const playerObj = team.players.find(p => p.id === player) || player;
      const playerPower = this.calculatePlayerPowerWithCache(playerObj);
      
      // Penalização por lesão
      const injuryPenalty = playerObj.injury ? 0.7 : 1.0;
      
      // Bonus/penalty por moral
      const moraleFactor = 0.8 + (playerObj.morale * 0.004);
      
      total += playerPower * injuryPenalty * moraleFactor;
      count++;
    });
    
    const power = count > 0 ? total / count : 50;
    
    // Aplicar fator de química
    const chemistryBonus = 1.0 + ((this.state.teamChemistry || 50) - 50) * 0.005;
    
    const finalPower = power * chemistryBonus;
    
    // Armazenar em cache
    this.cache.setTeamPower(team.id, finalPower);
    this.state._dirtyFlags.teamPower = false;
    
    return finalPower;
  }

  calculatePlayerPowerWithCache(player) {
    const cached = this.cache.getPlayerPower(player.id);
    if (cached !== null) return cached;
    
    const power = this.calculatePlayerPower(player);
    this.cache.setPlayerPower(player.id, power);
    return power;
  }

  calculatePlayerPower(player) {
    const attrs = player.attributes || {};
    const sum = (attrs.forca || 50) * 1.2 +
                (attrs.tecnica || 50) * 1.1 +
                (attrs.velocidade || 50) * 1.1 +
                (attrs.criatividade || 50) +
                (attrs.disciplina || 50) * 0.9 +
                (attrs.aura || 50) * 0.8;
    return sum / 6.1;
  }

  updateTeamsAfterGame(homeTeam, awayTeam, gameResult) {
    const { homePoints, awayPoints, winner } = gameResult.result;
    
    homeTeam.stats.games++;
    awayTeam.stats.games++;
    homeTeam.stats.pointsFor += homePoints;
    homeTeam.stats.pointsAgainst += awayPoints;
    awayTeam.stats.pointsFor += awayPoints;
    awayTeam.stats.pointsAgainst += homePoints;

    if (winner === 'home') {
      homeTeam.stats.wins++;
      homeTeam.stats.homeWins++;
      awayTeam.stats.losses++;
      homeTeam.form.push('W');
      awayTeam.form.push('L');
      homeTeam.stats.streak = homeTeam.stats.streak >= 0 ? homeTeam.stats.streak + 1 : 1;
      awayTeam.stats.streak = awayTeam.stats.streak <= 0 ? awayTeam.stats.streak - 1 : -1;
      
      // Bonus de moral para vencedores
      homeTeam.players.forEach(p => {
        p.morale = Math.min(100, p.morale + 1);
      });
      awayTeam.players.forEach(p => {
        p.morale = Math.max(20, p.morale - 2);
      });
    } else {
      awayTeam.stats.wins++;
      awayTeam.stats.awayWins++;
      homeTeam.stats.losses++;
      awayTeam.form.push('W');
      homeTeam.form.push('L');
      awayTeam.stats.streak = awayTeam.stats.streak >= 0 ? awayTeam.stats.streak + 1 : 1;
      homeTeam.stats.streak = homeTeam.stats.streak <= 0 ? homeTeam.stats.streak - 1 : -1;
      
      // Bonus/penalty de moral
      awayTeam.players.forEach(p => {
        p.morale = Math.min(100, p.morale + 1);
      });
      homeTeam.players.forEach(p => {
        p.morale = Math.max(20, p.morale - 2);
      });
    }

    if (homeTeam.form.length > 10) homeTeam.form.shift();
    if (awayTeam.form.length > 10) awayTeam.form.shift();
    
    // Reduzir energia dos jogadores
    homeTeam.players.forEach(p => {
      p.energy = Math.max(0, p.energy - (5 + Math.random() * 10));
    });
    awayTeam.players.forEach(p => {
      p.energy = Math.max(0, p.energy - (5 + Math.random() * 10));
    });
    
    // Invalidar cache
    this.cache.invalidateCache();
    this.state._dirtyFlags.teamPower = true;
    this.state._dirtyFlags.standings = true;
  }

  updateStandings() {
    // Usar cache se disponível
    if (!this.state._dirtyFlags.standings && this.state.standingsCache) {
      return;
    }
    
    ['EAST', 'WEST'].forEach(conf => {
      const teams = this.state.teams.filter(t => t.conference === conf);
      
      teams.sort((a, b) => {
        const winPctA = a.stats.wins / (a.stats.games || 1);
        const winPctB = b.stats.wins / (b.stats.games || 1);
        if (Math.abs(winPctB - winPctA) > 0.001) return winPctB - winPctA;
        
        // Desempate: confronto direto
        const headToHead = this.calculateHeadToHead(a.id, b.id);
        if (headToHead !== 0) return headToHead;
        
        const diffA = a.stats.pointsFor - a.stats.pointsAgainst;
        const diffB = b.stats.pointsFor - b.stats.pointsAgainst;
        return diffB - diffA;
      });

      this.state.standings[conf] = teams.map((t, index) => ({
        rank: index + 1,
        id: t.id,
        name: t.name,
        wins: t.stats.wins,
        losses: t.stats.losses,
        winPct: t.stats.games ? (t.stats.wins / t.stats.games).toFixed(3) : '.000',
        pointsFor: t.stats.pointsFor,
        pointsAgainst: t.stats.pointsAgainst,
        diff: t.stats.pointsFor - t.stats.pointsAgainst,
        streak: t.stats.streak > 0 ? `W${t.stats.streak}` : `L${Math.abs(t.stats.streak)}`,
        last10: t.form.join(''),
        teamPower: Math.round(this.calculateTeamPower(t)),
        gamesBehind: this.calculateGamesBehind(teams[0], t)
      }));
    });
    
    this.state.standingsCache = true;
    this.state._dirtyFlags.standings = false;
  }

  calculateHeadToHead(teamAId, teamBId) {
    // Simplificado - em implementação real, verificar jogos entre as equipas
    return 0;
  }

  calculateGamesBehind(leader, team) {
    const leaderWins = leader.stats.wins;
    const leaderLosses = leader.stats.losses;
    const teamWins = team.stats.wins;
    const teamLosses = team.stats.losses;
    
    return ((leaderWins - teamWins) + (teamLosses - leaderLosses)) / 2;
  }

  // ==================== API PÚBLICA EXPANDIDA ====================
  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  getTeamInfo(teamId) {
    const team = this.state.teams.find(t => t.id === teamId);
    if (!team) return null;
    
    const finances = this.state.teamFinances[teamId] || {};
    const depthChart = this.state.depthChart[teamId] || {};
    
    return {
      id: team.id,
      name: team.name,
      mythology: team.mythology,
      conference: team.conference,
      division: team.division,
      teamPower: Math.round(this.calculateTeamPowerWithCache(team)),
      stats: team.stats,
      upcomingGames: this.getUpcomingGames(teamId),
      finances: {
        salaryTotal: finances.salaryTotal || 0,
        budget: finances.budget || 150000000,
        luxuryTax: finances.luxuryTax || 0,
        capSpace: (finances.budget || 150000000) - (finances.salaryTotal || 0)
      },
      roster: {
        players: team.players.map(p => ({
          id: p.id,
          name: p.name,
          position: p.pos,
          archetype: p.archetype,
          rating: Math.round(this.calculatePlayerPowerWithCache(p)),
          salary: p.salary,
          contractYears: p.contractYears,
          injury: p.injury,
          morale: p.morale,
          energy: p.energy,
          isStarter: depthChart.starters?.includes(p.id) || false
        })),
        starters: depthChart.starters || [],
        rotation: depthChart.rotation || []
      }
    };
  }

  getUserTeamInfo() {
    if (!this.state.playerTeamId) return null;
    const info = this.getTeamInfo(this.state.playerTeamId);
    
    if (info) {
      info.chemistry = this.state.teamChemistry;
      info.injuries = this.state.injuryList.filter(i => 
        i.team === info.name && i.returnDate > `Day ${this.state.currentDay}`
      );
      info.development = this.state.playerDevelopment[this.state.playerTeamId] || {};
    }
    
    return info;
  }

  getPlayerDetails(playerId) {
    for (const team of this.state.teams) {
      const player = team.players.find(p => p.id === playerId);
      if (player) {
        return {
          ...player,
          teamName: team.name,
          teamId: team.id,
          rating: Math.round(this.calculatePlayerPower(player)),
          attributes: player.attributes || {},
          development: this.state.playerDevelopment[playerId] || {},
          injury: player.injury,
          morale: this.state.playerMorale[playerId] || player.morale,
          isUserTeam: team.id === this.state.playerTeamId
        };
      }
    }
    
    // Verificar free agents
    const freeAgent = this.state.freeAgents.find(fa => fa.id === playerId);
    if (freeAgent) {
      return {
        ...freeAgent,
        teamName: 'Free Agent',
        teamId: null,
        rating: freeAgent.rating || Math.round(this.calculatePlayerPower(freeAgent))
      };
    }
    
    return null;
  }

  // ==================== FUNÇÕES PRIVADAS ====================
  createTeams(gameData) {
    return gameData.teams.map((teamData, index) => {
      const players = teamData.players.map((player, idx) => ({
        ...player,
        id: `${teamData.id}-${player.name.toLowerCase().replace(/\s+/g, '-')}-${idx}`,
        attributes: player.attributes || this.generateAttributes(player.archetype, gameData.archetypes),
        morale: 70 + Math.floor(Math.random() * 20),
        energy: 100,
        salary: player.salary || 5000000,
        contractYears: player.contractYears || 3,
        age: 22 + Math.floor(Math.random() * 10),
        potential: 50 + Math.floor(Math.random() * 50)
      }));

      const team = {
        id: teamData.id || index + 1,
        name: teamData.name,
        mythology: teamData.mythology,
        style: teamData.style,
        dominantArchetype: teamData.dominantArchetype,
        conference: teamData.conference || (index % 2 === 0 ? 'EAST' : 'WEST'),
        division: teamData.division || 'Divisão',
        players,
        rotation: this.getOptimalRotation(players),
        stats: { games: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, streak: 0, homeWins: 0, awayWins: 0 },
        form: [],
        formFactor: 1.0,
        tactics: { offense: 'balanced', defense: 'man', pace: 'normal' }
      };

      team.teamPower = this.calculateTeamPower(team);
      return team;
    });
  }

  getOptimalRotation(players) {
    const playersByPos = { PG: [], SG: [], SF: [], PF: [], C: [] };
    players.forEach(player => {
      if (playersByPos[player.pos]) playersByPos[player.pos].push(player);
    });

    Object.keys(playersByPos).forEach(pos => {
      playersByPos[pos].sort((a, b) => this.calculatePlayerPower(b) - this.calculatePlayerPower(a));
    });

    const rotation = [];
    ['PG', 'SG', 'SF', 'PF', 'C'].forEach(pos => {
      if (playersByPos[pos].length > 0) rotation.push(playersByPos[pos][0]);
    });

    const allPlayers = players.filter(p => !rotation.includes(p))
      .sort((a, b) => this.calculatePlayerPower(b) - this.calculatePlayerPower(a));
    
    rotation.push(...allPlayers.slice(0, 3));
    return rotation.slice(0, 8);
  }

  generateAttributes(archetype, archetypeData) {
    if (archetypeData && archetypeData[archetype]) {
      return { ...archetypeData[archetype] };
    }
    return {
      forca: 50, tecnica: 50, velocidade: 50,
      criatividade: 50, disciplina: 50, aura: 50
    };
  }

  calculateInitialReputation(team) {
    return Math.min(80, 50 + (team.teamPower - 70));
  }

  setupPlayoffs() {
    this.state.playoffs = {
      bracket: [],
      currentRound: 1,
      finals: null
    };
    
    // Criar bracket das playoffs
    const eastPlayoffs = this.state.standings.EAST.slice(0, 8);
    const westPlayoffs = this.state.standings.WEST.slice(0, 8);
    
    this.state.playoffs.bracket = {
      east: this.createPlayoffMatchups(eastPlayoffs),
      west: this.createPlayoffMatchups(westPlayoffs)
    };
  }

  createPlayoffMatchups(teams) {
    return [
      { highSeed: teams[0], lowSeed: teams[7], games: [], winner: null },
      { highSeed: teams[1], lowSeed: teams[6], games: [], winner: null },
      { highSeed: teams[2], lowSeed: teams[5], games: [], winner: null },
      { highSeed: teams[3], lowSeed: teams[4], games: [], winner: null }
    ];
  }

  // Método para performance: processar batch de atualizações
  batchUpdate(updates) {
    this.cache.invalidateCache();
    
    updates.forEach(update => {
      try {
        this.dispatch(update);
      } catch (error) {
        console.warn('Batch update failed:', error);
      }
    });
    
    // Forçar atualização de standings se necessário
    if (updates.some(u => u.type === ACTION_TYPES.SIMULATE_DAY)) {
      this.state._dirtyFlags.standings = true;
      this.updateStandings();
    }
  }

  // ==================== FUNÇÕES DE UTILITÁRIO ====================
  generateSchedule() {
    const schedule = [];
    const eastTeams = this.state.teams.filter(t => t.conference === 'EAST');
    const westTeams = this.state.teams.filter(t => t.conference === 'WEST');
    
    for (let day = 1; day <= 82; day++) {
      const dayGames = [];
      
      for (let i = 0; i < 10; i++) {
        let homeTeam, awayTeam;
        
        if (Math.random() > 0.7) {
          homeTeam = eastTeams[Math.floor(Math.random() * eastTeams.length)];
          awayTeam = westTeams[Math.floor(Math.random() * westTeams.length)];
        } else {
          const conference = Math.random() > 0.5 ? 'EAST' : 'WEST';
          const teams = conference === 'EAST' ? eastTeams : westTeams;
          
          homeTeam = teams[Math.floor(Math.random() * teams.length)];
          awayTeam = teams[Math.floor(Math.random() * teams.length)];
          
          while (awayTeam.id === homeTeam.id) {
            awayTeam = teams[Math.floor(Math.random() * teams.length)];
          }
        }
        
        dayGames.push({
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          conference: homeTeam.conference === awayTeam.conference ? homeTeam.conference : 'INTER',
          played: false,
          result: null,
          events: [],
          date: `Day ${day}`
        });
      }
      
      schedule.push({ day, games: dayGames, completed: false });
    }
    
    this.state.schedule = schedule;
  }

  getUpcomingGames(teamId) {
    const upcoming = [];
    for (let day = this.state.currentDay; day <= this.state.currentDay + 5; day++) {
      const daySchedule = this.state.schedule.find(d => d.day === day);
      if (daySchedule) {
        const game = daySchedule.games.find(g => 
          g.homeTeamId === teamId || g.awayTeamId === teamId
        );
        if (game) {
          upcoming.push({
            day,
            opponentId: game.homeTeamId === teamId ? game.awayTeamId : game.homeTeamId,
            isHome: game.homeTeamId === teamId
          });
        }
      }
    }
    return upcoming;
  }

  getStandings(conference) {
    if (conference) return this.state.standings[conference] || [];
    return this.state.standings;
  }

  getLiveGames() {
    const daySchedule = this.state.schedule.find(d => d.day === this.state.currentDay);
    if (!daySchedule) return { live: [], completed: [] };
    
    const live = daySchedule.games.filter(g => !g.played);
    const completed = daySchedule.games.filter(g => g.played);
    
    return { live, completed };
  }

  getLiveFeed() {
    return this.state.liveFeed.slice(-20);
  }

  getGameHistory(filters = {}) {
    let history = filters.userOnly ? [...this.state.userGameHistory] : [...this.state.gameHistory];
    
    if (filters.teamId) {
      history = history.filter(game => 
        game.homeTeam.id === filters.teamId || game.awayTeam.id === filters.teamId
      );
    }
    
    if (filters.limit) history = history.slice(0, filters.limit);
    return history;
  }

  checkJobOffers() {
    if (!this.state.playerTeamId || this.state.userReputation < 70) {
      this.state.jobOffers = [];
      return;
    }

    const currentTeam = this.state.teams.find(t => t.id === this.state.playerTeamId);
    if (!currentTeam) return;

    const betterTeams = this.state.teams.filter(t => 
      t.id !== this.state.playerTeamId &&
      this.calculateTeamPower(t) > this.calculateTeamPower(currentTeam) &&
      t.conference !== currentTeam.conference
    );

    this.state.jobOffers = betterTeams.slice(0, 3).map(team => ({
      teamId: team.id,
      teamName: team.name,
      conference: team.conference,
      teamPower: Math.round(this.calculateTeamPower(team)),
      reputationRequired: 70,
      description: `${team.name} quer-te como treinador!`
    }));
  }

  updateUserReputation(homeTeam, awayTeam, result) {
    if (!this.state.playerTeamId) return;
    
    const isHome = homeTeam.id === this.state.playerTeamId;
    const userTeam = isHome ? homeTeam : awayTeam;
    const opponent = isHome ? awayTeam : homeTeam;
    const userWon = (isHome && result.winner === 'home') || (!isHome && result.winner === 'away');
    
    let repChange = userWon ? 5 : -3;
    const opponentPower = this.calculateTeamPower(opponent);
    const userPower = this.calculateTeamPower(userTeam);
    
    if (userWon && opponentPower > userPower) {
      repChange += Math.floor((opponentPower - userPower) / 5);
    } else if (!userWon && opponentPower < userPower) {
      repChange -= Math.floor((userPower - opponentPower) / 5);
    }
    
    this.state.userReputation = Math.max(0, Math.min(100, this.state.userReputation + repChange));
  }

  recordGameInHistory(gameResult, homeTeam, awayTeam, day, isUserGame) {
    const gameRecord = {
      id: `game-${homeTeam.id}-${awayTeam.id}-${day}-${Date.now()}`,
      date: `Day ${day}`,
      season: this.state.seasonYear,
      phase: this.state.phase,
      homeTeam: { id: homeTeam.id, name: homeTeam.name, score: gameResult.result.homePoints },
      awayTeam: { id: awayTeam.id, name: awayTeam.name, score: gameResult.result.awayPoints },
      result: gameResult.result,
      isUserGame
    };
    
    this.state.gameHistory.push(gameRecord);
    if (isUserGame) this.state.userGameHistory.push(gameRecord);
    
    this.state.liveFeed.push({
      timestamp: new Date().toISOString(),
      text: `${homeTeam.name} ${gameResult.result.homePoints} - ${gameResult.result.awayPoints} ${awayTeam.name}`,
      type: 'game_end'
    });
    
    if (this.state.liveFeed.length > 50) this.state.liveFeed.shift();
  }
}