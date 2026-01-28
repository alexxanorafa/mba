// game.js
// ============================================================
// ELIFOOT MITOLÓGICO NBA v1.0 - MOTOR COMPLETO
// Mecânica: NBA (época regular, playoffs, finais, trades, FA)
// Skin: equipas, jogadores, arquétipos mitológicos
// ============================================================

// ============================================================
// CONSTANTES
// ============================================================

const REGULAR_SEASON_GAMES_PER_TEAM = 24; // simplificado (não 82)
const PLAYOFF_SERIES_BEST_OF = 5;         // best-of-5
const CONFERENCES = ['EAST', 'WEST'];

const DEFAULT_SALARY_CAP = 120_000_000;
const MAX_ROSTER_SIZE = 15;
const MIN_ROSTER_SIZE = 10;

// ============================================================
// ESTADO GLOBAL DO JOGO
// ============================================================

const GameState = {
  initialized: false,
  seasonYear: 2026,
  phase: 'regular_season', // 'preseason' | 'regular_season' | 'play_in' | 'playoffs' | 'finals' | 'offseason' | 'finished'
  dayIndex: 0,

  // Equipas
  teams: [], // [{ id, name, mythology, conference, division, players, rotation, stats, ... }]
  conferences: {
    EAST: [],
    WEST: []
  },

  // Jogadores independentes (FA)
  freeAgents: [], // jogadores sem teamId

  // Calendário
  schedule: {
    regularSeason: [], // [{ homeTeamId, awayTeamId, conference, played, result }]
    playoffs: [],
    finals: []
  },
  currentRegularGameIndex: 0,

  // Classificações
  standings: {
    EAST: [],
    WEST: []
  },

  // Playoffs e Finais
  playoffBracket: [], // ver estrutura mais abaixo
  currentPlayoffRound: 0,
  currentPlayoffSeriesIndex: 0,
  finals: {
    eastChampionId: null,
    westChampionId: null,
    games: [],
    winsEast: 0,
    winsWest: 0,
    championId: null
  },

  // Economia / contratos
  economy: {
    salaryCap: DEFAULT_SALARY_CAP,
    luxuryTaxLine: DEFAULT_SALARY_CAP * 1.1,
    teamsCap: new Map() // teamId -> { payroll, space, overCap }
  },

  // Logs
  recentGames: [],
  transactionLog: [] // trades, FA, releases
};

// ============================================================
// FUNÇÕES DE ATRIBUTOS E PODER
// ============================================================

function computePlayerPower(player) {
  const attrs = player.attributes || {};
  const sum =
    (attrs.forca || 50) +
    (attrs.tecnica || 50) +
    (attrs.velocidade || 50) +
    (attrs.criatividade || 50) +
    (attrs.disciplina || 50) +
    (attrs.aura || 50);

  return sum / 6;
}

function computeTeamPower(team) {
  const rotation = team.rotation || team.players.slice(0, 8);
  if (!rotation.length) return 50;
  const total = rotation.reduce((acc, p) => acc + computePlayerPower(p), 0);
  return total / rotation.length;
}

// ============================================================
// MOTOR DE JOGO (BASKET MITOLÓGICO)
// ============================================================

class MatchEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.log = [];
    this.events = [];
    this.stats = {
      home: { points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0 },
      away: { points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0 }
    };
    this.playerStats = new Map(); // playerId -> stats
  }

  simulateGame(homeTeam, awayTeam, context = {}) {
    this.reset();

    const homeRotation = homeTeam.rotation || homeTeam.players.slice(0, 8);
    const awayRotation = awayTeam.rotation || awayTeam.players.slice(0, 8);

    const homePower = computeTeamPower(homeTeam) * (homeTeam.formFactor || 1.0);
    const awayPower = computeTeamPower(awayTeam) * (awayTeam.formFactor || 1.0);

    const possessionCount = 90; // posses base por equipa
    this.simulatePossessions(homeTeam, awayTeam, homeRotation, awayRotation, homePower, awayPower, possessionCount);

    const result = {
      homePoints: this.stats.home.points,
      awayPoints: this.stats.away.points,
      winner:
        this.stats.home.points > this.stats.away.points
          ? 'home'
          : this.stats.home.points < this.stats.away.points
          ? 'away'
          : 'tie'
    };

    this.log.push({
      summary: `${homeTeam.name} ${result.homePoints} - ${result.awayPoints} ${awayTeam.name}`,
      context
    });

    return {
      result,
      stats: this.stats,
      playerStats: this.playerStats,
      events: this.events,
      log: this.log
    };
  }

  simulatePossessions(homeTeam, awayTeam, homeRotation, awayRotation, homePower, awayPower, possessionCount) {
    const totalPower = homePower + awayPower || 1;
    const homePossShare = homePower / totalPower;
    const homePossessions = Math.round(possessionCount * homePossShare);
    const awayPossessions = possessionCount - homePossessions;

    for (let i = 0; i < homePossessions; i++) {
      this.simulatePossession('home', homeTeam, homeRotation, homePower, awayPower);
    }
    for (let i = 0; i < awayPossessions; i++) {
      this.simulatePossession('away', awayTeam, awayRotation, awayPower, homePower);
    }
  }

  simulatePossession(side, team, rotation, teamPower, oppPower) {
    const offenseFactor = teamPower / (teamPower + oppPower || 1);
    const baseScoreProb = 0.45 + (offenseFactor - 0.5) * 0.3; // 45% ±
    const threePointProb = 0.35;

    const shooter = this.choosePlayerByPower(rotation);
    if (!shooter) return;

    const scoreRoll = Math.random();
    const scored = scoreRoll < baseScoreProb;
    const isThree = Math.random() < threePointProb;

    const sideStats = this.stats[side];
    const opponentSide = side === 'home' ? 'away' : 'home';
    const oppStats = this.stats[opponentSide];

    if (scored) {
      const points = isThree ? 3 : 2;
      sideStats.points += points;

      const shooterStats = this.getPlayerStats(shooter.id);
      shooterStats.points = (shooterStats.points || 0) + points;
      shooterStats.fgm = (shooterStats.fgm || 0) + 1;
      shooterStats.fga = (shooterStats.fga || 0) + 1;

      const assister = Math.random() < 0.6 ? this.chooseAssistPlayer(rotation, shooter) : null;
      if (assister) {
        const aStats = this.getPlayerStats(assister.id);
        aStats.assists = (aStats.assists || 0) + 1;
        sideStats.assists += 1;
      }

      this.events.push({
        type: 'score',
        side,
        text: `${team.name}: ${shooter.name} marca ${points} pontos!`,
        points,
        shooterId: shooter.id
      });
    } else {
      const shooterStats = this.getPlayerStats(shooter.id);
      shooterStats.fga = (shooterStats.fga || 0) + 1;

      // Falha -> ressalto
      const reboundSide = Math.random() < offenseFactor ? side : opponentSide;
      const reboundPlayer = this.choosePlayerByPower(rotation);
      if (reboundPlayer) {
        const rStats = this.getPlayerStats(reboundPlayer.id);
        rStats.rebounds = (rStats.rebounds || 0) + 1;
        this.stats[reboundSide].rebounds += 1;
      }
    }

    // Turnover
    if (Math.random() < 0.12) {
      const turnoverPlayer = this.choosePlayerByPower(rotation);
      if (turnoverPlayer) {
        const tStats = this.getPlayerStats(turnoverPlayer.id);
        tStats.turnovers = (tStats.turnovers || 0) + 1;
        sideStats.turnovers += 1;
      }
    }

    // Steal/block
    if (Math.random() < 0.08) {
      const defender = this.choosePlayerByPower(rotation);
      if (defender) {
        const dStats = this.getPlayerStats(defender.id);
        if (Math.random() < 0.5) {
          dStats.steals = (dStats.steals || 0) + 1;
          oppStats.steals += 1;
        } else {
          dStats.blocks = (dStats.blocks || 0) + 1;
          oppStats.blocks += 1;
        }
      }
    }
  }

  choosePlayerByPower(players) {
    if (!players.length) return null;
    const weights = players.map(p => Math.max(1, computePlayerPower(p)));
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < players.length; i++) {
      if (r < weights[i]) return players[i];
      r -= weights[i];
    }
    return players[0];
  }

  chooseAssistPlayer(players, shooter) {
    const candidates = players.filter(p => p !== shooter);
    if (!candidates.length) return null;
    return this.choosePlayerByPower(candidates);
  }

  getPlayerStats(playerId) {
    if (!this.playerStats.has(playerId)) {
      this.playerStats.set(playerId, {});
    }
    return this.playerStats.get(playerId);
  }
}

