// game.js - MOTOR PURO (ZERO HTML/CSS)
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
  REJECT_JOB_OFFER: 'REJECT_JOB_OFFER'
};

export class GameEngine {
  constructor(gameData) {
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
      lastError: null
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
    this.state.phase = GAME_PHASES.TEAM_SELECTION;
    
    return true;
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
        default:
          throw new Error(`Ação desconhecida: ${action.type}`);
      }
    } catch (error) {
      this.state.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  // ==================== HANDLERS ====================
  handleSelectTeam(payload) {
    if (this.state.phase !== GAME_PHASES.TEAM_SELECTION) {
      throw new Error('Não é possível selecionar equipa nesta fase');
    }

    const team = this.state.teams.find(t => t.id === payload.teamId);
    if (!team) throw new Error('Equipa não encontrada');

    this.state.playerTeamId = team.id;
    this.state.userReputation = this.calculateInitialReputation(team);
    this.state.phase = GAME_PHASES.REGULAR_SEASON;
    
    return {
      success: true,
      team: this.getTeamInfo(team.id),
      reputation: this.state.userReputation
    };
  }

  handleSimulateDay(payload) {
    const day = payload.day || this.state.currentDay;
    const result = this.simulateDay(day);
    
    if (result.success && !result.userGame) {
      this.state.currentDay++;
      if (this.state.currentDay > this.state.totalDays && this.state.phase === GAME_PHASES.REGULAR_SEASON) {
        this.state.phase = GAME_PHASES.PLAYOFFS;
        this.setupPlayoffs();
      }
    }
    
    return result;
  }

  handlePlayerGame(payload) {
    const { gameData, userActions = [] } = payload;
    return this.simulateUserGame(gameData, userActions);
  }

  handleSetSpeed(payload) {
    const speed = Math.max(1, Math.min(10, payload.speed));
    this.state.simulationSpeed = speed;
    return { success: true, speed };
  }

  handleToggleAuto() {
    this.state.autoSimulate = !this.state.autoSimulate;
    return { success: true, autoSimulate: this.state.autoSimulate };
  }

  handleAcceptJobOffer(payload) {
    const oldTeamId = this.state.playerTeamId;
    this.state.playerTeamId = payload.teamId;
    this.state.userReputation = Math.max(50, this.state.userReputation - 10);
    this.state.jobOffers = [];
    
    return {
      success: true,
      oldTeamId,
      newTeamId: payload.teamId,
      newReputation: this.state.userReputation
    };
  }

  // ==================== LÓGICA DO JOGO ====================
  createTeams(gameData) {
    return gameData.teams.map((teamData, index) => {
      const players = teamData.players.map((player, idx) => ({
        ...player,
        id: `${teamData.id}-${player.name.toLowerCase().replace(/\s+/g, '-')}-${idx}`,
        attributes: player.attributes || this.generateAttributes(player.archetype, gameData.archetypes),
        morale: 70 + Math.floor(Math.random() * 20),
        energy: 100,
        salary: player.salary || 5000000,
        contractYears: player.contractYears || 3
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

      const gameResult = this.simulateSingleGame(homeTeam, awayTeam);
      game.played = true;
      game.result = gameResult.result;
      game.events = gameResult.events;

      this.updateTeamsAfterGame(homeTeam, awayTeam, gameResult);
      this.recordGameInHistory(gameResult, homeTeam, awayTeam, dayNumber, isUserGame);

      results.push(gameResult);
    }

    daySchedule.completed = !userGame;
    this.updateStandings();
    this.checkJobOffers();

    return {
      success: true,
      day: dayNumber,
      results,
      userGame,
      standings: this.state.standings
    };
  }

  simulateSingleGame(homeTeam, awayTeam) {
    const homePower = homeTeam.teamPower;
    const awayPower = awayTeam.teamPower;
    const homeAdvantage = 1.05;
    const formFactor = homeTeam.formFactor / awayTeam.formFactor;

    let homeWinProb = 0.5 + (homePower - awayPower) * 0.005;
    homeWinProb *= homeAdvantage * formFactor;
    homeWinProb = Math.max(0.2, Math.min(0.8, homeWinProb));

    const homeWins = Math.random() < homeWinProb;
    const baseScore = 100 + Math.random() * 20;
    const diff = (Math.random() * 20) + 5;

    let homeScore, awayScore;
    if (homeWins) {
      homeScore = Math.round(baseScore + diff / 2);
      awayScore = Math.round(baseScore - diff / 2);
    } else {
      awayScore = Math.round(baseScore + diff / 2);
      homeScore = Math.round(baseScore - diff / 2);
    }

    const result = {
      homePoints: homeScore,
      awayPoints: awayScore,
      winner: homeWins ? 'home' : 'away',
      quarters: 4,
      isOvertime: false
    };

    return { result, events: [] };
  }

  simulateUserGame(gameData, userActions) {
    const { homeTeam, awayTeam } = gameData;
    const gameResult = this.simulateSingleGame(homeTeam, awayTeam);
    
    this.updateTeamsAfterGame(homeTeam, awayTeam, gameResult);
    this.recordGameInHistory(gameResult, homeTeam, awayTeam, gameData.day, true);
    this.updateUserReputation(homeTeam, awayTeam, gameResult.result);
    
    return {
      success: true,
      game: gameResult,
      userReputation: this.state.userReputation
    };
  }

  // ==================== FUNÇÕES AUXILIARES ====================
  calculateTeamPower(team) {
    if (!team.rotation || team.rotation.length === 0) return 50;
    const total = team.rotation.reduce((acc, player) => acc + this.calculatePlayerPower(player), 0);
    return total / team.rotation.length;
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
    } else {
      awayTeam.stats.wins++;
      awayTeam.stats.awayWins++;
      homeTeam.stats.losses++;
      awayTeam.form.push('W');
      homeTeam.form.push('L');
      awayTeam.stats.streak = awayTeam.stats.streak >= 0 ? awayTeam.stats.streak + 1 : 1;
      homeTeam.stats.streak = homeTeam.stats.streak <= 0 ? homeTeam.stats.streak - 1 : -1;
    }

    if (homeTeam.form.length > 10) homeTeam.form.shift();
    if (awayTeam.form.length > 10) awayTeam.form.shift();
  }

  updateStandings() {
    ['EAST', 'WEST'].forEach(conf => {
      const teams = this.state.teams.filter(t => t.conference === conf);
      
      teams.sort((a, b) => {
        const winPctA = a.stats.wins / (a.stats.games || 1);
        const winPctB = b.stats.wins / (b.stats.games || 1);
        if (Math.abs(winPctB - winPctA) > 0.001) return winPctB - winPctA;
        
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
        last10: t.form.join('')
      }));
    });
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

  // ==================== API PÚBLICA ====================
  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  getTeamInfo(teamId) {
    const team = this.state.teams.find(t => t.id === teamId);
    if (!team) return null;
    
    return {
      id: team.id,
      name: team.name,
      mythology: team.mythology,
      conference: team.conference,
      teamPower: Math.round(team.teamPower),
      stats: team.stats,
      upcomingGames: this.getUpcomingGames(teamId)
    };
  }

  getUserTeamInfo() {
    if (!this.state.playerTeamId) return null;
    return this.getTeamInfo(this.state.playerTeamId);
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

  // ==================== FUNÇÕES PRIVADAS ====================
  organizeConferences() {
    this.state.conferences = { EAST: [], WEST: [] };
    this.state.teams.forEach(team => {
      this.state.conferences[team.conference].push(team.id);
    });
  }

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

  setupPlayoffs() {
    // Implementação básica de playoffs
    this.state.playoffs = {
      bracket: [],
      currentRound: 1,
      finals: null
    };
  }
}