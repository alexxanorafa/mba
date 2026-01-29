// game.js - MOTOR OTIMIZADO COM MELHORIAS
// ============================================================
// VERSÃO 2.0: Home Court, Energia Real, Bónus Mitologia, Emojis
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
    FINISHED: 'FINISHED',
    ALL_STAR_WEEKEND: 'ALL_STAR_WEEKEND'
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
    DRAFT_PLAYER: 'DRAFT_PLAYER',
    NEGOTIATE_CONTRACT: 'NEGOTIATE_CONTRACT',
    SAVE_GAME: 'SAVE_GAME',
    LOAD_GAME: 'LOAD_GAME',
    ADVANCE_SEASON: 'ADVANCE_SEASON',
    TRADE_PROPOSAL: 'TRADE_PROPOSAL',
    ACCEPT_TRADE: 'ACCEPT_TRADE',
    REJECT_TRADE: 'REJECT_TRADE'
};

// ============================================================
// SUGESTÃO 3: BÓNUS PASSIVOS POR MITOLOGIA (LOW CODE)
// ============================================================
const MYTHOLOGY_BONUS = {
    'Grega': { tecnica: 2, disciplina: 1 },
    'Romana': { disciplina: 2, forca: 1 },
    'Nórdica': { forca: 2, disciplina: 1 },
    'Egípcia': { aura: 3, disciplina: 1 },
    'Celta': { velocidade: 2, criatividade: 1 },
    'Hindu': { criatividade: 2, aura: 2 },
    'Asteca': { forca: 2, velocidade: 1 },
    'Chinesa': { disciplina: 2, tecnica: 1 },
    'Maia': { forca: 2, aura: 1 },
    'Africana': { velocidade: 2, forca: 1 },
    'Mesopotâmica': { disciplina: 2, aura: 1 },
    'Persa': { tecnica: 2, velocidade: 1 }
};

// ============================================================
// SUGESTÃO 5: EMOJIS POR ARQUÉTIPO (VISUAL FEEDBACK)
// ============================================================
const ARCHETYPE_EMOJI = {
    'Força': '💪',
    'Sabedoria': '🧠',
    'Velocidade': '⚡',
    'Magia': '✨',
    'Proteção': '🛡️',
    'Natureza': '🌿',
    'Luz': '☀️',
    'Sombra': '🌑',
    'Ordem': '📐',
    'Fogo': '🔥',
    'Caos': '💫'
};

// ============================================================
// UTILITÁRIOS (REFATORAÇÃO: Centralizar lógica)
// ============================================================
const chance = (probability) => Math.random() < probability;
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// Sistema de cache otimizado
// Sistema de cache otimizado
class GameCache {
    constructor() {
        this.teamPowerCache = new Map();
        this.playerPowerCache = new Map();
        this.teamInfoCache = new Map();
        this.standingsCache = null;
        this.scheduleCache = null;
        this.cacheTTL = 30000; // 30 segundos
        this.hits = 0;
        this.misses = 0;
    }

    getTeamPower(teamId) {
        const cached = this.teamPowerCache.get(teamId);
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            this.hits++;
            return cached.value;
        }
        this.misses++;
        return null;
    }

    setTeamPower(teamId, power) {
        this.teamPowerCache.set(teamId, { value: power, timestamp: Date.now() });
    }

    getPlayerPower(playerId) {
        const cached = this.playerPowerCache.get(playerId);
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            this.hits++;
            return cached.value;
        }
        this.misses++;
        return null;
    }

    setPlayerPower(playerId, power) {
        this.playerPowerCache.set(playerId, { value: power, timestamp: Date.now() });
    }

    getTeamInfo(teamId) {
        const cached = this.teamInfoCache.get(teamId);
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            this.hits++;
            return cached.value;
        }
        this.misses++;
        return null;
    }

    setTeamInfo(teamId, info) {
        this.teamInfoCache.set(teamId, { value: info, timestamp: Date.now() });
    }

    getStandings() {
        if (this.standingsCache && Date.now() - this.standingsCache.timestamp < this.cacheTTL) {
            this.hits++;
            return this.standingsCache.value;
        }
        this.misses++;
        return null;
    }

    setStandings(standings) {
        this.standingsCache = { value: standings, timestamp: Date.now() };
    }

    getSchedule() {
        if (this.scheduleCache && Date.now() - this.scheduleCache.timestamp < this.cacheTTL) {
            this.hits++;
            return this.scheduleCache.value;
        }
        this.misses++;
        return null;
    }

    setSchedule(schedule) {
        this.scheduleCache = { value: schedule, timestamp: Date.now() };
    }

    getStats() {
        return {
            hits: this.hits,
            misses: this.misses,
            hitRate: this.hits / (this.hits + this.misses) || 0
        };
    }

    invalidateCache() {
        this.teamPowerCache.clear();
        this.playerPowerCache.clear();
        this.teamInfoCache.clear();
        this.standingsCache = null;
        this.scheduleCache = null;
    }
}

// Sistema de salvamento
class SaveSystem {
    constructor() {
        this.saveSlots = 5;
        this.currentSlot = 1;
    }