// ============================================================
// INICIALIZAÇÃO A PARTIR DE DATA (MITOLÓGICA)
// data: { teams: [...], archetypes?, tactical? }
// ============================================================

function initTeamsFromData(data) {
  const teams = (data.teams || []).map((team, index) => {
    const players = (team.players || team.lineup || []).map((p, idx) => ({
      ...p,
      id: `${team.id || index}-${p.name.replace(/\s+/g, '-')}-${idx}`,
      attributes: p.attributes || {
        forca: 50,
        tecnica: 50,
        velocidade: 50,
        criatividade: 50,
        disciplina: 50,
        aura: 50
      },
      morale: 70 + Math.floor(Math.random() * 20),
      energy: 100,
      salary: p.salary || 5_000_000,
      contractYears: p.contractYears || 3,
      teamId: team.id || index + 1
    }));

    const rotation = players.slice(0, 8);

    const conference = index % 2 === 0 ? 'EAST' : 'WEST';

    const baseTeam = {
      id: team.id || index + 1,
      name: team.name,
      mythology: team.mythology,
      style: team.style,
      dominantArchetype: team.dominantArchetype,
      conference,
      division: team.division || (conference === 'EAST' ? 'Olímpica' : 'Submundo'),
      players,
      rotation,
      stats: {
        games: 0,
        wins: 0,
        losses: 0,
        pointsFor: 0,
        pointsAgainst: 0
      },
      form: [],
      formFactor: 1.0
    };

    baseTeam.teamPower = computeTeamPower(baseTeam);

    return baseTeam;
  });

  GameState.teams = teams;
  GameState.conferences.EAST = teams.filter(t => t.conference === 'EAST').map(t => t.id);
  GameState.conferences.WEST = teams.filter(t => t.conference === 'WEST').map(t => t.id);

  recomputeAllPayrolls();
}

// ============================================================
// SALARY CAP / PAYROLL
// ============================================================

function recomputeAllPayrolls() {
  GameState.economy.teamsCap.clear();
  GameState.teams.forEach(team => {
    const payroll = team.players.reduce((sum, p) => sum + (p.salary || 0), 0);
    const space = GameState.economy.salaryCap - payroll;
    GameState.economy.teamsCap.set(team.id, {
      payroll,
      space,
      overCap: payroll > GameState.economy.salaryCap
    });
  });
}

function getTeamCapInfo(teamId) {
  return GameState.economy.teamsCap.get(teamId) || { payroll: 0, space: GameState.economy.salaryCap, overCap: false };
}

// ============================================================
// CALENDÁRIO REGULAR SEASON
// ============================================================

function generateRegularSeasonSchedule() {
  const schedule = [];

  CONFERENCES.forEach(conf => {
    const ids = GameState.conferences[conf];
    // double round robin por conferência (jogar casa/fora)
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i];
        const b = ids[j];
        schedule.push({
          phase: 'regular_season',
          conference: conf,
          homeTeamId: a,
          awayTeamId: b,
          played: false,
          result: null
        });
        schedule.push({
          phase: 'regular_season',
          conference: conf,
          homeTeamId: b,
          awayTeamId: a,
          played: false,
          result: null
        });
      }
    }
  });

  GameState.schedule.regularSeason = schedule;
  GameState.currentRegularGameIndex = 0;
}

