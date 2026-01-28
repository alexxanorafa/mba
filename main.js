// main.js
// ============================================================
// ELIFOOT MITOLÓGICO NBA v1.0 - CAMADA UI (SEM FRAMEWORK)
// Responsável por: boot, bind de eventos, render básico.
// Não contém lógica de jogo: usa apenas a API do Game.
// ============================================================

import { Game } from './game.js';

// ============================================================
// UI UTILITIES (sem dependência do motor)
// ============================================================

function $(selector) {
  return document.querySelector(selector);
}

function $all(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function updateLoading(message, percent = null) {
  const progressText = $('#loading-progress');
  const progressFill = $('#progress-fill');

  if (progressText) progressText.textContent = message;
  if (progressFill && percent != null) {
    progressFill.style.width = `${percent}%`;
  }
}

function showError(message) {
  console.error('Erro:', message);
  const statusText = $('#status-text');
  if (statusText) {
    statusText.textContent = `❌ Erro: ${message}`;
    statusText.style.color = '#ff3b3b';
  }
  alert(`Erro: ${message}\n\nRecarrega a página e tenta novamente.`);
}

function setStatus(message) {
  const statusText = $('#status-text');
  if (statusText) {
    statusText.textContent = message;
    statusText.style.color = '#ffffff';
  }
}

// ============================================================
// RENDER BÁSICO
// ============================================================

function renderStandings() {
  const containers = {
    EAST: $('#standings-east'),
    WEST: $('#standings-west')
  };

  const standings = Game.getStandings();

  ['EAST', 'WEST'].forEach(conf => {
    const container = containers[conf];
    if (!container) return;

    container.innerHTML = '';

    const list = document.createElement('ol');
    list.className = 'standings-list';

    (standings[conf] || []).forEach(team => {
      const li = document.createElement('li');
      li.className = 'standings-item';
      li.textContent = `${team.name} — ${team.wins}-${team.losses} (${team.pointsFor}:${team.pointsAgainst})`;
      list.appendChild(li);
    });

    container.appendChild(list);
  });
}

function renderRecentGames() {
  const container = $('#recent-games');
  if (!container) return;

  const games = Game.getRecentGames().slice().reverse().slice(0, 10);

  container.innerHTML = '';
  if (!games.length) {
    container.textContent = 'Ainda não há jogos simulados.';
    return;
  }

  const ul = document.createElement('ul');
  ul.className = 'games-list';

  games.forEach(g => {
    const li = document.createElement('li');
    li.className = 'games-item';

    const phaseLabel =
      g.phase === 'playoffs'
        ? `Playoffs R${g.round} (${g.conference})`
        : g.phase === 'finals'
        ? 'Finais'
        : 'Época Regular';

    li.textContent = `[${phaseLabel}] ${g.summary || ''}`;
    ul.appendChild(li);
  });

  container.appendChild(ul);
}

function renderCapInfo() {
  const container = $('#cap-info');
  if (!container) return;

  const teamSelect = $('#team-select');
  if (!teamSelect) {
    container.textContent = '';
    return;
  }

  const teamId = parseInt(teamSelect.value, 10);
  const team = Game.getTeam(teamId);
  if (!team) {
    container.textContent = '';
    return;
  }

  const capInfo = Game.getTeamCapInfo(teamId);
  container.textContent = `Cap: ${
    Game.state.economy.salaryCap
  } | Payroll: ${capInfo.payroll} | Space: ${capInfo.space} | Over Cap: ${
    capInfo.overCap ? 'Sim' : 'Não'
  }`;
}

function renderTeamSelect() {
  const select = $('#team-select');
  if (!select) return;

  select.innerHTML = '';
  Game.state.teams.forEach(team => {
    const opt = document.createElement('option');
    opt.value = team.id;
    opt.textContent = `${team.name} (${team.conference})`;
    select.appendChild(opt);
  });

  select.addEventListener('change', () => {
    renderCapInfo();
    renderTeamRoster();
  });

  // seleção inicial
  if (Game.state.teams.length) {
    select.value = Game.state.teams[0].id;
  }
}

function renderTeamRoster() {
  const container = $('#team-roster');
  if (!container) return;

  const teamSelect = $('#team-select');
  const teamId = teamSelect ? parseInt(teamSelect.value, 10) : null;
  const team = teamId ? Game.getTeam(teamId) : null;

  container.innerHTML = '';
  if (!team) {
    container.textContent = 'Nenhuma equipa selecionada.';
    return;
  }

  const ul = document.createElement('ul');
  ul.className = 'roster-list';

  team.players.forEach(player => {
    const li = document.createElement('li');
    li.className = 'roster-item';
    li.textContent = `${player.name} — salário: ${player.salary} | anos: ${player.contractYears}`;
    ul.appendChild(li);
  });

  container.appendChild(ul);
}

// ============================================================
// INTERAÇÃO PRINCIPAL
// ============================================================

function setupControls() {
  const btnSimulate = $('#btn-simulate-next');
  if (btnSimulate) {
    btnSimulate.addEventListener('click', () => {
      if (!Game.state.initialized) return;
      const phase = Game.state.phase;

      const result = Game.simulateNext();

      switch (phase) {
        case 'regular_season':
          setStatus('Simulaste mais um jogo da época regular.');
          break;
        case 'playoffs':
          setStatus('Simulaste mais um jogo dos playoffs.');
          break;
        case 'finals':
          setStatus('Simulaste mais um jogo das finais.');
          break;
        default:
          setStatus('Simulação executada.');
      }

      renderStandings();
      renderRecentGames();
      renderCapInfo();
      renderTeamRoster();

      if (Game.state.phase === 'finished') {
        const champion = Game.getTeam(Game.state.finals.championId);
        if (champion) {
          setStatus(`🏆 Campeão mitológico da NBA: ${champion.name}!`);
        }
      }
    });
  }

  const btnRefresh = $('#btn-refresh-standings');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
      renderStandings();
      renderRecentGames();
      renderCapInfo();
      renderTeamRoster();
    });
  }
}

// ============================================================
// BOOT
// ============================================================

async function boot() {
  try {
    updateLoading('Carregando dados mitológicos...', 10);
    const response = await fetch('./data.json');
    if (!response.ok) throw new Error('Falha ao carregar data.json');
    const data = await response.json();

    updateLoading('Inicializando motor de jogo...', 40);
    Game.init(data);

    updateLoading('Preparando interface...', 70);
    renderStandings();
    renderTeamSelect();
    renderCapInfo();
    renderTeamRoster();
    renderRecentGames();
    setupControls();

    updateLoading('Pronto para jogar!', 100);

    const loadingScreen = $('#loading-screen');
    const app = $('#app');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
    }
    if (app) {
      app.classList.remove('hidden');
    }

    setStatus('🏀 Época mitológica NBA iniciada!');
    // helpers para debug no console
    window.GameState = Game.state;
    window.GameAPI = Game;
  } catch (err) {
    showError(err.message || 'Erro inesperado no boot');
  }
}

document.addEventListener('DOMContentLoaded', boot);