    saveGame(state, slot = 1) {
        try {
            const saveData = {
                state: JSON.parse(JSON.stringify(state)),
                timestamp: Date.now(),
                version: '2.0',
                metadata: {
                    seasonYear: state.seasonYear,
                    day: state.currentDay,
                    userTeam: state.playerTeamId ? state.teams.find(t => t.id === state.playerTeamId)?.name : 'Nenhuma',
                    reputation: state.userReputation
                }
            };
            localStorage.setItem(`mba_save_${slot}`, JSON.stringify(saveData));
            return { success: true, slot, metadata: saveData.metadata };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    loadGame(slot = 1) {
        try {
            const saveData = JSON.parse(localStorage.getItem(`mba_save_${slot}`));
            if (!saveData) {
                return { success: false, error: 'Save não encontrado' };
            }
            if (saveData.version !== '2.0') {
                return { success: false, error: 'Versão de save incompatível' };
            }
            return { success: true, state: saveData.state, metadata: saveData.metadata };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    getSaveSlots() {
        const slots = [];
        for (let i = 1; i <= this.saveSlots; i++) {
            const saveData = localStorage.getItem(`mba_save_${i}`);
            if (saveData) {
                try {
                    const parsed = JSON.parse(saveData);
                    slots.push({
                        slot: i,
                        timestamp: parsed.timestamp,
                        metadata: parsed.metadata,
                        date: new Date(parsed.timestamp).toLocaleString()
                    });
                } catch (e) {
                    slots.push({ slot: i, corrupted: true });
                }
            } else {
                slots.push({ slot: i, empty: true });
            }
        }
        return slots;
    }

    deleteSave(slot) {
        localStorage.removeItem(`mba_save_${slot}`);
        return { success: true };
    }
}

// Sistema de conquistas
class AchievementSystem {
    constructor() {
        this.achievements = {
            FIRST_WIN: { id: 'FIRST_WIN', name: 'Primeira Vitória', description: 'Ganhar o primeiro jogo', unlocked: false },
            WINNING_STREAK_5: { id: 'WINNING_STREAK_5', name: 'Em Fogo', description: 'Conseguir uma streak de 5 vitórias', unlocked: false },
            PLAYOFF_BERTH: { id: 'PLAYOFF_BERTH', name: 'Classificado', description: 'Classificar-se para os playoffs', unlocked: false },
            PLAYOFF_WIN: { id: 'PLAYOFF_WIN', name: 'Vencedor de Playoffs', description: 'Ganhar uma série de playoffs', unlocked: false },
            CHAMPIONSHIP: { id: 'CHAMPIONSHIP', name: 'Campeão', description: 'Ganhar o campeonato', unlocked: false },
            MVP_SEASON: { id: 'MVP_SEASON', name: 'MVP', description: 'Ter um jogador eleito MVP da temporada', unlocked: false },
            TEAM_CHEMISTRY_90: { id: 'TEAM_CHEMISTRY_90', name: 'Química Perfeita', description: 'Alcançar 90 de química de equipa', unlocked: false },
            REPUTATION_90: { id: 'REPUTATION_90', name: 'Lenda', description: 'Alcançar 90 de reputação', unlocked: false },
            TRADE_MASTER: { id: 'TRADE_MASTER', name: 'Mestre das Trocas', description: 'Concluir uma troca vantajosa', unlocked: false },
            DRAFT_STEAL: { id: 'DRAFT_STEAL', name: 'Roubo no Draft', description: 'Selecionar um jogador com rating >80 após o 20º pick', unlocked: false }
        };
        this.unlockedAchievements = [];
        this.load();
    }

    load() {
        const saved = localStorage.getItem('mba_achievements');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.unlockedAchievements = data.unlocked || [];
                this.unlockedAchievements.forEach(id => {
                    if (this.achievements[id]) {
                        this.achievements[id].unlocked = true;
                    }
                });
            } catch (e) {
                console.warn('Erro ao carregar achievements:', e);
            }
        }
    }

    save() {
        localStorage.setItem('mba_achievements', JSON.stringify({
            unlocked: this.unlockedAchievements
        }));
    }

    unlock(achievementId) {
        if (this.achievements[achievementId] && !this.achievements[achievementId].unlocked) {
            this.achievements[achievementId].unlocked = true;
            this.unlockedAchievements.push(achievementId);
            this.save();
            return { success: true, achievement: this.achievements[achievementId], total: this.unlockedAchievements.length };
        }
        return { success: false };
    }

    checkAchievements(gameState) {
        const newlyUnlocked = [];
        
        if (gameState.playerTeamId) {
            const team = gameState.teams.find(t => t.id === gameState.playerTeamId);
            
            if (team) {
                // Vitórias
                if (team.stats.wins === 1) {
                    const result = this.unlock('FIRST_WIN');
                    if (result.success) newlyUnlocked.push(result.achievement);
                }
                
                if (team.stats.streak >= 5) {
                    const result = this.unlock('WINNING_STREAK_5');
                    if (result.success) newlyUnlocked.push(result.achievement);
                }
                
                // Química
                if (gameState.teamChemistry >= 90) {
                    const result = this.unlock('TEAM_CHEMISTRY_90');
                    if (result.success) newlyUnlocked.push(result.achievement);
                }
                
                // Reputação
                if (gameState.userReputation >= 90) {
                    const result = this.unlock('REPUTATION_90');
                    if (result.success) newlyUnlocked.push(result.achievement);
                }
            }
        }
        
        return newlyUnlocked;
    }

    getProgress() {
        const total = Object.keys(this.achievements).length;
        const unlocked = this.unlockedAchievements.length;
        return {
            total,
            unlocked,
            percentage: Math.round((unlocked / total) * 100),
            achievements: Object.values(this.achievements)
        };
    }
}

// ============================================================
// GAME ENGINE PRINCIPAL
// ============================================================
export class GameEngine {
    constructor(gameData) {
        this.cache = new GameCache();
        this.saveSystem = new SaveSystem();
        this.achievementSystem = new AchievementSystem();
        
        this.state = {
            phase: GAME_PHASES.INIT,
            seasonYear: gameData?.seasonYear || 2026,
            currentDay: 1,
            totalDays: 82,
            daysInMonth: 30,
            teams: [],
            playerTeamId: null,
            userReputation: 50,
            userRole: 'Head Coach',
            userName: 'Coach',
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
            tradeOffers: [],
            pendingActions: [],
            lastError: null,
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
            seasonAwards: null,
            statLeaders: null,
            hallOfFame: [],
            seasonHistory: [],
            allStarWeekend: null,
            specialEvents: [],
            lastUpdate: Date.now(),
            dirtyFlags: {
                standings: true,
                teamPower: true,
                schedule: true
            },
            advancedStats: {
                teamStats: {},
                playerStats: {},
                leagueStats: {
                    avgPoints: 110.5,
                    avgPace: 98.2,
                    avgEfficiency: 54.3
                }
            },
            achievements: this.achievementSystem.getProgress()
        };

        if (gameData) {
            this.init(gameData);
        }
    }

    // ============================================================
    // INICIALIZAÇÃO
    // ============================================================
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

    createTeams(gameData) {
        return gameData.teams.map((teamData, index) => {
            const players = teamData.players.map(playerData => ({
                id: `${teamData.id}-${playerData.name.replace(/\s/g, '-')}`,
                name: playerData.name,
                position: playerData.pos,
                attributes: playerData.attributes || this.generateAttributes(playerData.archetype, gameData.archetypes),
                rating: this.calculatePlayerRating(playerData.attributes || {}),
                potential: 75 + Math.random() * 20,
                age: 22 + Math.floor(Math.random() * 10),
                salary: playerData.salary || 5000000,
                contractYears: playerData.contractYears || 2,
                morale: 70 + Math.random() * 20,
                energy: 100,
                injury: null,
                isStarter: false,
                archetype: playerData.archetype || 'Balanced'
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
                stats: {
                    games: 0,
                    wins: 0,
                    losses: 0,
                    pointsFor: 0,
                    pointsAgainst: 0,
                    streak: 0,
                    homeWins: 0,
                    awayWins: 0
                },
                form: [],
                tactics: {
                    offense: teamData.style === 'Ofensivo' ? 'fast' : 'balanced',
                    defense: teamData.style === 'Defensivo' ? 'zone' : 'man',
                    pace: 'normal',
                    focus: 'balanced'
                }
            };

            team.teamPower = this.calculateTeamPower(team);
            return team;
        });
    }

    organizeConferences() {
        this.state.conferences = { EAST: [], WEST: [] };
        this.state.teams.forEach(team => {
            if (team.conference) {
                this.state.conferences[team.conference].push(team.id);
            }
        });
    }

    initializeAdvancedSystems() {
        this.state.teams.forEach(team => {
            // Depth chart
            this.state.depthChart[team.id] = this.getOptimalRotation(team.players);
            
            // Finanças
            this.state.teamFinances[team.id] = {
                salaryTotal: team.players.reduce((sum, p) => sum + (p.salary || 5000000), 0),
                luxuryTax: 0,
                budget: 150000000,
                revenue: 100000000,
                expenses: team.players.reduce((sum, p) => sum + (p.salary || 5000000), 0) + 50000000,
                profit: 0,
                capSpace: 150000000 - team.players.reduce((sum, p) => sum + (p.salary || 5000000), 0),
                ticketSales: 50000000,
                merchandise: 20000000,
                tvRevenue: 30000000
            };
            
            // Moral dos jogadores
            team.players.forEach(player => {
                this.state.playerMorale[player.id] = player.morale || 70;
                this.state.playerDevelopment[player.id] = {
                    potential: player.potential || 75,
                    growthRate: 0.8 + Math.random() * 0.4,
                    developmentFocus: null,
                    trainedAttributes: {}
                };
            });
            
            // Stats avançadas
            this.state.advancedStats.teamStats[team.id] = {
                offensiveRating: 100 + Math.random() * 15,
                defensiveRating: 100 + Math.random() * 15,
                pace: 95 + Math.random() * 10,
                efficiency: 50 + Math.random() * 20,
                reboundRate: 0.5 + Math.random() * 0.2,
                assistRate: 0.6 + Math.random() * 0.2,
                turnoverRate: 0.12 + Math.random() * 0.06
            };
        });
        
        // Gerar free agents
        this.generateFreeAgents();
        
        // Preparar draft
        this.prepareDraft();
    }

    generateFreeAgents() {
        const freeAgents = [];
        const archetypes = ['Força', 'Sabedoria', 'Velocidade', 'Magia', 'Proteção', 'Natureza', 'Luz', 'Sombra', 'Ordem', 'Fogo', 'Caos'];
        const positions = ['PG', 'SG', 'SF', 'PF', 'C'];
        const firstNames = ['Leandro', 'Miguel', 'João', 'Pedro', 'Rui', 'André', 'Carlos', 'Diogo', 'Filipe', 'Gonalo'];
        const lastNames = ['Silva', 'Santos', 'Costa', 'Pereira', 'Oliveira', 'Martins', 'Ferreira', 'Rodrigues', 'Sousa', 'Gomes'];
        
        for (let i = 0; i < 50; i++) {
            const archetype = archetypes[randomInt(0, archetypes.length - 1)];
            const position = positions[randomInt(0, positions.length - 1)];
            const age = 20 + randomInt(0, 11);
            const firstName = firstNames[randomInt(0, firstNames.length - 1)];
            const lastName = lastNames[randomInt(0, lastNames.length - 1)];
            
            freeAgents.push({
                id: `fa-${i + 1}`,
                name: `${firstName} ${lastName}`,
                position,
                archetype,
                age,
                attributes: this.generateAttributes(archetype),
                salaryDemand: 2000000 + Math.random() * 10000000,
                yearsDemand: 1 + randomInt(0, 3),
                rating: 60 + Math.random() * 30,
                potential: 60 + Math.random() * 30,
                preferredRole: ['Starter', 'Rotation', 'Bench'][randomInt(0, 2)]
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
        this.generateDraftProspects();
    }

    generateDraftProspects() {
        const prospects = [];
        const positions = ['PG', 'SG', 'SF', 'PF', 'C'];
        const firstNames = ['Alex', 'Bruno', 'Daniel', 'Eduardo', 'Fábio', 'Gabriel', 'Hugo', 'Ivo', 'Jorge', 'Kevin'];
        const lastNames = ['Lopes', 'Marques', 'Neves', 'Pinto', 'Queirós', 'Ramos', 'Teixeira', 'Vieira', 'Xavier', 'Zé'];
        
        for (let i = 0; i < 60; i++) {
            const position = positions[randomInt(0, positions.length - 1)];
            const age = 19 + randomInt(0, 2);
            const firstName = firstNames[randomInt(0, firstNames.length - 1)];
            const lastName = lastNames[randomInt(0, lastNames.length - 1)];
            const potential = 60 + randomInt(0, 34);
            const currentRating = potential - 15 - randomInt(0, 9);
            
            prospects.push({
                id: `prospect-${i + 1}`,
                name: `${firstName} ${lastName}`,
                position,
                age,
                rating: currentRating,
                potential,
                attributes: this.generateDraftAttributes(potential),
                college: ['Kentucky', 'Duke', 'UNC', 'UCLA', 'Kansas'][randomInt(0, 4)],
                projection: Math.min(30, Math.floor(i / 2) + 1),
                strengths: ['Arremesso', 'Defesa', 'Passe', 'Atletismo'][randomInt(0, 3)],
                weaknesses: ['Consistência', 'Força', 'QI'][randomInt(0, 2)]
            });
        }
        
        this.state.draftProspects = prospects;
    }

    generateDraftAttributes(potential) {
        const base = {
            forca: 40 + Math.random() * 40,
            tecnica: 40 + Math.random() * 40,
            velocidade: 40 + Math.random() * 40,
            criatividade: 40 + Math.random() * 40,
            disciplina: 40 + Math.random() * 40,
            aura: 40 + Math.random() * 40
        };
        
        // Ajustar baseado no potencial
        Object.keys(base).forEach(key => {
            base[key] = Math.min(99, base[key] + (potential - 80));
        });
        
        return base;
    }

    getOptimalRotation(players) {
        if (!players || players.length === 0) {
            return { starters: [], rotation: [], bench: [] };
        }

        const playersByPos = { PG: [], SG: [], SF: [], PF: [], C: [] };
        players.forEach(player => {
            const pos = player.position || player.pos;
            if (playersByPos[pos]) playersByPos[pos].push(player);
        });

        Object.keys(playersByPos).forEach(pos => {
            playersByPos[pos].sort((a, b) => this.calculatePlayerPower(b) - this.calculatePlayerPower(a));
        });

        const starters = [];
        ['PG', 'SG', 'SF', 'PF', 'C'].forEach(pos => {
            if (playersByPos[pos].length > 0) starters.push(playersByPos[pos][0].id);
        });

        const allPlayers = players
            .filter(p => !starters.includes(p.id))
            .sort((a, b) => this.calculatePlayerPower(b) - this.calculatePlayerPower(a));

        const rotation = allPlayers.slice(0, 5).map(p => p.id);
        const bench = allPlayers.slice(5).map(p => p.id);

        return {
            starters: starters.slice(0, 5),
            rotation: rotation.slice(0, 5),
            bench: bench
        };
    }

    generateAttributes(archetype, archetypeData) {
        if (archetypeData && archetypeData[archetype]) {
            return { ...archetypeData[archetype] };
        }

        const baseValues = {
            'Força': { forca: 80, tecnica: 50, velocidade: 40, criatividade: 40, disciplina: 60, aura: 50 },
            'Sabedoria': { forca: 40, tecnica: 80, velocidade: 50, criatividade: 70, disciplina: 60, aura: 60 },
            'Velocidade': { forca: 50, tecnica: 60, velocidade: 80, criatividade: 60, disciplina: 50, aura: 50 },
            'Magia': { forca: 40, tecnica: 70, velocidade: 50, criatividade: 80, disciplina: 50, aura: 70 },
            'Proteção': { forca: 70, tecnica: 50, velocidade: 40, criatividade: 40, disciplina: 80, aura: 50 },
            'Natureza': { forca: 60, tecnica: 60, velocidade: 60, criatividade: 60, disciplina: 60, aura: 70 },
            'Luz': { forca: 50, tecnica: 70, velocidade: 60, criatividade: 60, disciplina: 70, aura: 80 },
            'Sombra': { forca: 60, tecnica: 60, velocidade: 70, criatividade: 70, disciplina: 40, aura: 60 },
            'Ordem': { forca: 60, tecnica: 60, velocidade: 50, criatividade: 50, disciplina: 80, aura: 60 },
            'Fogo': { forca: 70, tecnica: 60, velocidade: 70, criatividade: 60, disciplina: 40, aura: 60 },
            'Caos': { forca: 60, tecnica: 50, velocidade: 80, criatividade: 70, disciplina: 30, aura: 50 }
        };

        const base = baseValues[archetype] || {
            forca: 50, tecnica: 50, velocidade: 50,
            criatividade: 50, disciplina: 50, aura: 50
        };

        // Adicionar variação
        Object.keys(base).forEach(key => {
            base[key] = clamp(base[key] + (Math.random() * 20 - 10), 30, 85);
        });

        return base;
    }

    calculatePlayerRating(attributes) {
        const sum = Object.values(attributes).reduce((acc, val) => acc + val, 0);
        return Math.round(sum / Object.keys(attributes).length);
    }

    // ============================================================
    // SUGESTÃO 2: ENERGIA AFETA PODER (FORÇA ROTAÇÃO)
    // SUGESTÃO 3: BÓNUS DE MITOLOGIA APLICADO
    // ============================================================
    calculatePlayerPower(player, teamMythology = null) {
        const cached = this.cache.getPlayerPower(player.id);
        if (cached) return cached;

        let attrs = { ...player.attributes };

        // SUGESTÃO 3: Aplicar bónus de mitologia
        if (teamMythology && MYTHOLOGY_BONUS[teamMythology]) {
            Object.entries(MYTHOLOGY_BONUS[teamMythology]).forEach(([attr, bonus]) => {
                attrs[attr] = (attrs[attr] || 50) + bonus;
            });
        }

        const { forca = 50, tecnica = 50, velocidade = 50, criatividade = 50, disciplina = 50, aura = 50 } = attrs;

        let power = (
            forca * 1.2 +
            tecnica * 1.1 +
            velocidade * 1.0 +
            criatividade * 0.9 +
            disciplina * 0.8 +
            aura * 0.7
        ) / 5.7;

        // SUGESTÃO 2: Multiplicador de energia
        const energyMultiplier = (player.energy || 100) / 100;
        power *= energyMultiplier;

        // Penalidade por lesão
        if (player.injury) power *= 0;

        power = clamp(power, 30, 99);

        this.cache.setPlayerPower(player.id, power);
        return power;
    }

    // ============================================================
    // SUGESTÃO 1: HOME COURT ADVANTAGE (+5%)
    // SUGESTÃO 2: ENERGIA INTEGRADA
    // ============================================================
    calculateTeamPower(team, isHome = false) {
        const cached = this.cache.getTeamPower(team.id);
        if (cached && !isHome) return cached;

        const activePlayers = team.players.filter(p => !p.injury && (p.energy || 100) > 20);

        if (activePlayers.length === 0) return 50;

        // Programação funcional (refatoração)
        const totalPower = activePlayers.reduce((sum, p) => {
            return sum + this.calculatePlayerPower(p, team.mythology);
        }, 0);

        let avgPower = totalPower / activePlayers.length;

        // SUGESTÃO 1: Vantagem de casa (+5%)
        const homeBonus = isHome ? 1.05 : 1.0;
        avgPower *= homeBonus;

        avgPower = clamp(avgPower, 40, 99);

        if (!isHome) {
            this.cache.setTeamPower(team.id, avgPower);
        }

        return avgPower;
    }

    // ============================================================
    // SIMULAÇÃO DE JOGO (COM EMOJIS - SUGESTÃO 5)
    // ============================================================
    simulateDetailedGame(gameData) {
        const homeTeam = this.state.teams.find(t => t.id === gameData.homeTeamId);
        const awayTeam = this.state.teams.find(t => t.id === gameData.awayTeamId);

        if (!homeTeam || !awayTeam) {
            return { success: false, error: 'Equipas não encontradas' };
        }

        // SUGESTÃO 1: Home court advantage aplicado
        const homePower = this.calculateTeamPower(homeTeam, true); // ← VANTAGEM DE CASA
        const awayPower = this.calculateTeamPower(awayTeam, false);

        const homeScore = Math.round(95 + (homePower / 2) + (Math.random() * 20));
        const awayScore = Math.round(95 + (awayPower / 2) + (Math.random() * 20));

        const winner = homeScore > awayScore ? 'home' : 'away';
        const margin = Math.abs(homeScore - awayScore);

        // Atualizar stats
        homeTeam.stats.games++;
        awayTeam.stats.games++;
        homeTeam.stats.pointsFor += homeScore;
        homeTeam.stats.pointsAgainst += awayScore;
        awayTeam.stats.pointsFor += awayScore;
        awayTeam.stats.pointsAgainst += homeScore;

        if (winner === 'home') {
            homeTeam.stats.wins++;
            homeTeam.stats.homeWins++;
            homeTeam.stats.streak = homeTeam.stats.streak >= 0 ? homeTeam.stats.streak + 1 : 1;
            awayTeam.stats.losses++;
            awayTeam.stats.streak = awayTeam.stats.streak <= 0 ? awayTeam.stats.streak - 1 : -1;
        } else {
            awayTeam.stats.wins++;
            awayTeam.stats.awayWins++;
            awayTeam.stats.streak = awayTeam.stats.streak >= 0 ? awayTeam.stats.streak + 1 : 1;
            homeTeam.stats.losses++;
            homeTeam.stats.streak = homeTeam.stats.streak <= 0 ? homeTeam.stats.streak - 1 : -1;
        }

        // Atualizar energia após jogo (SUGESTÃO 2)
        this.updateEnergyAfterGame(homeTeam);
        this.updateEnergyAfterGame(awayTeam);

        // SUGESTÃO 5: Gerar eventos com emojis
        const events = this.generateGameEventsWithEmojis(homeTeam, awayTeam, winner);

        // Adicionar ao liveFeed
        const emoji = winner === 'home' ? '🏠' : '✈️';
        this.state.liveFeed.unshift({
            timestamp: new Date().toISOString(),
            text: `${emoji} ${homeTeam.name} ${homeScore} - ${awayScore} ${awayTeam.name}`,
            type: 'game_result',
            winner: winner === 'home' ? homeTeam.name : awayTeam.name
        });

        // Invalidar cache
        this.cache.invalidateCache();
        this.state.dirtyFlags.standings = true;
        this.state.dirtyFlags.teamPower = true;

        return {
            success: true,
            result: {
                homeScore,
                awayScore,
                winner,
                margin,
                events
            },
            homeTeam: this.getTeamInfo(homeTeam.id),
            awayTeam: this.getTeamInfo(awayTeam.id)
        };
    }

    // SUGESTÃO 5: Eventos com emojis contextuais por arquétipo
    generateGameEventsWithEmojis(homeTeam, awayTeam, winner) {
        const events = [];
        const quarters = [1, 2, 3, 4];

        quarters.forEach(quarter => {
            const team = chance(0.5) ? homeTeam : awayTeam;
            const player = team.players[randomInt(0, Math.min(4, team.players.length - 1))];

            if (player) {
                const emoji = ARCHETYPE_EMOJI[player.archetype] || '⭐';
                const eventTypes = [
                    `${emoji} ${player.name} marca um triplo sensacional!`,
                    `${emoji} ${player.name} completa uma enterrada poderosa!`,
                    `${emoji} Passe extraordinário de ${player.name}!`,
                    `${emoji} Defesa impressionante de ${player.name}!`,
                    `${emoji} Roubo de bola de ${player.name}!`
                ];

                events.push({
                    quarter,
                    time: `${randomInt(0, 11)}:${randomInt(0, 59).toString().padStart(2, '0')}`,
                    text: eventTypes[randomInt(0, eventTypes.length - 1)],
                    emoji,
                    archetype: player.archetype,
                    team: team.name
                });
            }
        });

        return events;
    }

    // SUGESTÃO 2: Atualizar energia após jogo
    updateEnergyAfterGame(team) {
        const depthChart = this.state.depthChart[team.id];
        if (!depthChart) return;

        team.players.forEach(player => {
            if (depthChart.starters.includes(player.id)) {
                player.energy = Math.max(30, player.energy - 25); // Titulares perdem mais
            } else if (depthChart.rotation.includes(player.id)) {
                player.energy = Math.max(40, player.energy - 15); // Rotação perde médio
            } else {
                player.energy = Math.min(100, player.energy + 10); // Banco recupera
            }
        });
    }

    updatePlayerEnergy() {
        this.state.teams.forEach(team => {
            team.players.forEach(player => {
                // Recuperação natural (1% por dia)
                player.energy = Math.min(100, player.energy + 1);
            });
        });
    }

    // ============================================================
    // CALENDÁRIO E SIMULAÇÃO
    // ============================================================
    generateSchedule() {
        const schedule = [];
        const eastTeams = this.state.teams.filter(t => t.conference === 'EAST');
        const westTeams = this.state.teams.filter(t => t.conference === 'WEST');

        for (let day = 1; day <= 82; day++) {
            const dayGames = [];
            const gamesToday = day % 3 === 0 ? 8 : 10;

            for (let i = 0; i < gamesToday; i++) {
                let homeTeam, awayTeam;

                if (day < 60 && chance(0.6)) {
                    homeTeam = eastTeams[randomInt(0, eastTeams.length - 1)];
                    awayTeam = westTeams[randomInt(0, westTeams.length - 1)];
                } else {
                    const conference = chance(0.5) ? 'EAST' : 'WEST';
                    const teams = conference === 'EAST' ? eastTeams : westTeams;
                    homeTeam = teams[randomInt(0, teams.length - 1)];
                    awayTeam = teams[randomInt(0, teams.length - 1)];

                    let attempts = 0;
                    while (awayTeam.id === homeTeam.id && attempts < 10) {
                        awayTeam = teams[randomInt(0, teams.length - 1)];
                        attempts++;
                    }
                }

                dayGames.push({
                    homeTeamId: homeTeam.id,
                    awayTeamId: awayTeam.id,
                    conference: homeTeam.conference === awayTeam.conference ? homeTeam.conference : 'INTER',
                    played: false,
                    result: null,
                    events: [],
                    detailedStats: null,
                    date: `Day ${day}`,
                    time: `${19 + randomInt(0, 2)}:${randomInt(0, 3) * 15}`
                });
            }

            schedule.push({ day, games: dayGames, completed: false });
        }

        this.state.schedule = schedule;
        
        // CORREÇÃO: Verificação segura antes de chamar setSchedule
        if (this.cache && typeof this.cache.setSchedule === 'function') {
            this.cache.setSchedule(schedule);
        } else {
            // Fallback para garantir que o cache seja atualizado
            if (this.cache) {
                this.cache.scheduleCache = { value: schedule, timestamp: Date.now() };
            }
        }
    }

    simulateDay(dayNumber = null) {
        const day = dayNumber || this.state.currentDay;
        const daySchedule = this.state.schedule.find(d => d.day === day);

        if (!daySchedule) {
            return { success: false, error: 'Dia não encontrado no calendário' };
        }

        if (daySchedule.completed) {
            return { success: false, error: 'Este dia já foi simulado' };
        }

        let userGame = null;

        daySchedule.games.forEach(game => {
            if (!game.played) {
                const isUserGame = game.homeTeamId === this.state.playerTeamId || game.awayTeamId === this.state.playerTeamId;

                if (isUserGame) {
                    userGame = game;
                } else {
                    const result = this.simulateDetailedGame(game);
                    if (result.success) {
                        game.played = true;
                        game.result = result.result;
                    }
                }
            }
        });

        // Atualizar energia
        this.updatePlayerEnergy();

        // Atualizar standings
        this.updateStandings();

        // Verificar conquistas
        const newAchievements = this.achievementSystem.checkAchievements(this.state);

        daySchedule.completed = !userGame;

        return {
            success: true,
            day,
            userGame,
            newAchievements,
            daySchedule
        };
    }

    updateStandings() {
        const standings = { EAST: [], WEST: [] };

        ['EAST', 'WEST'].forEach(conf => {
            const teams = this.state.teams
                .filter(t => t.conference === conf)
                .map(t => ({
                    id: t.id,
                    name: t.name,
                    mythology: t.mythology,
                    wins: t.stats.wins,
                    losses: t.stats.losses,
                    games: t.stats.games,
                    pct: t.stats.games > 0 ? (t.stats.wins / t.stats.games).toFixed(3) : '.000',
                    diff: t.stats.pointsFor - t.stats.pointsAgainst,
                    streak: t.stats.streak,
                    homeWins: t.stats.homeWins,
                    awayWins: t.stats.awayWins
                }))
                .sort((a, b) => {
                    if (b.wins !== a.wins) return b.wins - a.wins;
                    return b.diff - a.diff;
                })
                .map((team, index) => ({ ...team, rank: index + 1 }));

            standings[conf] = teams;
        });

        this.state.standings = standings;
        this.cache.setStandings(standings);
        this.state.dirtyFlags.standings = false;
    }

    // ============================================================
    // DISPATCH (MÁQUINA DE ESTADOS)
    // ============================================================
    dispatch(action) {
        try {
            console.log('[ENGINE] Action:', action.type, action.payload);

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
                case ACTION_TYPES.TRAIN_PLAYER:
                    return this.handleTrainPlayer(action.payload);
                case ACTION_TYPES.SET_LINEUP:
                    return this.handleSetLineup(action.payload);
                case ACTION_TYPES.SIGN_FREE_AGENT:
                    return this.handleSignFreeAgent(action.payload);
                case ACTION_TYPES.SAVE_GAME:
                    return this.handleSaveGame(action.payload);
                case ACTION_TYPES.LOAD_GAME:
                    return this.handleLoadGame(action.payload);
                default:
                    throw new Error(`Ação desconhecida: ${action.type}`);
            }
        } catch (error) {
            this.state.lastError = error.message;
            return { success: false, error: error.message };
        }
    }

    handleSelectTeam(payload) {
        if (this.state.phase !== GAME_PHASES.TEAM_SELECTION) {
            throw new Error('Não é possível selecionar equipa nesta fase');
        }

        const team = this.state.teams.find(t => t.id === payload.teamId || t.id === payload);

        if (!team) {
            throw new Error('Equipa não encontrada');
        }

        this.state.playerTeamId = team.id;
        this.state.userReputation = 50 + (team.teamPower - 70) * 1.5 + (Math.random() * 10 - 5);
        this.state.userReputation = clamp(this.state.userReputation, 20, 80);
        this.state.phase = GAME_PHASES.REGULAR_SEASON;
        this.state.userName = payload.userName || 'Coach';

        // Inicializar sistemas da equipa
        this.initializeUserTeamSystems(team.id);

        this.state.liveFeed.unshift({
            timestamp: new Date().toISOString(),
            text: `${this.state.userName} assumiu o comando de ${team.name}!`,
            type: 'teamselection'
        });

        return {
            success: true,
            team: this.getTeamInfo(team.id),
            reputation: this.state.userReputation,
            chemistry: this.state.teamChemistry,
            finances: this.state.teamFinances[team.id]
        };
    }

    initializeUserTeamSystems(teamId) {
        if (!this.state.depthChart[teamId]) {
            const team = this.state.teams.find(t => t.id === teamId);
            this.state.depthChart[teamId] = {
                starters: team.players.slice(0, 5).map(p => p.id),
                rotation: team.players.slice(5, 10).map(p => p.id),
                bench: team.players.slice(10).map(p => p.id)
            };
        }

        // Inicializar moral
        const team = this.state.teams.find(t => t.id === teamId);
        team.players.forEach(player => {
            if (!this.state.playerMorale[player.id]) {
                this.state.playerMorale[player.id] = player.morale || 70;
            }
        });

        this.updateTeamChemistry(teamId);
    }

    updateTeamChemistry(teamId) {
        const team = this.state.teams.find(t => t.id === teamId);
        if (!team) return;

        let chemistry = 50;

        // Moral média
        const avgMorale = team.players.reduce((sum, p) => sum + (this.state.playerMorale[p.id] || 70), 0) / team.players.length;
        chemistry += (avgMorale - 70) * 0.5;

        // Forma recente
        if (team.stats.streak >= 3) chemistry += 15;
        else if (team.stats.streak <= -3) chemistry -= 15;

        this.state.teamChemistry = clamp(chemistry, 0, 100);
    }

    handleSimulateDay(payload) {
        const day = payload?.day || this.state.currentDay;
        const result = this.simulateDay(day);

        if (result.success && !result.userGame) {
            this.state.currentDay++;
        }

        return result;
    }

    handlePlayerGame(payload) {
        const gameData = payload.gameData || payload;
        const result = this.simulateDetailedGame(gameData);

        if (result.success) {
            const game = this.state.schedule
                .find(d => d.day === this.state.currentDay)
                ?.games.find(g => g.homeTeamId === gameData.homeTeamId && g.awayTeamId === gameData.awayTeamId);

            if (game) {
                game.played = true;
                game.result = result.result;
            }

            this.state.currentDay++;
        }

        return result;
    }

    handleSetSpeed(payload) {
        const speed = payload.speed || payload;
        this.state.simulationSpeed = clamp(speed, 1, 10);
        return { success: true, speed: this.state.simulationSpeed };
    }

    handleToggleAuto(payload) {
        this.state.autoSimulate = !this.state.autoSimulate;
        return { success: true, autoSimulate: this.state.autoSimulate };
    }

    handleTrainPlayer(payload) {
        const { playerId, trainingType } = payload;
        
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

        if (targetPlayer.energy < 30) {
            return { success: false, error: 'Jogador sem energia suficiente para treinar' };
        }

        const development = this.state.playerDevelopment[playerId];
        const growthBonus = development?.growthRate || 1.0;

        const trainingEffects = {
            strength: { forca: [2, 5], disciplina: [1, 2], energyCost: 30 },
            shooting: { tecnica: [3, 6], disciplina: [1, 2], energyCost: 25 },
            playmaking: { criatividade: [3, 6], tecnica: [1, 3], energyCost: 25 },
            defense: { disciplina: [3, 6], forca: [1, 3], energyCost: 30 },
            speed: { velocidade: [3, 7], energyCost: 35 },
            mental: { aura: [2, 5], criatividade: [1, 3], energyCost: 20 },
            balanced: { forca: [1, 3], tecnica: [1, 3], velocidade: [1, 3], energyCost: 25 }
        };

        const effect = trainingEffects[trainingType] || trainingEffects.balanced;
        const improvements = {};

        Object.entries(effect).forEach(([attr, range]) => {
            if (attr === 'energyCost') return;
            
            const [min, max] = range;
            const improvement = Math.floor(Math.random() * (max - min + 1) + min) * growthBonus;
            const current = targetPlayer.attributes[attr] || 50;
            const potential = targetPlayer.potential || 85;
            const maxAllowed = Math.min(potential, 99);
            
            targetPlayer.attributes[attr] = Math.min(maxAllowed, current + improvement);
            improvements[attr] = improvement;
        });

        const energyCost = effect.energyCost || 25;
        targetPlayer.energy = Math.max(0, targetPlayer.energy - energyCost);

        if (chance(0.5)) {
            targetPlayer.morale = Math.min(100, targetPlayer.morale + 3);
            this.state.playerMorale[playerId] = targetPlayer.morale;
        }

        this.cache.invalidateCache();

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

        if (starters.length !== 5) {
            throw new Error('Devem ser selecionados 5 titulares');
        }

        const allPlayers = [...starters, ...rotationOrder];
        const invalidPlayer = allPlayers.find(playerId => !team.players.some(p => p.id === playerId));

        if (invalidPlayer) {
            throw new Error('Jogador não pertence à equipa');
        }

        this.state.depthChart[teamId] = {
            starters,
            rotation: rotationOrder,
            bench: team.players
                .filter(p => !allPlayers.includes(p.id))
                .map(p => p.id)
        };

        this.updateTeamChemistry(teamId);
        this.cache.invalidateCache();

        return {
            success: true,
            depthChart: this.state.depthChart[teamId],
            teamChemistry: this.state.teamChemistry
        };
    }

    handleSignFreeAgent(payload) {
        const { teamId, playerId, contractYears, salary } = payload;
        const team = this.state.teams.find(t => t.id === teamId);
        const freeAgent = this.state.freeAgents.find(fa => fa.id === playerId);

        if (!team) throw new Error('Equipa não encontrada');
        if (!freeAgent) throw new Error('Agente livre não encontrado');

        const finances = this.state.teamFinances[teamId];
        if (finances.capSpace < salary) {
            return { success: false, error: 'Espaço salarial insuficiente' };
        }

        const newPlayer = {
            ...freeAgent,
            id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            salary,
            contractYears,
            morale: 70 + Math.random() * 20,
            energy: 100,
            teamId,
            injury: null
        };

        team.players.push(newPlayer);
        this.state.freeAgents = this.state.freeAgents.filter(fa => fa.id !== playerId);

        finances.salaryTotal += salary;
        finances.capSpace -= salary;

        this.state.depthChart[teamId] = this.getOptimalRotation(team.players);
        this.cache.invalidateCache();

        this.state.liveFeed.unshift({
            timestamp: new Date().toISOString(),
            text: `${team.name} contratou ${newPlayer.name} (${newPlayer.position})`,
            type: 'transaction'
        });

        return {
            success: true,
            player: newPlayer,
            team: this.getTeamInfo(teamId),
            finances
        };
    }

    handleSaveGame(payload) {
        const slot = payload?.slot || 1;
        return this.saveSystem.saveGame(this.state, slot);
    }

    handleLoadGame(payload) {
        const slot = payload?.slot || 1;
        const result = this.saveSystem.loadGame(slot);

        if (result.success) {
            this.state = result.state;
            this.cache.invalidateCache();
        }

        return result;
    }

    // ============================================================
    // GETTERS PÚBLICOS
    // ============================================================
    getState() {
        return this.state;
    }

    getTeamInfo(teamId) {
        const team = this.state.teams.find(t => t.id === teamId);
        if (!team) return null;

        return {
            id: team.id,
            name: team.name,
            mythology: team.mythology,
            style: team.style,
            dominantArchetype: team.dominantArchetype,
            conference: team.conference,
            division: team.division,
            stats: { ...team.stats },
            teamPower: this.calculateTeamPower(team),
            roster: {
                players: team.players.map(p => ({
                    ...p,
                    power: this.calculatePlayerPower(p, team.mythology)
                })),
                depthChart: this.state.depthChart[teamId]
            },
            finances: this.state.teamFinances[teamId],
            chemistry: teamId === this.state.playerTeamId ? this.state.teamChemistry : null
        };
    }

    getUserTeamInfo() {
        if (!this.state.playerTeamId) return null;
        return this.getTeamInfo(this.state.playerTeamId);
    }

    getStandings() {
        const cached = this.cache.getStandings();
        if (cached) return cached;

        if (this.state.dirtyFlags.standings) {
            this.updateStandings();
        }

        return this.state.standings;
    }

    getLiveGames() {
        const daySchedule = this.state.schedule.find(d => d.day === this.state.currentDay);
        if (!daySchedule) return { live: [], completed: [] };

        const live = daySchedule.games.filter(g => !g.played).map(g => ({
            homeTeam: this.state.teams.find(t => t.id === g.homeTeamId),
            awayTeam: this.state.teams.find(t => t.id === g.awayTeamId),
            time: g.time,
            isUserGame: g.homeTeamId === this.state.playerTeamId || g.awayTeamId === this.state.playerTeamId
        }));

        const completed = daySchedule.games.filter(g => g.played).map(g => ({
            homeTeam: this.state.teams.find(t => t.id === g.homeTeamId),
            awayTeam: this.state.teams.find(t => t.id === g.awayTeamId),
            result: g.result
        }));

        return { live, completed };
    }

    getUpcomingGames(teamId, count = 5) {
        const upcoming = [];

        for (let day = this.state.currentDay; day <= Math.min(this.state.currentDay + 20, this.state.totalDays); day++) {
            const daySchedule = this.state.schedule.find(d => d.day === day);
            if (daySchedule) {
                const game = daySchedule.games.find(g =>
                    g.homeTeamId === teamId || g.awayTeamId === teamId
                );

                if (game) {
                    const opponentId = game.homeTeamId === teamId ? game.awayTeamId : game.homeTeamId;
                    const opponent = this.state.teams.find(t => t.id === opponentId);

                    upcoming.push({
                        day,
                        date: game.date,
                        time: game.time,
                        opponentId,
                        opponentName: opponent?.name || `Equipa ${opponentId}`,
                        opponentMythology: opponent?.mythology || 'Desconhecida',
                        isHome: game.homeTeamId === teamId,
                        location: game.homeTeamId === teamId ? 'Casa' : 'Fora'
                    });

                    if (upcoming.length >= count) break;
                }
            }
        }

        return upcoming;
    }
}