// ============================================================
// STANDINGS
// ============================================================

function updateStandings() {
  CONFERENCES.forEach(conf => {
    const ids = GameState.conferences[conf];
    const teams = ids.map(id => GameState.teams.find(t => t.id === id)).filter(Boolean);

    teams.sort((a, b) => {
      if (b.stats.wins !== a.stats.wins) return b.stats.wins - a.stats.wins;
      const diffA = a.stats.pointsFor - a.stats.pointsAgainst;
      const diffB = b.stats.pointsFor - b.stats.pointsAgainst;
      if (diffB !== diffA) return diffB - diffA;
      return b.teamPower - a.teamPower;
    });

    GameState.standings[conf] = teams.map(t => ({
      id: t.id,
      name: t.name,
      wins: t.stats.wins,
      losses: t.stats.losses,
      pointsFor: t.stats.pointsFor,
      pointsAgainst: t.stats.pointsAgainst
    }));
  });
}

// ============================================================
// REGULAR SEASON: SIMULAÇÃO
// ============================================================

function simulateNextRegularGame() {
  const idx = GameState.currentRegularGameIndex;
  const schedule = GameState.schedule.regularSeason;
  if (idx >= schedule.length) {
    GameState.phase = 'playoffs';
    preparePlayoffsFromStandings();
    return null;
  }

  const fixture = schedule[idx];
  if (fixture.played) {
    GameState.currentRegularGameIndex++;
    return simulateNextRegularGame();
  }

  const homeTeam = GameState.teams.find(t => t.id === fixture.homeTeamId);
  const awayTeam = GameState.teams.find(t => t.id === fixture.awayTeamId);
  if (!homeTeam || !awayTeam) {
    fixture.played = true;
    GameState.currentRegularGameIndex++;
    return null;
  }

  const engine = new MatchEngine();
  const sim = engine.simulateGame(homeTeam, awayTeam, {
    phase: 'regular_season',
    conference: fixture.conference
  });

  const { result } = sim;

  fixture.played = true;
  fixture.result = result;

  updateTeamAfterGame(homeTeam, awayTeam, result);

  GameState.recentGames.push({
    phase: 'regular_season',
    fixture,
    result,
    summary: sim.log[0]?.summary
  });
  if (GameState.recentGames.length > 50) GameState.recentGames.shift();

  updateStandings();

  GameState.currentRegularGameIndex++;

  return {
    fixture,
    result,
    stats: sim.stats,
    playerStats: sim.playerStats,
    events: sim.events
  };
}

function updateTeamAfterGame(homeTeam, awayTeam, result) {
  const homePoints = result.homePoints;
  const awayPoints = result.awayPoints;

  homeTeam.stats.games++;
  awayTeam.stats.games++;
  homeTeam.stats.pointsFor += homePoints;
  homeTeam.stats.pointsAgainst += awayPoints;
  awayTeam.stats.pointsFor += awayPoints;
  awayTeam.stats.pointsAgainst += homePoints;

  if (homePoints > awayPoints) {
    homeTeam.stats.wins++;
    awayTeam.stats.losses++;
    homeTeam.form.push('W');
    awayTeam.form.push('L');
  } else if (awayPoints > homePoints) {
    awayTeam.stats.wins++;
    homeTeam.stats.losses++;
    awayTeam.form.push('W');
    homeTeam.form.push('L');
  } else {
    // Se quiseres OT, podes tratar aqui; por já damos win ao home
    homeTeam.stats.wins++;
    awayTeam.stats.losses++;
    homeTeam.form.push('W');
    awayTeam.form.push('L');
  }

  if (homeTeam.form.length > 10) homeTeam.form.shift();
  if (awayTeam.form.length > 10) awayTeam.form.shift();

  homeTeam.formFactor = 0.9 + (homeTeam.stats.wins / Math.max(1, homeTeam.stats.games)) * 0.2;
  awayTeam.formFactor = 0.9 + (awayTeam.stats.wins / Math.max(1, awayTeam.stats.games)) * 0.2;
}

