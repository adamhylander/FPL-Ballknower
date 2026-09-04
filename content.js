// ==UserScript==
// @name         FPL Mini-League Transfers + Player Filter
// @namespace    fpl-transfers-column
// @version      1.9
// @description  Shows net transfers, FT/hits, and dropdowns to highlight owners/captains/bench/starters of a player
// @match        https://fantasy.premierleague.com/*leagues/*/standings/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const API = 'https://fantasy.premierleague.com/api';
  let playerNames = null;
  let playerPos = null;
  let targetEvent = null;

  let squadsLoaded = false;
  let ownersByType = { owned: {}, captained: {}, benched: {}, started: {} };
  let selectedPlayerId = null;
  let selectedType = 'owned';
  let dropdownBuilt = false;

  // --- tooltip ---
  let tooltip = null;
  function ensureTooltip() {
    if (tooltip) return tooltip;
    tooltip = document.createElement('div');
    tooltip.style.position = 'fixed';
    tooltip.style.zIndex = '99999';
    tooltip.style.background = '#1a0e2e';
    tooltip.style.border = '1px solid #7b5cff';
    tooltip.style.borderRadius = '6px';
    tooltip.style.padding = '8px 10px';
    tooltip.style.fontSize = '12px';
    tooltip.style.color = '#fff';
    tooltip.style.maxWidth = '260px';
    tooltip.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
    tooltip.style.display = 'none';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.lineHeight = '1.5';
    tooltip.style.whiteSpace = 'pre-line';
    document.body.appendChild(tooltip);
    return tooltip;
  }
  function showTooltip(el, text) {
    const tip = ensureTooltip();
    tip.textContent = text;
    tip.style.display = 'block';
    const rect = el.getBoundingClientRect();
    tip.style.left = `${rect.left}px`;
    tip.style.top = `${rect.bottom + 6}px`;
  }
  function hideTooltip() { if (tooltip) tooltip.style.display = 'none'; }

  async function loadBootstrap() {
    const res = await fetch(`${API}/bootstrap-static/`);
    const data = await res.json();
    playerNames = {};
    playerPos = {};
    data.elements.forEach(el => {
      playerNames[el.id] = el.web_name;
      playerPos[el.id] = el.element_type;
    });
    const current = data.events.find(e => e.is_current);
    targetEvent = current ? current.id : data.events.filter(e => e.finished).pop().id;
  }

  async function getTransfers(entryId) {
    try {
      const res = await fetch(`${API}/entry/${entryId}/transfers/`);
      const data = await res.json();
      return data.filter(t => t.event === targetEvent);
    } catch (e) { return []; }
  }

  async function getHistory(entryId) {
    try {
      const res = await fetch(`${API}/entry/${entryId}/history/`);
      return await res.json();
    } catch (e) { return null; }
  }

  async function getPicksDetailed(entryId) {
    try {
      const res = await fetch(`${API}/entry/${entryId}/event/${targetEvent}/picks/`);
      const data = await res.json();
      return data.picks || [];
    } catch (e) { return []; }
  }

  function computeFtAndHits(history) {
    if (!history || !history.current || !history.current.length) return { ft: null, hits: 0 };
    const chipByEvent = {};
    (history.chips || []).forEach(c => { chipByEvent[c.event] = c.name; });
    let ft = 1;
    let totalHits = 0;
    history.current.forEach((gw, idx) => {
      totalHits += gw.event_transfers_cost || 0;
      const chip = chipByEvent[gw.event];
      const isFreeMoveChip = chip === 'wildcard' || chip === 'freehit';
      const transfersMade = isFreeMoveChip ? 0 : (gw.event_transfers || 0);
      if (idx === history.current.length - 1) {
        ft = Math.max(ft - transfersMade, 0);
      } else {
        ft = Math.min(Math.max(ft - transfersMade, 0) + 1, 5);
      }
    });
    return { ft, hits: totalHits };
  }

  function netTransfers(list) {
    const outsCount = {};
    const insCount = {};
    list.forEach(t => {
      outsCount[t.element_out] = (outsCount[t.element_out] || 0) + 1;
      insCount[t.element_in] = (insCount[t.element_in] || 0) + 1;
    });
    for (const id in outsCount) {
      const cancel = Math.min(outsCount[id], insCount[id] || 0);
      outsCount[id] -= cancel;
      if (insCount[id]) insCount[id] -= cancel;
    }
    const netOuts = [];
    const netIns = [];
    for (const id in outsCount) for (let i = 0; i < outsCount[id]; i++) netOuts.push(Number(id));
    for (const id in insCount) for (let i = 0; i < insCount[id]; i++) netIns.push(Number(id));
    return { netOuts, netIns };
  }

  function pairByPosition(netOuts, netIns) {
    const outsByPos = { 1: [], 2: [], 3: [], 4: [] };
    const insByPos = { 1: [], 2: [], 3: [], 4: [] };
    netOuts.forEach(id => outsByPos[playerPos[id]]?.push(id));
    netIns.forEach(id => insByPos[playerPos[id]]?.push(id));
    const pairs = [];
    const leftoverOuts = [];
    const leftoverIns = [];
    [1, 2, 3, 4].forEach(pos => {
      const outs = outsByPos[pos];
      const ins = insByPos[pos];
      const n = Math.min(outs.length, ins.length);
      for (let i = 0; i < n; i++) pairs.push([outs[i], ins[i]]);
      leftoverOuts.push(...outs.slice(n));
      leftoverIns.push(...ins.slice(n));
    });
    const n = Math.max(leftoverOuts.length, leftoverIns.length);
    for (let i = 0; i < n; i++) pairs.push([leftoverOuts[i] ?? null, leftoverIns[i] ?? null]);
    return pairs;
  }

  function nameOf(id) { return id == null ? '—' : (playerNames[id] || '?'); }
  function buildPairStrings(pairs) { return pairs.map(([o, i]) => `${nameOf(o)} → ${nameOf(i)}`); }

  function findStandingsTable() {
    const tables = document.querySelectorAll('table');
    for (const t of tables) if (t.textContent.includes('Team & Manager')) return t;
    return null;
  }

  function getEntryIdFromRow(row) {
    const link = row.querySelector('td[role="rowheader"] a[href*="/entry/"]');
    if (!link) return null;
    const m = link.getAttribute('href').match(/\/entry\/(\d+)/);
    return m ? m[1] : null;
  }

  function addOwner(bucket, playerId, entryId) {
    if (!bucket[playerId]) bucket[playerId] = new Set();
    bucket[playerId].add(entryId);
  }

  function styledSelectWithArrow() {
    const holder = document.createElement('div');
    holder.style.position = 'relative';
    holder.style.display = 'inline-flex';
    holder.style.alignItems = 'center';
    holder.style.alignSelf = 'center';
    holder.style.height = '42px';

    const select = document.createElement('select');
    select.style.boxSizing = 'border-box';
    select.style.height = '42px';
    select.style.lineHeight = '40px'; // slightly less than height to account for border
    select.style.padding = '0 34px 0 16px';
    select.style.margin = '0';
    select.style.borderRadius = '999px';
    select.style.background = 'transparent';
    select.style.color = '#fff';
    select.style.border = '1px solid rgba(255,255,255,0.5)';
    select.style.fontSize = '14px';
    select.style.fontFamily = 'inherit';
    select.style.fontWeight = '600';
    select.style.cursor = 'pointer';
    select.style.outline = 'none';
    select.style.appearance = 'none';
    select.style.webkitAppearance = 'none';
    select.style.mozAppearance = 'none';
    select.style.verticalAlign = 'middle';
    select.addEventListener('mouseenter', () => { select.style.borderColor = '#00ff87'; });
    select.addEventListener('mouseleave', () => { select.style.borderColor = 'rgba(255,255,255,0.5)'; });

    const arrow = document.createElement('span');
    arrow.style.position = 'absolute';
    arrow.style.right = '14px';
    arrow.style.top = '50%';
    arrow.style.width = '0';
    arrow.style.height = '0';
    arrow.style.borderLeft = '5px solid transparent';
    arrow.style.borderRight = '5px solid transparent';
    arrow.style.borderTop = '6px solid #fff';
    arrow.style.opacity = '0.85';
    arrow.style.pointerEvents = 'none';
    arrow.style.marginTop = '-3px'; // half the arrow's own height, since translateY interacts oddly with top:50% on some engines
    arrow.style.transform = 'translateY(0)';

    holder.appendChild(select);
    holder.appendChild(arrow);
    return { holder, select };
  }

  function buildDropdown() {
    if (dropdownBuilt) return;
    const reportBtn = document.querySelector('a[href*="/help/report-name"]');
    if (!reportBtn) return;

    const localHeader = reportBtn.closest('header');
    if (!localHeader) return;

    const buttonContainer = reportBtn.parentElement;
    if (!buttonContainer || !buttonContainer.parentElement) return;

    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '10px';
    wrapper.style.fontFamily = 'inherit';
    wrapper.style.flexShrink = '0';
    wrapper.style.alignSelf = 'center';
    wrapper.style.height = '42px';

    const { holder: playerHolder, select: playerSelect } = styledSelectWithArrow(reportBtn);
    playerSelect.id = 'fpl-player-filter';
    playerSelect.style.minWidth = '170px';
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = '— none —';
    playerSelect.appendChild(defaultOpt);

    const { holder: typeHolder, select: typeSelect } = styledSelectWithArrow(reportBtn);
    typeSelect.id = 'fpl-type-filter';
    [
      ['owned', 'Owned'],
      ['captained', 'Captained'],
      ['benched', 'Benched'],
      ['started', 'Started'],
    ].forEach(([value, text]) => {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = text;
      typeSelect.appendChild(opt);
    });
    typeSelect.value = 'owned';

    playerSelect.addEventListener('change', () => {
      selectedPlayerId = playerSelect.value ? Number(playerSelect.value) : null;
      applyHighlight();
    });
    typeSelect.addEventListener('change', () => {
      selectedType = typeSelect.value;
      populateDropdown();
      applyHighlight();
    });

    wrapper.appendChild(playerHolder);
    wrapper.appendChild(typeHolder);

    buttonContainer.parentElement.insertBefore(wrapper, buttonContainer);

    dropdownBuilt = true;
  }
  // Player list is always drawn from the full "owned" set, so switching the
  // type dropdown never removes an already-selected player from the list —
  // the count shown just reflects how many match the current type (can be 0).
  function populateDropdown() {
    const select = document.getElementById('fpl-player-filter');
    if (!select) return;

    const allOwnedIds = Object.keys(ownersByType.owned)
      .map(Number)
      .filter(id => ownersByType.owned[id].size > 0);
    allOwnedIds.sort((a, b) => (playerNames[a] || '').localeCompare(playerNames[b] || ''));

    const previousValue = select.value;
    while (select.options.length > 1) select.remove(1);

    const bucket = ownersByType[selectedType] || {};
    allOwnedIds.forEach(id => {
      const count = bucket[id] ? bucket[id].size : 0;
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = `${playerNames[id] || '?'} (${count})`;
      select.appendChild(opt);
    });

    // Selection now always persists across type changes, since every owned
    // player stays in the list regardless of the current filter type.
    if (previousValue) {
      select.value = previousValue;
      selectedPlayerId = Number(previousValue);
    }
  }

  async function loadAllSquads() {
    const table = findStandingsTable();
    if (!table) return;
    const rows = table.querySelectorAll('tbody tr');
    const entryIds = [...rows].map(getEntryIdFromRow).filter(Boolean);

    await Promise.all(entryIds.map(async entryId => {
      const picks = await getPicksDetailed(entryId);
      picks.forEach(p => {
        const pid = p.element;
        addOwner(ownersByType.owned, pid, entryId);
        if (p.position <= 11) addOwner(ownersByType.started, pid, entryId);
        if (p.position > 11) addOwner(ownersByType.benched, pid, entryId);
        if (p.is_captain) addOwner(ownersByType.captained, pid, entryId);
      });
    }));

    squadsLoaded = true;
    populateDropdown();
    applyHighlight();
  }

  function applyHighlight() {
    const table = findStandingsTable();
    if (!table) return;
    const rows = table.querySelectorAll('tbody tr');
    const bucket = ownersByType[selectedType] || {};
    const matchSet = selectedPlayerId != null ? bucket[selectedPlayerId] : null;

    rows.forEach(row => {
      const entryId = getEntryIdFromRow(row);
      const matches = matchSet && entryId && matchSet.has(entryId);
      if (matches) {
        row.style.outline = '2px solid #00ff87';
        row.style.outlineOffset = '-2px';
      } else {
        row.style.outline = '';
        row.style.outlineOffset = '';
      }
    });
  }

  async function run() {
    const table = findStandingsTable();
    if (!table) return;
    const rows = table.querySelectorAll('tbody tr');
    if (!rows.length) return;

    if (!playerNames) await loadBootstrap();
    buildDropdown();

    for (const row of rows) {
      const cell = row.querySelector('td[role="rowheader"]');
      if (!cell || cell.querySelector('.fpl-tx-line')) continue;

      const link = cell.querySelector('a[href*="/entry/"]');
      if (!link) continue;
      const match = link.getAttribute('href').match(/\/entry\/(\d+)/);
      if (!match) continue;
      const entryId = match[1];

      const nameBlock = cell.querySelector('div._4xqwov0');
      if (!nameBlock) continue;

      const line = document.createElement('div');
      line.className = 'fpl-tx-line';
      line.style.fontSize = '11px';
      line.style.opacity = '0.7';
      line.style.marginTop = '2px';
      line.style.whiteSpace = 'normal';
      line.textContent = '…';
      nameBlock.appendChild(line);

      const metaLine = document.createElement('div');
      metaLine.className = 'fpl-meta-line';
      metaLine.style.fontSize = '10px';
      metaLine.style.opacity = '0.55';
      metaLine.style.marginTop = '1px';
      nameBlock.appendChild(metaLine);

      getTransfers(entryId).then(rawList => {
        const { netOuts, netIns } = netTransfers(rawList);
        const pairs = pairByPosition(netOuts, netIns);
        const pairStrings = buildPairStrings(pairs);

        if (!pairStrings.length) {
          line.textContent = '';
        } else if (pairStrings.length > 4) {
          line.textContent = `${pairStrings.length} transfers`;
          line.style.cursor = 'help';
          line.style.textDecoration = 'underline dotted';
          const fullText = pairStrings.join('\n');
          line.addEventListener('mouseenter', () => showTooltip(line, fullText));
          line.addEventListener('mouseleave', hideTooltip);
        } else {
          line.textContent = pairStrings.join(', ');
        }
      });

      getHistory(entryId).then(history => {
        const { ft, hits } = computeFtAndHits(history);
        const ftText = ft === null ? '' : `FT: ${ft}`;
        const hitsText = hits > 0 ? `Hits: -${hits}` : '';
        metaLine.textContent = [ftText, hitsText].filter(Boolean).join('  ·  ');
      });
    }

    if (!squadsLoaded) loadAllSquads();
    else applyHighlight();
  }

  const observer = new MutationObserver(() => run());
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(run, 1500);
})();