// ============================================================
// PLAYOFFS E FINAIS
// ============================================================

function preparePlayoffsFromStandings() {
  updateStandings();

  const bracket = [];

  CONFERENCES.forEach(conf => {
    const standings = GameState.standings[conf];
    const seeds = standings.slice(0, 8);

    const matchups = [
      { higher: seeds[0], lower: seeds[7] },
      { higher: seeds[3], lower: seeds[4] },
      { higher: seeds[1], lower: seeds[6] },
      { higher: seeds[2], lower: seeds[5] }
    ].filter(m => m.higher && m.lower);

    bracket.push({
      round: 1,
      conference: conf,
      matchups: matchups.map(m => ({
        higherSeedId: m.higher.id,
        lowerSeedId: m.lower.id,
        winsHigher: 0,
        winsLower: 0,
        games: []
      }))
    });
  });

  GameState.playoffBracket = bracket;
  GameState.currentPlayoffRound = 0;
  GameState.currentPlayoffSeriesIndex = 0;
}

function simulateNextPlayoffGame() {
  const bracket = GameState.playoffBracket;
  if (!bracket.length) return null;

  let roundIdx = GameState.currentPlayoffRound;
  if (roundIdx >= bracket.length) {
    prepareFinalsIfReady();
    return null;
  }

  const round = bracket[roundIdx];
  const seriesIdx = GameState.currentPlayoffSeriesIndex;

  if (seriesIdx >= round.matchups.length) {
    advancePlayoffRound();
    return simulateNextPlayoffGame();
  }

  const series = round.matchups[seriesIdx];

  if (series.winsHigher >= PLAYOFF_SERIES_BEST_OF || series.winsLower >= PLAYOFF_SERIES_BEST_OF) {
    GameState.currentPlayoffSeriesIndex++;
    return simulateNextPlayoffGame();
  }

  const homeFirst = series.games.length % 2 === 0;
  const homeTeamId = homeFirst ? series.higherSeedId : series.lowerSeedId;
  const awayTeamId = homeFirst ? series.lowerSeedId : series.higherSeedId;

  const homeTeam = GameState.teams.find(t => t.id === homeTeamId);
  const awayTeam = GameState.teams.find(t => t.id === awayTeamId);
  if (!homeTeam || !awayTeam) {
    series.winsHigher = PLAYOFF_SERIES_BEST_OF;
    GameState.currentPlayoffSeriesIndex++;
    return null;
  }

  const engine = new MatchEngine();
  const sim = engine.simulateGame(homeTeam, awayTeam, {
    phase: 'playoffs',
    conference: round.conference,
    round: round.round
  });

  const { result } = sim;

  const isHigherHome = homeTeamId === series.higherSeedId;
  const higherWon =
    (result.homePoints > result.awayPoints && isHigherHome) ||
    (result.awayPoints > result.homePoints && !isHigherHome);

  if (higherWon) {
    series.winsHigher++;
  } else {
    series.winsLower++;
  }

  series.games.push({
    homeTeamId,
    awayTeamId,
    result
  });

  GameState.recentGames.push({
    phase: 'playoffs',
    round: round.round,
    conference: round.conference,
    series: seriesIdx,
    result,
    summary: sim.log[0]?.summary
  });
  if (GameState.recentGames.length > 50) GameState.recentGames.shift();

  if (series.winsHigher >= PLAYOFF_SERIES_BEST_OF || series.winsLower >= PLAYOFF_SERIES_BEST_OF) {
    GameState.currentPlayoffSeriesIndex++;
  }

  return {
    series,
    round,
    result,
    stats: sim.stats,
    playerStats: sim.playerStats,
    events: sim.events
  };
}

function advancePlayoffRound() {
  const currentRoundIdx = GameState.currentPlayoffRound;
  const currentRound = GameState.playoffBracket[currentRoundIdx];
  if (!currentRound) return;

  const nextRoundNumber = currentRound.round + 1;
  const nextRounds = [];

  CONFERENCES.forEach(conf => {
    const round = GameState.playoffBracket.find(r => r.round === currentRound.round && r.conference === conf);
    if (!round) return;

    const winners = round.matchups.map(series => {
      if (series.winsHigher > series.winsLower) return series.higherSeedId;
      return series.lowerSeedId;
    });

    if (winners.length <= 1) return;

    const matchups = [];
    if (winners.length === 4) {
      matchups.push({ higherSeedId: winners[0], lowerSeedId: winners[3] });
      matchups.push({ higherSeedId: winners[1], lowerSeedId: winners[2] });
    } else if (winners.length === 2) {
      matchups.push({ higherSeedId: winners[0], lowerSeedId: winners[1] });
    }

    const nextRound = {
      round: nextRoundNumber,
      conference: conf,
      matchups: matchups.map(m => ({
        higherSeedId: m.higherSeedId,
        lowerSeedId: m.lowerSeedId,
        winsHigher: 0,
        winsLower: 0,
        games: []
      }))
    };

    nextRounds.push(nextRound);
  });

  GameState.playoffBracket = nextRounds;
  GameState.currentPlayoffRound = 0;
  GameState.currentPlayoffSeriesIndex = 0;
}

function prepareFinalsIfReady() {
  const eastRounds = GameState.playoffBracket.filter(r => r.conference === 'EAST');
  const westRounds = GameState.playoffBracket.filter(r => r.conference === 'WEST');

  if (!eastRounds.length || !westRounds.length) return;

  const eastLast = eastRounds[eastRounds.length - 1];
  const westLast = westRounds[westRounds.length - 1];

  if (!eastLast.matchups.length || !westLast.matchups.length) return;

  const eastSeries = eastLast.matchups[0];
  const westSeries = westLast.matchups[0];

  const eastChampionId =
    eastSeries.winsHigher > eastSeries.winsLower ? eastSeries.higherSeedId : eastSeries.lowerSeedId;
  const westChampionId =
    westSeries.winsHigher > westSeries.winsLower ? westSeries.higherSeedId : westSeries.lowerSeedId;

  GameState.finals.eastChampionId = eastChampionId;
  GameState.finals.westChampionId = westChampionId;
  GameState.finals.games = [];
  GameState.finals.winsEast = 0;
  GameState.finals.winsWest = 0;
  GameState.phase = 'finals';
}

function simulateNextFinalsGame() {
  if (GameState.phase !== 'finals') return null;

  const { eastChampionId, westChampionId, winsEast, winsWest } = GameState.finals;
  if (eastChampionId == null || westChampionId == null) return null;

  if (winsEast >= PLAYOFF_SERIES_BEST_OF || winsWest >= PLAYOFF_SERIES_BEST_OF) {
    GameState.phase = 'finished';
    return null;
  }

  const eastTeam = GameState.teams.find(t => t.id === eastChampionId);
  const westTeam = GameState.teams.find(t => t.id === westChampionId);
  if (!eastTeam || !westTeam) return null;

  const homeFirst = GameState.finals.games.length % 2 === 0;
  const homeTeam = homeFirst ? eastTeam : westTeam;
  const awayTeam = homeFirst ? westTeam : eastTeam;

  const engine = new MatchEngine();
  const sim = engine.simulateGame(homeTeam, awayTeam, {
    phase: 'finals'
  });

  const { result } = sim;
  const eastIsHome = homeTeam.id === eastTeam.id;
  const eastWon =
    (result.homePoints > result.awayPoints && eastIsHome) ||
    (result.awayPoints > result.homePoints && !eastIsHome);

  if (eastWon) {
    GameState.finals.winsEast++;
  } else {
    GameState.finals.winsWest++;
  }

  GameState.finals.games.push({
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    result
  });

  if (GameState.finals.winsEast >= PLAYOFF_SERIES_BEST_OF) {
    GameState.finals.championId = eastTeam.id;
    GameState.phase = 'finished';
  } else if (GameState.finals.winsWest >= PLAYOFF_SERIES_BEST_OF) {
    GameState.finals.championId = westTeam.id;
    GameState.phase = 'finished';
  }

  return {
    result,
    stats: sim.stats,
    playerStats: sim.playerStats,
    events: sim.events
  };
}

// ============================================================
// SISTEMA DE RECRUTAMENTO NBA-LIKE (TRADES / FREE AGENCY)
// ============================================================

function findTeam(teamId) {
  return GameState.teams.find(t => t.id === teamId) || null;
}

function removePlayerFromTeam(team, playerId) {
  const index = team.players.findIndex(p => p.id === playerId);
  if (index === -1) return null;
  const [player] = team.players.splice(index, 1);
  player.teamId = null;
  team.rotation = team.players.slice(0, 8);
  return player;
}

function addPlayerToTeam(team, player) {
  if (team.players.length >= MAX_ROSTER_SIZE) return false;
  player.teamId = team.id;
  team.players.push(player);
  team.rotation = team.players.slice(0, 8);
  return true;
}

// Trades simples: 1x1 ou 2x2 (salários aproximados)
function proposeTrade({ fromTeamId, toTeamId, fromPlayersIds, toPlayersIds }) {
  const fromTeam = findTeam(fromTeamId);
  const toTeam = findTeam(toTeamId);
  if (!fromTeam || !toTeam) {
    return { success: false, message: 'Equipa não encontrada' };
  }

  const fromPlayers = fromPlayersIds
    .map(id => fromTeam.players.find(p => p.id === id))
    .filter(Boolean);
  const toPlayers = toPlayersIds
    .map(id => toTeam.players.find(p => p.id === id))
    .filter(Boolean);

  if (!fromPlayers.length && !toPlayers.length) {
    return { success: false, message: 'Trade vazia' };
  }

  const fromSalary = fromPlayers.reduce((sum, p) => sum + (p.salary || 0), 0);
  const toSalary = toPlayers.reduce((sum, p) => sum + (p.salary || 0), 0);

  // Regra simplificada: salários precisam estar dentro de 25%
  const bigger = Math.max(fromSalary, toSalary);
  const smaller = Math.min(fromSalary, toSalary);
  if (smaller < bigger * 0.75) {
    return { success: false, message: 'Salários desequilibrados (regra 75%)' };
  }

  // Verificar tamanho de roster
  if (
    fromTeam.players.length - fromPlayers.length + toPlayers.length > MAX_ROSTER_SIZE ||
    toTeam.players.length - toPlayers.length + fromPlayers.length > MAX_ROSTER_SIZE
  ) {
    return { success: false, message: 'Limite de roster excedido' };
  }

  // Executar trade
  const movedFrom = [];
  fromPlayers.forEach(p => {
    const removed = removePlayerFromTeam(fromTeam, p.id);
    if (removed) movedFrom.push(removed);
  });

  const movedTo = [];
  toPlayers.forEach(p => {
    const removed = removePlayerFromTeam(toTeam, p.id);
    if (removed) movedTo.push(removed);
  });

  movedFrom.forEach(p => addPlayerToTeam(toTeam, p));
  movedTo.forEach(p => addPlayerToTeam(fromTeam, p));

  recomputeAllPayrolls();

  GameState.transactionLog.push({
    type: 'trade',
    fromTeamId,
    toTeamId,
    fromPlayersIds,
    toPlayersIds,
    fromSalary,
    toSalary,
    date: GameState.dayIndex
  });

  return {
    success: true,
    message: 'Trade concluída',
    fromTeam,
    toTeam
  };
}

// Free Agency: assinar jogador livre, respeitando cap
function signFreeAgent(teamId, playerId, salary, years) {
  const team = findTeam(teamId);
  if (!team) return { success: false, message: 'Equipa não encontrada' };

  const index = GameState.freeAgents.findIndex(p => p.id === playerId);
  if (index === -1) return { success: false, message: 'Jogador não está livre' };

  const player = GameState.freeAgents[index];

  if (team.players.length >= MAX_ROSTER_SIZE) {
    return { success: false, message: 'Roster cheio' };
  }

  const capInfo = getTeamCapInfo(teamId);
  const newPayroll = capInfo.payroll + salary;
  if (newPayroll > GameState.economy.salaryCap * 1.05) {
    // pequena folga acima do cap para simplificar
    return { success: false, message: 'Sem espaço salarial suficiente' };
  }

  player.salary = salary;
  player.contractYears = years;
  player.teamId = teamId;

  GameState.freeAgents.splice(index, 1);
  team.players.push(player);
  team.rotation = team.players.slice(0, 8);

  recomputeAllPayrolls();

  GameState.transactionLog.push({
    type: 'sign_fa',
    teamId,
    playerId,
    salary,
    years,
    date: GameState.dayIndex
  });

  return { success: true, player, team };
}

// Libertar jogador (buyout simplificado)
function releasePlayer(teamId, playerId) {
  const team = findTeam(teamId);
  if (!team) return { success: false, message: 'Equipa não encontrada' };

  const removed = removePlayerFromTeam(team, playerId);
  if (!removed) return { success: false, message: 'Jogador não encontrado na equipa' };

  // buyout: continuar a contar metade do salário no payroll
  const capInfo = getTeamCapInfo(teamId);
  const newPayroll = capInfo.payroll - removed.salary * 0.5;
  GameState.economy.teamsCap.set(teamId, {
    payroll: newPayroll,
    space: GameState.economy.salaryCap - newPayroll,
    overCap: newPayroll > GameState.economy.salaryCap
  });

  // jogador torna-se FA
  removed.teamId = null;
  GameState.freeAgents.push(removed);

  GameState.transactionLog.push({
    type: 'release',
    teamId,
    playerId,
    penalty: removed.salary * 0.5,
    date: GameState.dayIndex
  });

  return { success: true, player: removed, team };
}

// ============================================================
// API PÚBLICA DO JOGO (para main.js)
// ============================================================

export const Game = {
  state: GameState,

  init(data) {
    initTeamsFromData(data);
    generateRegularSeasonSchedule();
    updateStandings();

    GameState.phase = 'regular_season';
    GameState.initialized = true;
    GameState.dayIndex = 0;
  },

  simulateNext() {
    switch (GameState.phase) {
      case 'regular_season':
        return simulateNextRegularGame();
      case 'playoffs':
        return simulateNextPlayoffGame();
      case 'finals':
        return simulateNextFinalsGame();
      default:
        return null;
    }
  },

  // Standings & equipas
  getStandings(conference) {
    if (conference) return GameState.standings[conference] || [];
    return {
      EAST: GameState.standings.EAST,
      WEST: GameState.standings.WEST
    };
  },

  getTeam(id) {
    return GameState.teams.find(t => t.id === id) || null;
  },

  getRecentGames() {
    return [...GameState.recentGames];
  },

  // Recrutamento
  getFreeAgents() {
    return [...GameState.freeAgents];
  },

  trade(payload) {
    return proposeTrade(payload);
  },

  signFreeAgent(teamId, playerId, salary, years) {
    return signFreeAgent(teamId, playerId, salary, years);
  },

  releasePlayer(teamId, playerId) {
    return releasePlayer(teamId, playerId);
  },

  getTeamCapInfo(teamId) {
    return getTeamCapInfo(teamId);
  },

  getTransactions() {
    return [...GameState.transactionLog];
  }
};
