/**
 * QuickSplit — Precision Cost Allocation & Instant Clearance
 * Designed for College Projects, Hackathons, and Shared Residences.
 * 
 * Features:
 * - Clean zero-fake-history start (user adds and manages everything)
 * - Multi-payer bills (e.g., You: ₹500, Friend 1: ₹300, Friend 2: ₹400 = Total ₹1200)
 * - Precise Greedy Min-Cash-Flow settlement solver ("Who pays whom how much")
 * - UPI quick pay (GPay / PhonePe / Paytm / BHIM)
 * - 1-Click WhatsApp Split generator
 * - Cleared settlement audit trail
 * - LocalStorage sync
 */

(function () {
  'use strict';

  // --- Avatar Color Palette ---
  const AVATAR_COLORS = [
    '#6366F1', '#EC4899', '#10B981', '#F59E0B', 
    '#3B82F6', '#8B5CF6', '#14B8A6', '#F43F5E',
    '#06B6D4', '#84CC16', '#FF9933', '#D946EF'
  ];

  const CATEGORY_ICONS = {
    'Hardware': '🔌',
    'Software': '☁️',
    'Printing': '🖨️',
    'Food': '🍕',
    'Groceries': '🛒',
    'Rent': '🏠',
    'Utilities': '💡',
    'Transport': '🚕',
    'Other': '📦'
  };

  const CATEGORY_COLORS = {
    'Hardware': '#3B82F6',
    'Software': '#8B5CF6',
    'Printing': '#EC4899',
    'Food': '#F43F5E',
    'Groceries': '#10B981',
    'Rent': '#F59E0B',
    'Utilities': '#06B6D4',
    'Transport': '#84CC16',
    'Other': '#64748B'
  };

  // --- Storage Key ---
  const STORAGE_KEY = 'letssplit_india_v2';

  // --- App State ---
  let state = {
    groups: [],
    activeGroupId: null,
    theme: 'dark',
    currentTab: 'expenses',
    filters: {
      search: '',
      category: 'all'
    },
    // Modal temporary states
    expensePayerMode: 'SINGLE', // 'SINGLE' or 'MULTI'
    onboardingMembers: ['Me', 'Friend 1', 'Friend 2'],
    newGroupMembers: ['Me', 'Friend 1', 'Friend 2']
  };

  // =========================================================================
  // STORAGE & INITIALIZATION
  // =========================================================================
  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) {
          state.groups = parsed.groups || [];
          state.activeGroupId = parsed.activeGroupId || (state.groups[0] ? state.groups[0].id : null);
          state.theme = parsed.theme || 'dark';

          // Automatic cleanup: replace any legacy 'hisab' in saved groups with 'split'
          state.groups.forEach(g => {
            if (g.desc) g.desc = g.desc.replace(/hisab/gi, 'split');
            if (g.description) g.description = g.description.replace(/hisab/gi, 'split');
            if (g.name) g.name = g.name.replace(/hisab/gi, 'Split');
            (g.expenses || []).forEach(e => {
              if (e.description) e.description = e.description.replace(/hisab/gi, 'split');
              if (e.notes) e.notes = e.notes.replace(/hisab/gi, 'split');
            });
          });
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved state:', e);
    }

    // Completely FRESH state: No dummy history!
    state.groups = [];
    state.activeGroupId = null;
    state.theme = 'dark';
    saveState();
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        groups: state.groups,
        activeGroupId: state.activeGroupId,
        theme: state.theme
      }));
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  }

  function getActiveGroup() {
    if (!state.activeGroupId || state.groups.length === 0) return null;
    return state.groups.find(g => g.id === state.activeGroupId) || state.groups[0];
  }

  function getMember(group, memberId) {
    if (!group || !group.members) return { id: memberId, name: 'Unknown', color: '#94A3B8' };
    return group.members.find(m => m.id === memberId) || { id: memberId, name: 'Unknown', color: '#94A3B8' };
  }

  function formatMoney(amount, currency = '₹') {
    const num = Number(amount) || 0;
    // Format in Indian number format if Rupee
    if (currency === '₹') {
      return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${currency}${num.toFixed(2)}`;
  }

  // =========================================================================
  // EXACT SPLIT & DEBT SIMPLIFICATION ALGORITHM
  // Handles:
  // - Single Payer expenses
  // - Multiple Contributors/Payers on a single bill (e.g. Me: 500, F1: 300, F2: 400)
  // - Cleared settlements
  // - Greedy Min-Cash-Flow pairing
  // =========================================================================
  function computeNetBalances(group) {
    const net = {};
    const paidTotal = {};
    const shareTotal = {};

    if (!group || !group.members) return { net, paidTotal, shareTotal };

    group.members.forEach(m => {
      net[m.id] = 0;
      paidTotal[m.id] = 0;
      shareTotal[m.id] = 0;
    });

    // 1. Process Expenses
    group.expenses.forEach(exp => {
      // Support for both Multiple Payers AND Legacy/Single Payer
      if (exp.payers && exp.payers.length > 0) {
        exp.payers.forEach(p => {
          const pAmt = Number(p.amount) || 0;
          if (paidTotal[p.memberId] !== undefined) {
            paidTotal[p.memberId] += pAmt;
            net[p.memberId] += pAmt;
          }
        });
      } else if (exp.payerId) {
        const amt = Number(exp.amount) || 0;
        if (paidTotal[exp.payerId] !== undefined) {
          paidTotal[exp.payerId] += amt;
          net[exp.payerId] += amt;
        }
      }

      // Individual shares owed
      if (exp.splits && exp.splits.length > 0) {
        exp.splits.forEach(s => {
          const sAmt = Number(s.amount) || 0;
          if (shareTotal[s.memberId] !== undefined) {
            shareTotal[s.memberId] += sAmt;
            net[s.memberId] -= sAmt;
          }
        });
      }
    });

    // 2. Process Cleared Settlements
    (group.settlements || []).forEach(stl => {
      const amt = Number(stl.amount) || 0;
      const fromId = stl.fromId;
      const toId = stl.toId;

      if (net[fromId] !== undefined) {
        net[fromId] += amt; // Debt cleared
      }
      if (net[toId] !== undefined) {
        net[toId] -= amt; // Credit received
      }
    });

    return { net, paidTotal, shareTotal };
  }

  function calculateOptimalSettlements(group) {
    if (!group) return [];
    const { net } = computeNetBalances(group);
    const creditors = []; // Needs to receive money (net > 0)
    const debtors = [];   // Needs to pay money (net < 0)

    Object.keys(net).forEach(memberId => {
      const val = Math.round(net[memberId] * 100) / 100;
      if (val > 0.01) {
        creditors.push({ id: memberId, amount: val });
      } else if (val < -0.01) {
        debtors.push({ id: memberId, amount: -val }); // positive debt value
      }
    });

    // Sort descending by value
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const transactions = [];
    let cIdx = 0;
    let dIdx = 0;

    while (cIdx < creditors.length && dIdx < debtors.length) {
      const creditor = creditors[cIdx];
      const debtor = debtors[dIdx];

      const settleAmt = Math.min(creditor.amount, debtor.amount);
      const roundedAmt = Math.round(settleAmt * 100) / 100;

      if (roundedAmt > 0) {
        transactions.push({
          fromId: debtor.id,
          toId: creditor.id,
          amount: roundedAmt
        });
      }

      creditor.amount = Math.round((creditor.amount - settleAmt) * 100) / 100;
      debtor.amount = Math.round((debtor.amount - settleAmt) * 100) / 100;

      if (creditor.amount <= 0.01) cIdx++;
      if (debtor.amount <= 0.01) dIdx++;
    }

    // Always sort recommended settlement transfers descending by amount (largest debts first)
    transactions.sort((a, b) => b.amount - a.amount);

    return transactions;
  }

  // =========================================================================
  // VIEW RENDERING
  // =========================================================================
  function renderAll() {
    const group = getActiveGroup();
    const onboardingView = document.getElementById('onboarding-view');
    const dashboardView = document.getElementById('dashboard-view');

    if (!group) {
      // Show clean onboarding screen to create first group
      onboardingView.classList.remove('hidden');
      dashboardView.classList.add('hidden');
      renderOnboardingChips();
      document.getElementById('active-group-name').textContent = 'No Group';
      return;
    }

    onboardingView.classList.add('hidden');
    dashboardView.classList.remove('hidden');

    renderHeaderAndHero(group);
    renderMetrics(group);
    renderSettlementBanner(group);
    renderExpensesList(group);
    renderBalancesTab(group);
    renderInsightsTab(group);
    renderHistoryTab(group);
  }

  function renderHeaderAndHero(group) {
    const currency = group.currency || '₹';

    // Group switcher navbar label
    document.getElementById('active-group-name').textContent = group.name;

    // Currency selector
    const currSelect = document.getElementById('currency-select');
    if (currSelect) currSelect.value = currency;

    // Hero banner text
    document.getElementById('group-type-tag').textContent = group.type || 'Group Split';
    document.getElementById('group-members-count').textContent = `${group.members.length} Friends`;
    document.getElementById('group-currency-badge').textContent = `Currency: ${currency}`;
    document.getElementById('group-display-title').textContent = group.name;
    const rawDesc = group.desc || group.description || 'Tracking shared spending and split breakdown.';
    document.getElementById('group-display-desc').textContent = rawDesc.replace(/hisab/gi, 'split');

    // Populate Groups Dropdown
    const groupsListDropdown = document.getElementById('groups-list-dropdown');
    groupsListDropdown.innerHTML = '';
    state.groups.forEach(g => {
      const row = document.createElement('div');
      row.className = `group-item-row ${g.id === group.id ? 'active' : ''}`;
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.justifyContent = 'space-between';
      row.style.gap = '0.5rem';

      row.innerHTML = `
        <div class="group-item-info" style="flex:1; cursor:pointer;">
          <div class="group-item-title">${escapeHtml(g.name)}</div>
          <div class="group-item-type">${escapeHtml(g.type || 'Group')} • ${g.members.length} friends</div>
        </div>
        <div style="display:flex; align-items:center; gap:0.4rem;">
          ${g.id === group.id ? '<span style="color:var(--accent-emerald);font-size:0.75rem;font-weight:700">● Active</span>' : ''}
          <button class="btn-group-trash" title="Delete Group ${escapeHtml(g.name)}" aria-label="Delete group" style="background:transparent; border:none; cursor:pointer; font-size:0.95rem; opacity:0.65; padding:4px; border-radius:4px; transition:opacity 0.2s;">🗑️</button>
        </div>
      `;

      row.querySelector('.group-item-info').onclick = () => {
        state.activeGroupId = g.id;
        saveState();
        closeAllDropdowns();
        renderAll();
        showToast(`Switched to "${g.name}"`, 'info');
      };

      const trash = row.querySelector('.btn-group-trash');
      trash.onmouseenter = () => trash.style.opacity = '1';
      trash.onmouseleave = () => trash.style.opacity = '0.65';
      trash.onclick = (e) => {
        e.stopPropagation();
        deleteGroup(g.id);
      };

      groupsListDropdown.appendChild(row);
    });
  }

  function renderMetrics(group) {
    const currency = group.currency || '₹';

    // 1. Total Spending
    const totalSpent = group.expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    document.getElementById('metric-total-spent').textContent = formatMoney(totalSpent, currency);
    document.getElementById('metric-expense-count').textContent = `${group.expenses.length} bills`;

    // 2. Per Person Share
    const numMembers = group.members.length || 1;
    const avgPerPerson = totalSpent / numMembers;
    document.getElementById('metric-avg-per-person').textContent = formatMoney(avgPerPerson, currency);
    document.getElementById('metric-active-members-count').textContent = numMembers;

    // 3. Pending Transfers
    const optimalTransfers = calculateOptimalSettlements(group);
    document.getElementById('metric-pending-transactions').textContent = optimalTransfers.length;
    document.getElementById('tab-expenses-badge').textContent = group.expenses.length;

    if (optimalTransfers.length === 0) {
      document.getElementById('metric-pending-subtext').textContent = '🎉 All splits are settled!';
    } else {
      document.getElementById('metric-pending-subtext').textContent = 'Direct clearance required';
    }

    // 4. Money Cleared
    const totalSettledAmt = (group.settlements || []).reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    document.getElementById('metric-settled-amount').textContent = formatMoney(totalSettledAmt, currency);
    document.getElementById('metric-settled-count').textContent = (group.settlements || []).length;
  }

  // --- Banner Settlement Section (Who Pays Whom) ---
  function renderSettlementBanner(group) {
    const currency = group.currency || '₹';
    const container = document.getElementById('banner-transfers-list');
    const allClearedCard = document.getElementById('banner-all-cleared');

    container.innerHTML = '';
    const transfers = calculateOptimalSettlements(group);

    if (transfers.length === 0) {
      allClearedCard.classList.remove('hidden');
      return;
    }
    allClearedCard.classList.add('hidden');

    transfers.forEach(transfer => {
      const payer = getMember(group, transfer.fromId);
      const receiver = getMember(group, transfer.toId);

      const card = document.createElement('div');
      card.className = 'banner-transfer-card';

      // Build UPI deep link if receiver has a UPI ID
      const upiId = receiver.upiId || '';
      const upiLink = upiId 
        ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(receiver.name)}&am=${transfer.amount}&cu=INR&tn=${encodeURIComponent(`Let'sSplit payment from ${payer.name}`)}`
        : null;

      card.innerHTML = `
        <div class="transfer-header-row">
          <div class="transfer-members-flow">
            <span class="transfer-from-name">${escapeHtml(payer.name)}</span>
            <span style="color:var(--text-muted); font-size:1.1rem">➔</span>
            <span class="transfer-to-name">${escapeHtml(receiver.name)}</span>
          </div>
          <span class="transfer-amount-badge">${formatMoney(transfer.amount, currency)}</span>
        </div>

        <div class="transfer-actions-row">
          <button class="btn-upi-pay" data-banner-qr-payer="${payer.id}" data-banner-qr-receiver="${receiver.id}" data-banner-qr-amt="${transfer.amount}" title="Generate Dynamic UPI QR Code">
            ⚡ Scan UPI QR
          </button>

          <button class="glow-primary-btn btn-sm" data-banner-clear-payer="${payer.id}" data-banner-clear-receiver="${receiver.id}" data-banner-clear-amt="${transfer.amount}">
            <span>✅ Clear Money</span>
          </button>
        </div>
      `;

      card.querySelector('[data-banner-clear-payer]').onclick = () => {
        openSettleModal(payer.id, receiver.id, transfer.amount);
      };

      container.appendChild(card);
    });
  }

  function renderExpensesList(group) {
    const currency = group.currency || '₹';
    const listContainer = document.getElementById('expenses-list');
    const emptyState = document.getElementById('expenses-empty-state');

    listContainer.innerHTML = '';

    // Apply Filter & Search
    let filtered = group.expenses.filter(exp => {
      if (state.filters.search) {
        const query = state.filters.search.toLowerCase();
        const matchTitle = (exp.title || '').toLowerCase().includes(query);
        const matchNotes = (exp.notes || '').toLowerCase().includes(query);
        let matchPayer = false;
        if (exp.payers) {
          matchPayer = exp.payers.some(p => getMember(group, p.memberId).name.toLowerCase().includes(query));
        } else if (exp.payerId) {
          matchPayer = getMember(group, exp.payerId).name.toLowerCase().includes(query);
        }
        if (!matchTitle && !matchNotes && !matchPayer) return false;
      }
      if (state.filters.category !== 'all' && exp.category !== state.filters.category) {
        return false;
      }
      return true;
    });

    // Sort newest date first, then highest amount first for precision
    filtered.sort((a, b) => {
      const dateDiff = new Date(b.date) - new Date(a.date);
      if (dateDiff !== 0) return dateDiff;
      return (b.amount || 0) - (a.amount || 0);
    });

    if (filtered.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    }
    emptyState.classList.add('hidden');

    filtered.forEach(exp => {
      const icon = CATEGORY_ICONS[exp.category] || '📦';
      const card = document.createElement('div');
      card.className = 'expense-card glass-panel';

      // Payer description string
      let payerText = '';
      if (exp.payers && exp.payers.length > 1) {
        payerText = exp.payers.map(p => {
          const m = getMember(group, p.memberId);
          return `${m.name}: ${formatMoney(p.amount, currency)}`;
        }).join(', ');
      } else if (exp.payers && exp.payers.length === 1) {
        const m = getMember(group, exp.payers[0].memberId);
        payerText = `Paid by ${m.name}`;
      } else if (exp.payerId) {
        const m = getMember(group, exp.payerId);
        payerText = `Paid by ${m.name}`;
      }

      const splitCount = (exp.splits || []).length;

      card.innerHTML = `
        <div class="expense-left">
          <div class="expense-category-icon-box" title="${escapeHtml(exp.category)}">
            ${icon}
          </div>
          <div class="expense-info">
            <div class="expense-title-row">
              <span class="expense-title">${escapeHtml(exp.title)}</span>
              <span class="expense-badge-cat">${escapeHtml(exp.category)}</span>
            </div>
            <div class="expense-subtext">
              <span>${escapeHtml(payerText)}</span>
              <span>•</span>
              <span>${formatDisplayDate(exp.date)}</span>
              <span>•</span>
              <span>Split across ${splitCount} friends</span>
            </div>
            ${exp.notes ? `<div class="expense-notes-snippet">“${escapeHtml(exp.notes)}”</div>` : ''}
          </div>
        </div>

        <div class="expense-right">
          <div class="expense-amount-wrap">
            <span class="expense-amount-val">${formatMoney(exp.amount, currency)}</span>
            <span class="expense-split-tag">${currency}${(exp.amount / (splitCount || 1)).toFixed(2)} / friend</span>
          </div>

          <div class="expense-actions">
            <button class="btn-icon-action delete" title="Delete Bill" data-delete-id="${exp.id}">
              🗑️
            </button>
          </div>
        </div>
      `;

      card.querySelector('[data-delete-id]').onclick = () => deleteExpense(exp.id);
      listContainer.appendChild(card);
    });
  }

  function renderBalancesTab(group) {
    const currency = group.currency || '₹';
    const container = document.getElementById('members-balance-grid');
    const { net, paidTotal, shareTotal } = computeNetBalances(group);

    container.innerHTML = '';

    const transfers = calculateOptimalSettlements(group);

    // Sort members: Receivers (positive balance) AT FRONT, then Settled (0), then Payers (negative balance) AFTER
    const sortedMembers = [...group.members].sort((a, b) => {
      const balA = net[a.id] || 0;
      const balB = net[b.id] || 0;
      return balB - balA; // Descending: positive balances come first, then 0, then negatives
    });

    sortedMembers.forEach(member => {
      const balance = Math.round(net[member.id] * 100) / 100;
      const spent = paidTotal[member.id] || 0;
      const share = shareTotal[member.id] || 0;

      // Find debts this member owes to others
      const debtsOwed = transfers.filter(t => t.fromId === member.id);
      // Find credits others owe to this member
      const creditsReceivable = transfers.filter(t => t.toId === member.id);

      let statusClass = 'settled';
      let statusLabel = 'All Settled (₹0)';
      let roleBadge = '<span class="pill-badge pill-neutral">Settled</span>';
      let balanceDisplay = formatMoney(0, currency);

      if (balance > 0.01) {
        statusClass = 'owed';
        statusLabel = 'Receives Money (Owed)';
        roleBadge = '<span class="pill-badge pill-green">🟢 Receiver</span>';
        balanceDisplay = `+${formatMoney(balance, currency)}`;
      } else if (balance < -0.01) {
        statusClass = 'owes';
        statusLabel = 'Needs to Pay (Payer)';
        roleBadge = '<span class="pill-badge pill-rose">🔴 Payer</span>';
        balanceDisplay = `-${formatMoney(Math.abs(balance), currency)}`;
      }

      const card = document.createElement('div');
      card.className = 'member-card glass-panel';

      // Build dues breakdown text
      let duesHtml = '';
      if (debtsOwed.length > 0) {
        duesHtml = debtsOwed.map(d => `
          <div class="due-item owes">
            <span>Pays <strong>${escapeHtml(getMember(group, d.toId).name)}</strong></span>
            <span class="due-amt">${formatMoney(d.amount, currency)}</span>
          </div>
        `).join('');
      } else if (creditsReceivable.length > 0) {
        duesHtml = creditsReceivable.map(c => `
          <div class="due-item gets">
            <span>Receives from <strong>${escapeHtml(getMember(group, c.fromId).name)}</strong></span>
            <span class="due-amt">${formatMoney(c.amount, currency)}</span>
          </div>
        `).join('');
      } else {
        duesHtml = `
          <div class="due-item settled">
            <span>✨ All clear! No pending dues.</span>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="member-card-header">
          <div class="member-avatar-lg" style="background:${member.color}">
            ${member.name.charAt(0).toUpperCase()}
          </div>
          <div class="member-details">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span class="member-card-name">${escapeHtml(member.name)}</span>
              ${roleBadge}
            </div>
            ${member.upiId ? `<span class="member-upi-tag">UPI: ${escapeHtml(member.upiId)}</span>` : '<span style="font-size:0.75rem; color:var(--text-muted)">No UPI linked</span>'}
          </div>
        </div>

        <div class="member-stats-body">
          <div class="member-breakdown-row">
            <span>Total Fronted / Paid:</span>
            <span class="val">${formatMoney(spent, currency)}</span>
          </div>
          <div class="member-breakdown-row">
            <span>Fair Share:</span>
            <span class="val">${formatMoney(share, currency)}</span>
          </div>

          <div class="member-balance-highlight ${statusClass}">
            <span class="balance-status-badge">${statusLabel}</span>
            <span class="balance-amount-display">${balanceDisplay}</span>
          </div>

          <!-- Who this member owes or receives from -->
          <div class="member-dues-section">
            <span class="dues-section-title">Split for ${escapeHtml(member.name)}:</span>
            <div class="dues-list">
              ${duesHtml}
            </div>
            ${debtsOwed.length > 0 ? `
              <div class="due-actions-btn-row">
                <button class="glow-primary-btn btn-sm full-width" data-member-pay-btn="${member.id}">
                  💸 Clear Dues for ${escapeHtml(member.name)}
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      `;

      // Quick pay button handler if member owes money
      const payBtn = card.querySelector('[data-member-pay-btn]');
      if (payBtn && debtsOwed.length > 0) {
        payBtn.onclick = () => {
          openSettleModal(member.id, debtsOwed[0].toId, debtsOwed[0].amount);
        };
      }

      container.appendChild(card);
    });
  }

  function renderInsightsTab(group) {
    const currency = group.currency || '₹';
    const catContainer = document.getElementById('category-breakdown-list');
    const payerContainer = document.getElementById('payer-breakdown-list');
    const statsContainer = document.getElementById('project-insights-stats');

    catContainer.innerHTML = '';
    payerContainer.innerHTML = '';
    statsContainer.innerHTML = '';

    const totalSpent = group.expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // 1. Category Breakdown (Strictly sorted descending by spending amount)
    const catTotals = {};
    group.expenses.forEach(e => {
      const cat = e.category || 'Other';
      catTotals[cat] = (catTotals[cat] || 0) + (Number(e.amount) || 0);
    });

    // Only include categories with actual spend > 0 and sort descending
    const sortedCats = Object.entries(catTotals)
      .filter(([_, amt]) => amt > 0.001)
      .sort((a, b) => b[1] - a[1]);

    if (sortedCats.length === 0) {
      catContainer.innerHTML = '<div style="color:var(--text-muted); padding:1rem 0; text-align:center;">No spending logged yet.</div>';
    } else {
      sortedCats.forEach(([cat, amt], idx) => {
        const pct = totalSpent > 0 ? ((amt / totalSpent) * 100).toFixed(1) : '0.0';
        const icon = CATEGORY_ICONS[cat] || '📦';
        const color = CATEGORY_COLORS[cat] || 'var(--primary)';
        const rankClass = idx === 0 ? 'top-1' : idx === 1 ? 'top-2' : idx === 2 ? 'top-3' : '';

        const row = document.createElement('div');
        row.className = 'category-bar-row';
        row.innerHTML = `
          <div class="bar-meta">
            <div class="bar-meta-left">
              <span class="rank-badge ${rankClass}">#${idx + 1}</span>
              <span>${icon} ${escapeHtml(cat)}</span>
            </div>
            <div class="bar-meta-right">
              <strong>${formatMoney(amt, currency)}</strong>
              <small style="color:var(--text-muted)">(${pct}%)</small>
            </div>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${pct}%; background: ${color}"></div>
          </div>
        `;
        catContainer.appendChild(row);
      });
    }

    // 2. Payer Breakdown (Strictly sorted descending: Highest Contributor to Lowest Contributor)
    const { paidTotal } = computeNetBalances(group);
    const sortedPayers = [...group.members].sort((a, b) => {
      const amtA = paidTotal[a.id] || 0;
      const amtB = paidTotal[b.id] || 0;
      return amtB - amtA; // Highest contributor first!
    });

    sortedPayers.forEach((m, idx) => {
      const amt = paidTotal[m.id] || 0;
      const pct = totalSpent > 0 ? ((amt / totalSpent) * 100).toFixed(1) : '0.0';
      const rankClass = idx === 0 ? 'top-1' : idx === 1 ? 'top-2' : idx === 2 ? 'top-3' : '';

      const row = document.createElement('div');
      row.className = 'payer-bar-row';
      row.innerHTML = `
        <div class="bar-meta">
          <div class="bar-meta-left">
            <span class="rank-badge ${rankClass}">#${idx + 1}</span>
            <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${m.color}"></span>
            <span>${escapeHtml(m.name)}</span>
          </div>
          <div class="bar-meta-right">
            <strong>${formatMoney(amt, currency)}</strong>
            <small style="color:var(--text-muted)">(${pct}%)</small>
          </div>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width: ${pct}%; background: ${m.color}"></div>
        </div>
      `;
      payerContainer.appendChild(row);
    });

    // 3. Snapshot Summary Stats
    const topCategory = sortedCats[0] ? `${sortedCats[0][0]} (${formatMoney(sortedCats[0][1], currency)})` : 'None';
    const topSpenderObj = sortedPayers[0] && (paidTotal[sortedPayers[0].id] > 0) ? sortedPayers[0] : null;
    const topSpenderText = topSpenderObj ? `${topSpenderObj.name} (${formatMoney(paidTotal[topSpenderObj.id], currency)})` : 'None';
    const numMembers = group.members.length || 1;
    const avgPerPerson = totalSpent / numMembers;

    statsContainer.innerHTML = `
      <div class="summary-stat-box">
        <span class="card-subtitle">Top Category</span>
        <span class="summary-stat-val" style="font-size:1.15rem">${escapeHtml(topCategory)}</span>
      </div>
      <div class="summary-stat-box">
        <span class="card-subtitle">Highest Contributor</span>
        <span class="summary-stat-val" style="font-size:1.15rem">${escapeHtml(topSpenderText)}</span>
      </div>
      <div class="summary-stat-box">
        <span class="card-subtitle">Equal Fair Share / Person</span>
        <span class="summary-stat-val" style="font-size:1.15rem">${formatMoney(avgPerPerson, currency)}</span>
      </div>
    `;
  }

  function renderHistoryTab(group) {
    const currency = group.currency || '₹';
    const container = document.getElementById('settlement-history-list');
    const emptyState = document.getElementById('history-empty-state');

    container.innerHTML = '';

    if (!group.settlements || group.settlements.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    }
    emptyState.classList.add('hidden');

    const sorted = [...group.settlements].sort((a, b) => new Date(b.date) - new Date(a.date));

    sorted.forEach(stl => {
      const fromMember = getMember(group, stl.fromId);
      const toMember = getMember(group, stl.toId);

      const card = document.createElement('div');
      card.className = 'history-card glass-panel';

      card.innerHTML = `
        <div class="history-left">
          <div class="history-check-icon">✓</div>
          <div class="history-text">
            <span class="history-title">
              <strong style="color:${fromMember.color}">${escapeHtml(fromMember.name)}</strong>
              cleared with
              <strong style="color:${toMember.color}">${escapeHtml(toMember.name)}</strong>
            </span>
            <span class="history-sub">
              Via ${escapeHtml(stl.method || 'UPI')} • ${formatDisplayDate(stl.date)}
              ${stl.notes ? `• “${escapeHtml(stl.notes)}”` : ''}
            </span>
          </div>
        </div>

        <div class="history-right">
          <span class="history-amount">${formatMoney(stl.amount, currency)}</span>
          <button class="btn-icon-action delete" title="Delete record" data-delete-stl="${stl.id}">
            🗑️
          </button>
        </div>
      `;

      card.querySelector('[data-delete-stl]').onclick = () => deleteSettlement(stl.id);
      container.appendChild(card);
    });
  }

  // =========================================================================
  // ONBOARDING INITIAL STATE LOGIC
  // =========================================================================
  function renderOnboardingChips() {
    const container = document.getElementById('ob-members-chips');
    container.innerHTML = '';
    state.onboardingMembers.forEach((name, idx) => {
      const chip = document.createElement('span');
      chip.className = 'member-chip';
      chip.innerHTML = `
        <span>👤 ${escapeHtml(name)}</span>
        <button type="button" class="chip-remove-btn" data-ob-del="${idx}">✕</button>
      `;
      chip.querySelector('[data-ob-del]').onclick = () => {
        state.onboardingMembers.splice(idx, 1);
        renderOnboardingChips();
      };
      container.appendChild(chip);
    });
  }

  function handleOnboardingCreateGroup(e) {
    e.preventDefault();
    const name = document.getElementById('ob-group-name').value.trim();
    if (!name) {
      showToast('Please type a group name', 'error');
      return;
    }
    if (state.onboardingMembers.length < 2) {
      showToast('Please add at least 2 friends', 'error');
      return;
    }

    const members = state.onboardingMembers.map((mName, i) => ({
      id: `m_${Date.now()}_${i}`,
      name: mName,
      color: AVATAR_COLORS[i % AVATAR_COLORS.length],
      upiId: ''
    }));

    const newGroup = {
      id: `grp_${Date.now()}`,
      name,
      type: 'College Project',
      currency: '₹',
      desc: 'Shared project spending and splits',
      members,
      expenses: [],
      settlements: [],
      secretKey: generateSecretKey()
    };

    state.groups.push(newGroup);
    state.activeGroupId = newGroup.id;
    saveState();
    renderAll();
    showToast(`Created group "${name}"!`, 'success');
  }

  // =========================================================================
  // ADD EXPENSE (SINGLE PAYER VS MULTIPLE PEOPLE PAID!)
  // =========================================================================
  function openAddExpenseModal() {
    const group = getActiveGroup();
    if (!group) return;

    document.getElementById('modal-expense-title').textContent = 'Add Expense / Bill';
    document.getElementById('expense-id-input').value = '';
    document.getElementById('expense-desc').value = '';
    document.getElementById('expense-amount').value = '';
    document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('expense-notes').value = '';
    document.getElementById('expense-category').value = 'Hardware';
    document.getElementById('expense-currency-addon').textContent = group.currency || '₹';

    // Populate Single Payer dropdown
    const payerSelect = document.getElementById('expense-payer');
    payerSelect.innerHTML = '';
    group.members.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.name;
      payerSelect.appendChild(opt);
    });

    // Populate Multi-Payer Input rows
    renderMultiPayerInputs(group);

    // Populate Split checkboxes
    renderSplitMembersList(group);

    // Default to Single Payer mode
    setPayerMode('SINGLE');
    updateExpenseCalculations();

    openModal('modal-expense');
  }

  function setPayerMode(mode) {
    state.expensePayerMode = mode;
    const btnSingle = document.getElementById('btn-payer-mode-single');
    const btnMulti = document.getElementById('btn-payer-mode-multi');
    const singleSection = document.getElementById('payer-single-container');
    const multiSection = document.getElementById('payer-multi-container');

    if (mode === 'SINGLE') {
      btnSingle.classList.add('active');
      btnMulti.classList.remove('active');
      singleSection.classList.remove('hidden');
      multiSection.classList.add('hidden');
    } else {
      btnSingle.classList.remove('active');
      btnMulti.classList.add('active');
      singleSection.classList.add('hidden');
      multiSection.classList.remove('hidden');
    }
    updateExpenseCalculations();
  }

  function renderMultiPayerInputs(group) {
    const container = document.getElementById('multi-payer-inputs-list');
    container.innerHTML = '';
    const currency = group.currency || '₹';

    group.members.forEach(m => {
      const row = document.createElement('div');
      row.className = 'multi-payer-row';
      row.innerHTML = `
        <div class="multi-payer-left">
          <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${m.color}"></span>
          <span>${escapeHtml(m.name)}</span>
        </div>
        <div class="multi-payer-input-wrap">
          <span class="currency-addon">${currency}</span>
          <input type="number" step="0.01" min="0" placeholder="0" class="multi-payer-amount-input" data-payer-id="${m.id}">
        </div>
      `;

      row.querySelector('.multi-payer-amount-input').oninput = updateExpenseCalculations;
      container.appendChild(row);
    });
  }

  function renderSplitMembersList(group) {
    const container = document.getElementById('split-members-list');
    container.innerHTML = '';

    group.members.forEach(member => {
      const row = document.createElement('div');
      row.className = 'split-member-row';

      row.innerHTML = `
        <div class="split-member-left">
          <input type="checkbox" id="split-chk-${member.id}" data-member-id="${member.id}" class="split-member-chk" checked>
          <label for="split-chk-${member.id}" style="cursor:pointer; display:flex; align-items:center; gap:0.4rem;">
            <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${member.color}"></span>
            ${escapeHtml(member.name)}
          </label>
        </div>
      `;

      row.querySelector('.split-member-chk').onchange = updateExpenseCalculations;
      container.appendChild(row);
    });
  }

  function updateExpenseCalculations() {
    const group = getActiveGroup();
    if (!group) return;
    const currency = group.currency || '₹';

    let totalAmount = 0;

    if (state.expensePayerMode === 'SINGLE') {
      totalAmount = parseFloat(document.getElementById('expense-amount').value) || 0;
    } else {
      // Sum from multi-payer inputs
      const inputs = document.querySelectorAll('.multi-payer-amount-input');
      inputs.forEach(inp => {
        totalAmount += parseFloat(inp.value) || 0;
      });
      document.getElementById('multi-payer-total-display').textContent = formatMoney(totalAmount, currency);
    }

    const checkedBoxes = document.querySelectorAll('.split-member-chk:checked');
    const checkedCount = checkedBoxes.length;

    const perPerson = checkedCount > 0 ? (totalAmount / checkedCount).toFixed(2) : '0.00';
    document.getElementById('split-per-person-preview').textContent = `${currency}${perPerson}`;

    const valMsg = document.getElementById('split-validation-msg');
    if (checkedCount === 0) {
      valMsg.textContent = '⚠️ Select at least 1 friend';
      valMsg.className = 'split-validation invalid';
    } else if (totalAmount <= 0) {
      valMsg.textContent = 'Enter amounts above';
      valMsg.className = 'split-validation';
    } else {
      valMsg.textContent = `✓ Fair split (${formatMoney(perPerson, currency)} / person)`;
      valMsg.className = 'split-validation valid';
    }
  }

  function handleSaveExpense(e) {
    e.preventDefault();
    const group = getActiveGroup();
    if (!group) return;

    const title = document.getElementById('expense-desc').value.trim();
    const category = document.getElementById('expense-category').value;
    const date = document.getElementById('expense-date').value;
    const notes = document.getElementById('expense-notes').value.trim();

    if (!title || !date) {
      showToast('Please enter an expense title and date', 'error');
      return;
    }

    const checkedBoxes = Array.from(document.querySelectorAll('.split-member-chk:checked'));
    if (checkedBoxes.length === 0) {
      showToast('Please select at least one friend to split this with', 'error');
      return;
    }

    let payers = [];
    let totalAmount = 0;

    if (state.expensePayerMode === 'SINGLE') {
      const payerId = document.getElementById('expense-payer').value;
      totalAmount = parseFloat(document.getElementById('expense-amount').value);
      if (isNaN(totalAmount) || totalAmount <= 0) {
        showToast('Please enter a valid amount', 'error');
        return;
      }
      payers = [{ memberId: payerId, amount: totalAmount }];
    } else {
      // Multiple payers! (e.g. Me: 500, F1: 300, F2: 400)
      const inputs = document.querySelectorAll('.multi-payer-amount-input');
      inputs.forEach(inp => {
        const amt = parseFloat(inp.value) || 0;
        if (amt > 0) {
          payers.push({ memberId: inp.dataset.payerId, amount: amt });
          totalAmount += amt;
        }
      });

      if (payers.length === 0 || totalAmount <= 0) {
        showToast('Please enter what each person paid', 'error');
        return;
      }
    }

    // Splits calculation: Divide total equally among participating members
    const perPerson = Math.round((totalAmount / checkedBoxes.length) * 100) / 100;
    const splits = checkedBoxes.map(chk => ({
      memberId: chk.dataset.memberId,
      amount: perPerson
    }));

    const newExpense = {
      id: `exp_${Date.now()}`,
      title,
      amount: totalAmount,
      category,
      date,
      payers,
      splits,
      notes
    };

    group.expenses.unshift(newExpense);
    saveState();
    closeModal('modal-expense');
    renderAll();
    showToast(`Added "${title}" (${formatMoney(totalAmount, group.currency)})!`, 'success');
  }

  function deleteExpense(expId) {
    const group = getActiveGroup();
    if (!group) return;
    const exp = group.expenses.find(e => e.id === expId);
    if (!exp) return;

    if (confirm(`Delete "${exp.title}"?`)) {
      group.expenses = group.expenses.filter(e => e.id !== expId);
      saveState();
      renderAll();
      showToast(`Deleted "${exp.title}"`, 'info');
    }
  }

  // =========================================================================
  // SETTLE UP / CLEAR MONEY MODAL
  // =========================================================================
  function openSettleModal(defaultPayerId = null, defaultReceiverId = null, defaultAmount = null) {
    const group = getActiveGroup();
    if (!group) return;
    const currency = group.currency || '₹';

    const payerSelect = document.getElementById('settle-payer-select');
    const receiverSelect = document.getElementById('settle-receiver-select');

    payerSelect.innerHTML = '';
    receiverSelect.innerHTML = '';

    group.members.forEach(m => {
      const opt1 = document.createElement('option');
      opt1.value = m.id;
      opt1.textContent = m.name;
      payerSelect.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = m.id;
      opt2.textContent = m.name;
      receiverSelect.appendChild(opt2);
    });

    if (defaultPayerId) payerSelect.value = defaultPayerId;
    if (defaultReceiverId) {
      receiverSelect.value = defaultReceiverId;
    } else if (group.members.length > 1) {
      receiverSelect.value = group.members[1].id;
    }

    document.getElementById('settle-amount').value = defaultAmount ? defaultAmount : '';
    document.getElementById('settle-notes').value = '';
    document.getElementById('settle-currency-addon').textContent = currency;

    updateSettleVisual();
    openModal('modal-settle');
  }

  function updateSettleVisual() {
    const group = getActiveGroup();
    if (!group) return;
    const currency = group.currency || '₹';

    const payerId = document.getElementById('settle-payer-select').value;
    const receiverId = document.getElementById('settle-receiver-select').value;
    const amt = parseFloat(document.getElementById('settle-amount').value) || 0;

    const payer = getMember(group, payerId);
    const receiver = getMember(group, receiverId);

    document.getElementById('settle-payer-avatar').textContent = payer.name.charAt(0).toUpperCase();
    document.getElementById('settle-payer-avatar').style.background = payer.color;
    document.getElementById('settle-payer-name').textContent = payer.name;

    document.getElementById('settle-receiver-avatar').textContent = receiver.name.charAt(0).toUpperCase();
    document.getElementById('settle-receiver-avatar').style.background = receiver.color;
    document.getElementById('settle-receiver-name').textContent = receiver.name;

    document.getElementById('settle-preview-amount').textContent = formatMoney(amt, currency);
    document.getElementById('upi-intent-amount-span').textContent = amt.toFixed(2);

    // UPI quick link button inside modal
    const upiBox = document.getElementById('settle-upi-quick-box');
    const upiBtn = document.getElementById('btn-launch-upi-intent');

    if (receiver.upiId) {
      upiBox.classList.remove('hidden');
      upiBtn.href = `upi://pay?pa=${encodeURIComponent(receiver.upiId)}&pn=${encodeURIComponent(receiver.name)}&am=${amt}&cu=INR&tn=${encodeURIComponent(`Let'sSplit payment`)}`;
    } else {
      upiBox.classList.remove('hidden');
      upiBtn.href = `upi://pay?pn=${encodeURIComponent(receiver.name)}&am=${amt}&cu=INR&tn=${encodeURIComponent(`Let'sSplit payment`)}`;
    }
  }

  function handleConfirmSettlement(e) {
    e.preventDefault();
    const group = getActiveGroup();
    if (!group) return;

    const payerId = document.getElementById('settle-payer-select').value;
    const receiverId = document.getElementById('settle-receiver-select').value;
    const amount = parseFloat(document.getElementById('settle-amount').value);
    const method = document.getElementById('settle-method').value;
    const notes = document.getElementById('settle-notes').value.trim();

    if (payerId === receiverId) {
      showToast('Payer and receiver cannot be the same person', 'error');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid clearance amount', 'error');
      return;
    }

    const payer = getMember(group, payerId);
    const receiver = getMember(group, receiverId);

    const settlement = {
      id: `stl_${Date.now()}`,
      fromId: payerId,
      toId: receiverId,
      amount,
      date: new Date().toISOString().split('T')[0],
      method,
      notes
    };

    if (!group.settlements) group.settlements = [];
    group.settlements.unshift(settlement);

    saveState();
    closeModal('modal-settle');
    renderAll();

    // Celebration confetti!
    launchConfetti();
    showToast(`🎉 Cleared ${formatMoney(amount, group.currency)}: ${payer.name} ➔ ${receiver.name}!`, 'success');
  }

  function deleteSettlement(stlId) {
    const group = getActiveGroup();
    if (!group) return;
    if (confirm('Delete this payment record?')) {
      group.settlements = group.settlements.filter(s => s.id !== stlId);
      saveState();
      renderAll();
      showToast('Cleared payment record removed', 'info');
    }
  }

  // =========================================================================
  // GROUP CREATION MODAL
  // =========================================================================
  function openCreateGroupModal() {
    document.getElementById('group-name-input').value = '';
    document.getElementById('group-desc-input').value = '';
    document.getElementById('group-currency-select').value = '₹';
    state.newGroupMembers = ['Me', 'Friend 1', 'Friend 2'];
    renderNewGroupMembersChips();
    openModal('modal-group');
  }

  function renderNewGroupMembersChips() {
    const container = document.getElementById('modal-members-chip-list');
    container.innerHTML = '';
    state.newGroupMembers.forEach((name, idx) => {
      const chip = document.createElement('span');
      chip.className = 'member-chip';
      chip.innerHTML = `
        <span>👤 ${escapeHtml(name)}</span>
        <button type="button" class="chip-remove-btn" data-chip-idx="${idx}">✕</button>
      `;
      chip.querySelector('[data-chip-idx]').onclick = () => {
        state.newGroupMembers.splice(idx, 1);
        renderNewGroupMembersChips();
      };
      container.appendChild(chip);
    });
  }

  function handleSaveGroup(e) {
    e.preventDefault();
    const name = document.getElementById('group-name-input').value.trim();
    const type = document.getElementById('group-type-select').value;
    const currency = document.getElementById('group-currency-select').value;
    const desc = document.getElementById('group-desc-input').value.trim();

    if (!name) {
      showToast('Please enter a group name', 'error');
      return;
    }
    if (state.newGroupMembers.length < 2) {
      showToast('Please add at least 2 friends', 'error');
      return;
    }

    const members = state.newGroupMembers.map((mName, i) => ({
      id: `m_${Date.now()}_${i}`,
      name: mName,
      color: AVATAR_COLORS[i % AVATAR_COLORS.length],
      upiId: ''
    }));

    const newGroup = {
      id: `grp_${Date.now()}`,
      name,
      type,
      currency,
      desc,
      members,
      expenses: [],
      settlements: [],
      secretKey: generateSecretKey()
    };

    state.groups.unshift(newGroup);
    state.activeGroupId = newGroup.id;
    saveState();
    closeModal('modal-group');
    renderAll();
    showToast(`Created "${name}"!`, 'success');
  }

  // =========================================================================
  // DELETE GROUP
  // =========================================================================
  function deleteGroup(groupId) {
    const targetGroup = state.groups.find(g => g.id === groupId);
    if (!targetGroup) return;

    const confirmed = confirm(
      `🗑️ Delete Group: "${targetGroup.name}"?\n\n` +
      `This will permanently remove this group, all ${targetGroup.expenses.length} logged expenses, and settled payment history.\n\n` +
      `Do you want to permanently delete this group?`
    );

    if (!confirmed) return;

    state.groups = state.groups.filter(g => g.id !== groupId);

    if (state.groups.length > 0) {
      if (state.activeGroupId === groupId) {
        state.activeGroupId = state.groups[0].id;
      }
    } else {
      state.activeGroupId = null;
    }

    saveState();
    closeAllDropdowns();
    closeAllModals();
    renderAll();
    showToast(`🗑️ Group "${targetGroup.name}" deleted.`, 'info');
  }

  // =========================================================================
  // MANAGE MEMBERS & UPI IDs
  // =========================================================================
  function openManageMembersModal() {
    const group = getActiveGroup();
    if (!group) return;
    renderManageMembersList(group);
    openModal('modal-members');
  }

  function renderManageMembersList(group) {
    const container = document.getElementById('manage-members-list');
    container.innerHTML = '';

    group.members.forEach(member => {
      const row = document.createElement('div');
      row.className = 'manage-member-row';

      row.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <div style="width:38px; height:38px; border-radius:50%; background:${member.color}; color:white; display:flex; align-items:center; justify-content:center; font-weight:700">
            ${member.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style="font-weight:700">${escapeHtml(member.name)}</div>
            <div style="font-size:0.75rem; color:var(--accent-emerald)">
              ${member.upiId ? `UPI: ${escapeHtml(member.upiId)}` : '<span style="color:var(--text-muted)">No UPI linked</span>'}
            </div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <button class="btn-micro" data-edit-upi="${member.id}">✏️ Set UPI</button>
          ${group.members.length > 2 ? `
            <button class="btn-icon-action delete" title="Remove" data-remove-m="${member.id}">🗑️</button>
          ` : ''}
        </div>
      `;

      row.querySelector('[data-edit-upi]').onclick = () => {
        const newUpi = prompt(`Enter UPI ID for ${member.name} (e.g. mobile@paytm or name@okaxis):`, member.upiId || '');
        if (newUpi !== null) {
          member.upiId = newUpi.trim();
          saveState();
          renderManageMembersList(group);
          renderAll();
          showToast(`Updated UPI for ${member.name}`, 'success');
        }
      };

      const removeBtn = row.querySelector('[data-remove-m]');
      if (removeBtn) {
        removeBtn.onclick = () => {
          if (confirm(`Remove "${member.name}" from this group?`)) {
            group.members = group.members.filter(m => m.id !== member.id);
            saveState();
            renderManageMembersList(group);
            renderAll();
            showToast(`Removed "${member.name}"`, 'info');
          }
        };
      }

      container.appendChild(row);
    });
  }

  function handleAddMemberToActiveGroup() {
    const group = getActiveGroup();
    if (!group) return;

    const nameInp = document.getElementById('manage-new-member-name');
    const upiInp = document.getElementById('manage-new-member-upi');

    const name = nameInp.value.trim();
    const upiId = upiInp.value.trim();

    if (!name) {
      showToast('Please type a friend\'s name', 'error');
      return;
    }

    const newMember = {
      id: `m_${Date.now()}`,
      name,
      color: AVATAR_COLORS[group.members.length % AVATAR_COLORS.length],
      upiId
    };

    group.members.push(newMember);
    nameInp.value = '';
    upiInp.value = '';
    saveState();
    renderManageMembersList(group);
    renderAll();
    showToast(`Added "${name}"!`, 'success');
  }

  // =========================================================================
  // WHATSAPP SPLIT SHARING
  // =========================================================================
  function openShareModal() {
    const group = getActiveGroup();
    if (!group) return;

    const currency = group.currency || '₹';
    const totalSpent = group.expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const transfers = calculateOptimalSettlements(group);
    const avgPerPerson = totalSpent / (group.members.length || 1);

    let text = `⚡ *QuickSplit — Group Financial Summary: ${group.name}*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 *Total Group Spent:* ${formatMoney(totalSpent, currency)}\n`;
    text += `⚖️ *Per Person Share:* ${formatMoney(avgPerPerson, currency)}\n`;
    text += `📋 *Total Bills Logged:* ${group.expenses.length} expenses\n\n`;

    if (transfers.length === 0) {
      text += `🎉 *Status:* ALL DEBTS ARE FULLY RECONCILED! (Cleared)\nNobody owes anything right now.\n`;
    } else {
      text += `💸 *DIRECT SETTLEMENT (WHO PAYS WHOM):*\n`;
      transfers.forEach(t => {
        const p = getMember(group, t.fromId);
        const r = getMember(group, t.toId);
        text += `👉 *${p.name}* pays *${r.name}* ➔ *${formatMoney(t.amount, currency)}*`;
        if (r.upiId) {
          text += ` (UPI: ${r.upiId})`;
        }
        text += `\n`;
      });
      text += `\n⚡ Clear directly via Google Pay, PhonePe, Paytm, or Cash!\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🚀 Reconciled on QuickSplit — Precision Cost Allocation & Settlements`;

    document.getElementById('whatsapp-message-content').textContent = text;
    document.getElementById('btn-open-wa-web').href = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    openModal('modal-share');
  }

  function copyWhatsAppToClipboard() {
    const text = document.getElementById('whatsapp-message-content').textContent;
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied Split Summary! Paste it in your WhatsApp group.', 'success');
    }).catch(() => {
      showToast('Unable to copy automatically. Please select text manually.', 'error');
    });
  }

  // =========================================================================
  // GENERATE SECRET KEY
  // =========================================================================
  function generateSecretKey() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let key = 'QS-';
    for (let i = 0; i < 12; i++) {
      if (i === 4 || i === 8) key += '-';
      key += chars[Math.floor(Math.random() * chars.length)];
    }
    return key;
  }

  // =========================================================================
  // DYNAMIC UPI QR CODE GENERATOR
  // =========================================================================
  let _qrCurrentPayerId = null;
  let _qrCurrentReceiverId = null;
  let _qrCurrentAmount = 0;

  function openUpiQrModal(payerId, receiverId, amount) {
    const group = getActiveGroup();
    if (!group) return;

    _qrCurrentPayerId = payerId;
    _qrCurrentReceiverId = receiverId;
    _qrCurrentAmount = amount;

    const payer = getMember(group, payerId);
    const receiver = getMember(group, receiverId);
    const currency = group.currency || '₹';

    // Update modal header info
    document.getElementById('qr-payer-name').textContent = payer.name;
    document.getElementById('qr-receiver-name').textContent = receiver.name;
    document.getElementById('qr-amount-display').textContent = formatMoney(amount, currency);

    // Generate QR code
    generateUpiQrCode(receiver, amount);

    // Set deep-link button
    const intentBtn = document.getElementById('qr-open-intent-btn');
    const upiNote = encodeURIComponent(`QuickSplit payment from ${payer.name}`);
    if (receiver.upiId) {
      intentBtn.href = `upi://pay?pa=${encodeURIComponent(receiver.upiId)}&pn=${encodeURIComponent(receiver.name)}&am=${amount.toFixed(2)}&cu=INR&tn=${upiNote}`;
    } else {
      intentBtn.href = `upi://pay?pn=${encodeURIComponent(receiver.name)}&am=${amount.toFixed(2)}&cu=INR&tn=${upiNote}`;
    }

    // Mark as settled button
    document.getElementById('qr-mark-settled-btn').onclick = () => {
      closeModal('modal-upi-qr');
      openSettleModal(payerId, receiverId, amount);
    };

    openModal('modal-upi-qr');
  }

  // --- Universal Client-Side & Resilient QR Code Generator ---
  function renderQrCode(containerId, fallbackImgId, text, size) {
    const container = document.getElementById(containerId);
    const fallbackImg = fallbackImgId ? document.getElementById(fallbackImgId) : null;
    const qrSize = size || 210;

    if (container) {
      container.innerHTML = '';
      if (typeof QRCode !== 'undefined') {
        try {
          new QRCode(container, {
            text: text,
            width: qrSize,
            height: qrSize,
            colorDark: '#0a0f1d',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.L
          });

          // Ensure exactly one 1:1 square element (canvas or img) is visible to prevent dual horizontal warping
          setTimeout(() => {
            const canvas = container.querySelector('canvas');
            const img = container.querySelector('img');
            if (img && img.src && img.src.startsWith('data:image')) {
              img.style.display = 'block';
              img.style.width = `${qrSize}px`;
              img.style.height = `${qrSize}px`;
              img.style.aspectRatio = '1 / 1';
              if (canvas) canvas.style.display = 'none';
            } else if (canvas) {
              canvas.style.display = 'block';
              canvas.style.width = `${qrSize}px`;
              canvas.style.height = `${qrSize}px`;
              canvas.style.aspectRatio = '1 / 1';
              if (img) img.style.display = 'none';
            }
          }, 40);

          container.classList.remove('hidden');
          if (fallbackImg) fallbackImg.classList.add('hidden');
          return;
        } catch (err) {
          console.warn('QRCode JS rendering fallback:', err);
        }
      }
    }

    if (fallbackImg) {
      if (container) container.classList.add('hidden');
      fallbackImg.classList.remove('hidden');
      const encoded = encodeURIComponent(text);
      fallbackImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encoded}&bgcolor=ffffff&color=0a0f1d&margin=10&qzone=1`;
      fallbackImg.onerror = () => {
        fallbackImg.src = `https://quickchart.io/qr?text=${encoded}&size=${qrSize}&margin=2`;
      };
    }
  }

  function generateUpiQrCode(receiver, amount) {
    const qrContainer = document.getElementById('upi-qr-code-wrapper');
    const qrImg = document.getElementById('upi-qr-image');
    const qrPlaceholder = document.getElementById('upi-qr-placeholder');
    const inlineEditor = document.getElementById('qr-inline-upi-editor');

    if (!receiver.upiId) {
      // No UPI ID: show editor
      if (qrContainer) qrContainer.classList.add('hidden');
      if (qrImg) qrImg.classList.add('hidden');
      qrPlaceholder.classList.add('hidden');
      inlineEditor.classList.remove('hidden');
      document.getElementById('qr-inline-upi-input').value = '';
      return;
    }

    inlineEditor.classList.add('hidden');
    qrPlaceholder.classList.add('hidden');

    // Build the UPI payment string (NPCI standard)
    const upiString = `upi://pay?pa=${encodeURIComponent(receiver.upiId)}&pn=${encodeURIComponent(receiver.name)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent('QuickSplit Payment')}`;

    // Render client-side QR with fallback
    renderQrCode('upi-qr-code-wrapper', 'upi-qr-image', upiString, 210);
  }

  function handleSaveInlineUpi() {
    const group = getActiveGroup();
    if (!group || !_qrCurrentReceiverId) return;

    const newUpi = document.getElementById('qr-inline-upi-input').value.trim();
    if (!newUpi) {
      showToast('Please enter a valid UPI ID (e.g. name@paytm)', 'error');
      return;
    }

    const member = group.members.find(m => m.id === _qrCurrentReceiverId);
    if (member) {
      member.upiId = newUpi;
      saveState();
      generateUpiQrCode(member, _qrCurrentAmount);
      renderAll();
      showToast(`UPI ID saved for ${member.name}!`, 'success');
    }
  }

  // =========================================================================
  // PRIVATE GROUP SYNC — Encode group as URL, generate QR for teammates
  // =========================================================================
  function openGroupPrivacyModal() {
    const group = getActiveGroup();
    if (!group) return;

    // Ensure group has a secret key
    if (!group.secretKey) {
      group.secretKey = generateSecretKey();
      saveState();
    }

    // Populate info fields
    document.getElementById('privacy-group-name').textContent = group.name;
    document.getElementById('privacy-group-id').textContent = group.id.toUpperCase();
    document.getElementById('privacy-group-secret').textContent = group.secretKey;

    // Generate the private sync link (contains ultra-compact group data in URL hash)
    const syncLink = buildGroupSyncLink(group);

    // Generate Client-Side square QR for the sync link
    renderQrCode('privacy-sync-qr-container', 'privacy-sync-qr-img', syncLink, 210);

    // Wire up copy link button
    document.getElementById('btn-copy-private-link').onclick = () => {
      navigator.clipboard.writeText(syncLink).then(() => {
        showToast('🔗 Private team link copied! Share only with your group members.', 'success');
      }).catch(() => {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = syncLink;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('🔗 Link copied! Share with your group.', 'success');
      });
    };

    // Wire up encrypted backup button
    document.getElementById('btn-export-private-backup').onclick = () => exportEncryptedBackup(group);

    openModal('modal-group-privacy');
  }

  function buildGroupSyncLink(group) {
    // Encode the group as ultra-compact JSON in URL hash for fast mobile scanning
    try {
      const compact = {
        _v: 2,
        i: group.id,
        n: group.name,
        c: group.category || 'Other',
        u: group.currency || 'INR',
        d: group.description || '',
        k: group.secretKey || '',
        m: (group.members || []).map(m => [m.id, m.name, m.upiId || '']),
        e: (group.expenses || []).map(e => [
          e.id,
          e.description,
          Number(e.amount),
          e.paidBy,
          e.splitBetween || [],
          e.date || '',
          e.category || 'Other'
        ]),
        s: (group.settlements || []).map(s => [s.fromId, s.toId, Number(s.amount), s.date || ''])
      };

      const payload = btoa(unescape(encodeURIComponent(JSON.stringify(compact))));
      const baseUrl = window.location.href.split('#')[0];
      return `${baseUrl}#import=${payload}`;
    } catch (e) {
      console.error('buildGroupSyncLink error:', e);
      return window.location.href;
    }
  }

  function checkUrlImport() {
    // Check if URL contains an import payload (when teammate scans QR)
    try {
      const hash = window.location.hash;
      if (!hash.startsWith('#import=')) return;

      const payload = hash.substring('#import='.length);
      const rawData = JSON.parse(decodeURIComponent(escape(atob(payload))));

      let groupData = rawData;
      // Unpack compact format if _v === 2
      if (rawData.i && rawData.m) {
        groupData = {
          id: rawData.i,
          name: rawData.n,
          category: rawData.c || 'Other',
          currency: rawData.u || 'INR',
          description: rawData.d || 'Shared project spending and splits',
          secretKey: rawData.k || '',
          members: rawData.m.map((m, idx) => ({
            id: m[0],
            name: m[1],
            upiId: m[2] || '',
            color: AVATAR_COLORS[idx % AVATAR_COLORS.length]
          })),
          expenses: (rawData.e || []).map(e => ({
            id: e[0],
            description: e[1],
            amount: Number(e[2]) || 0,
            paidBy: e[3],
            splitBetween: e[4] || [],
            date: e[5] || new Date().toISOString().split('T')[0],
            category: e[6] || 'Other',
            splitType: 'EQUAL',
            createdAt: Date.now()
          })),
          settlements: (rawData.s || []).map(s => ({
            fromId: s[0],
            toId: s[1],
            amount: Number(s[2]) || 0,
            date: s[3] || new Date().toISOString().split('T')[0]
          }))
        };
      }

      if (!groupData || !groupData.id || !groupData.name) return;

      // Check if this group already exists locally
      const exists = state.groups.find(g => g.id === groupData.id);
      if (exists) {
        showToast(`Group "${groupData.name}" is already loaded!`, 'info');
        state.activeGroupId = exists.id;
        saveState();
        renderAll();
        // Clean URL
        history.replaceState(null, '', window.location.pathname);
        return;
      }

      // Ask user to confirm import
      const confirmed = confirm(
        `📲 Import Group: "${groupData.name}"?\n\n` +
        `Members: ${groupData.members.map(m => m.name).join(', ')}\n` +
        `Expenses logged: ${groupData.expenses.length}\n\n` +
        `This group was shared with you by a teammate. Import it to your QuickSplit?`
      );

      if (confirmed) {
        state.groups.unshift(groupData);
        state.activeGroupId = groupData.id;
        saveState();
        renderAll();
        showToast(`✅ Imported "${groupData.name}" successfully!`, 'success');
      }

      // Clean the hash from URL regardless
      history.replaceState(null, '', window.location.pathname);
    } catch (e) {
      console.warn('URL import parse error:', e);
      history.replaceState(null, '', window.location.pathname);
    }
  }

  function exportEncryptedBackup(group) {
    // Export group data as a downloadable JSON file
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      source: 'QuickSplit',
      group: group
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${group.name.replace(/\s+/g, '_')}_backup.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('💾 Group backup downloaded!', 'success');
  }

  // =========================================================================
  // EXPORT TO CSV
  // =========================================================================
  function exportToCSV() {
    const group = getActiveGroup();
    if (!group) return;
    const currency = group.currency || '₹';

    let csv = `Type,Date,Title / Description,Category,Paid By,Total Amount (${currency}),Notes\n`;

    group.expenses.forEach(e => {
      let payerInfo = '';
      if (e.payers) {
        payerInfo = e.payers.map(p => `${getMember(group, p.memberId).name}: ${p.amount}`).join('; ');
      } else if (e.payerId) {
        payerInfo = getMember(group, e.payerId).name;
      }
      csv += `"Expense","${e.date}","${e.title.replace(/"/g, '""')}","${e.category}","${payerInfo.replace(/"/g, '""')}",${e.amount},"${(e.notes || '').replace(/"/g, '""')}"\n`;
    });

    (group.settlements || []).forEach(s => {
      const from = getMember(group, s.fromId).name;
      const to = getMember(group, s.toId).name;
      csv += `"Settlement","${s.date}","${from} paid ${to}","${s.method}","${from}",${s.amount},"${(s.notes || '').replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${group.name.replace(/\s+/g, '_')}_split_summary.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Exported Split Summary to CSV!', 'success');
  }

  // =========================================================================
  // CONFETTI CANNON
  // =========================================================================
  function launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#6366F1', '#10B981', '#FF9933', '#EC4899', '#3B82F6', '#8B5CF6'];

    for (let i = 0; i < 90; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height * 0.45,
        vx: (Math.random() - 0.5) * 18,
        vy: (Math.random() - 0.8) * 16,
        size: Math.random() * 8 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rSpeed: (Math.random() - 0.5) * 10,
        gravity: 0.35,
        alpha: 1
      });
    }

    let frame = 0;
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.rSpeed;
        p.alpha -= 0.012;

        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.3);
          ctx.restore();
        }
      });

      if (alive && frame < 120) {
        frame++;
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    requestAnimationFrame(animate);
  }

  // =========================================================================
  // TOAST NOTIFICATIONS & MODAL HELPERS
  // =========================================================================
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️';

    toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  function closeAllDropdowns() {
    const menu = document.getElementById('group-dropdown-menu');
    if (menu) menu.classList.add('hidden');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // =========================================================================
  // EVENT LISTENERS INITIALIZATION
  // =========================================================================
  function initEvents() {
    // 1. Group Switcher Dropdown
    const switcherBtn = document.getElementById('group-switcher-btn');
    const switcherMenu = document.getElementById('group-dropdown-menu');
    switcherBtn.onclick = (e) => {
      e.stopPropagation();
      switcherMenu.classList.toggle('hidden');
    };
    document.addEventListener('click', closeAllDropdowns);
    switcherMenu.addEventListener('click', (e) => e.stopPropagation());

    // 2. Tab Navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetPane = document.getElementById(`tab-content-${btn.dataset.tab}`);
        if (targetPane) targetPane.classList.add('active');
      };
    });

    // 3. Currency Selector
    document.getElementById('currency-select').onchange = (e) => {
      const group = getActiveGroup();
      if (group) {
        group.currency = e.target.value;
        saveState();
        renderAll();
        showToast(`Currency set to ${e.target.value}`, 'info');
      }
    };

    // 4. Dark / Light Mode Toggle
    const themeBtn = document.getElementById('theme-toggle-btn');
    const themeIcon = document.getElementById('theme-icon');
    themeBtn.onclick = () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', state.theme);
      themeIcon.textContent = state.theme === 'dark' ? '🌙' : '☀️';
      saveState();
    };
    document.documentElement.setAttribute('data-theme', state.theme);
    themeIcon.textContent = state.theme === 'dark' ? '🌙' : '☀️';

    // 5. Onboarding Form (Zero-State Group Creation)
    document.getElementById('onboarding-quick-group-form').onsubmit = handleOnboardingCreateGroup;
    document.getElementById('ob-add-member-btn').onclick = () => {
      const input = document.getElementById('ob-member-input');
      const val = input.value.trim();
      if (val) {
        state.onboardingMembers.push(val);
        input.value = '';
        renderOnboardingChips();
      }
    };
    document.getElementById('ob-member-input').onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('ob-add-member-btn').click();
      }
    };

    // 6. Hero and Top Buttons
    document.getElementById('nav-add-expense-btn').onclick = openAddExpenseModal;
    document.getElementById('btn-add-expense-trigger').onclick = openAddExpenseModal;
    document.getElementById('hero-manage-members-btn').onclick = openManageMembersModal;
    document.getElementById('btn-add-member-direct').onclick = openManageMembersModal;
    document.getElementById('hero-new-group-btn').onclick = openCreateGroupModal;
    document.getElementById('nav-create-group-btn').onclick = () => {
      closeAllDropdowns();
      openCreateGroupModal();
    };

    // Delete Group Buttons
    const heroDeleteBtn = document.getElementById('hero-delete-group-btn');
    if (heroDeleteBtn) {
      heroDeleteBtn.onclick = () => {
        if (state.activeGroupId) deleteGroup(state.activeGroupId);
      };
    }
    const modalDeleteBtn = document.getElementById('btn-delete-current-group');
    if (modalDeleteBtn) {
      modalDeleteBtn.onclick = () => {
        if (state.activeGroupId) deleteGroup(state.activeGroupId);
      };
    }

    document.getElementById('hero-settle-up-btn').onclick = () => {
      // Scroll to settlement banner
      document.getElementById('settlement-highlight-banner').scrollIntoView({ behavior: 'smooth' });
    };

    // Privacy / Group Sync Modal
    document.getElementById('hero-privacy-btn').onclick = openGroupPrivacyModal;
    document.getElementById('close-modal-group-privacy').onclick = () => closeModal('modal-group-privacy');
    document.getElementById('close-modal-group-privacy-btn').onclick = () => closeModal('modal-group-privacy');

    // UPI QR Modal close
    document.getElementById('close-modal-upi-qr').onclick = () => closeModal('modal-upi-qr');

    // Inline UPI ID saver inside QR modal
    document.getElementById('btn-save-inline-upi').onclick = handleSaveInlineUpi;
    document.getElementById('qr-inline-upi-input').onkeydown = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); handleSaveInlineUpi(); }
    };

    // 7. Payer Mode Toggles in Add Expense
    document.getElementById('btn-payer-mode-single').onclick = () => setPayerMode('SINGLE');
    document.getElementById('btn-payer-mode-multi').onclick = () => setPayerMode('MULTI');
    document.getElementById('expense-amount').oninput = updateExpenseCalculations;

    // Select all / Clear split members
    document.getElementById('btn-select-all-members').onclick = () => {
      document.querySelectorAll('.split-member-chk').forEach(c => c.checked = true);
      updateExpenseCalculations();
    };
    document.getElementById('btn-clear-members').onclick = () => {
      document.querySelectorAll('.split-member-chk').forEach(c => c.checked = false);
      updateExpenseCalculations();
    };

    // 8. Expense Form Submit
    document.getElementById('form-expense').onsubmit = handleSaveExpense;

    // 9. Settle Form Submit & Inputs
    document.getElementById('form-settle').onsubmit = handleConfirmSettlement;
    document.getElementById('settle-payer-select').onchange = updateSettleVisual;
    document.getElementById('settle-receiver-select').onchange = updateSettleVisual;
    document.getElementById('settle-amount').oninput = updateSettleVisual;

    // 10. Group Form Submit & Member chips
    document.getElementById('form-group').onsubmit = handleSaveGroup;
    document.getElementById('btn-add-member-to-group-form').onclick = () => {
      const input = document.getElementById('new-member-name-input');
      const val = input.value.trim();
      if (val) {
        state.newGroupMembers.push(val);
        input.value = '';
        renderNewGroupMembersChips();
      }
    };
    document.getElementById('new-member-name-input').onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('btn-add-member-to-group-form').click();
      }
    };

    // 11. Manage Members Add
    document.getElementById('btn-manage-add-member').onclick = handleAddMemberToActiveGroup;
    document.getElementById('manage-new-member-name').onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddMemberToActiveGroup();
      }
    };

    // 12. Share & WhatsApp Modal
    document.getElementById('quick-share-btn').onclick = openShareModal;
    document.getElementById('banner-share-whatsapp-btn').onclick = openShareModal;
    document.getElementById('btn-copy-wa-text').onclick = copyWhatsAppToClipboard;
    document.getElementById('btn-export-csv').onclick = exportToCSV;

    // 15. Settlement banner: delegated UPI QR button clicks
    document.getElementById('banner-transfers-list').addEventListener('click', (e) => {
      const qrBtn = e.target.closest('[data-banner-qr-payer]');
      if (qrBtn) {
        e.stopPropagation();
        openUpiQrModal(qrBtn.dataset.bannerQrPayer, qrBtn.dataset.bannerQrReceiver, parseFloat(qrBtn.dataset.bannerQrAmt));
      }
    });

    // 13. Search & Filter
    const searchInput = document.getElementById('expense-search-input');
    const searchClear = document.getElementById('expense-search-clear');
    searchInput.oninput = () => {
      state.filters.search = searchInput.value.trim();
      searchClear.classList.toggle('hidden', !state.filters.search);
      const group = getActiveGroup();
      if (group) renderExpensesList(group);
    };
    searchClear.onclick = () => {
      searchInput.value = '';
      state.filters.search = '';
      searchClear.classList.add('hidden');
      const group = getActiveGroup();
      if (group) renderExpensesList(group);
    };

    document.getElementById('filter-category').onchange = (e) => {
      state.filters.category = e.target.value;
      const group = getActiveGroup();
      if (group) renderExpensesList(group);
    };

    // 14. Modal Close Handlers
    document.getElementById('close-modal-expense').onclick = () => closeModal('modal-expense');
    document.getElementById('cancel-modal-expense').onclick = () => closeModal('modal-expense');

    document.getElementById('close-modal-settle').onclick = () => closeModal('modal-settle');
    document.getElementById('cancel-modal-settle').onclick = () => closeModal('modal-settle');

    document.getElementById('close-modal-group').onclick = () => closeModal('modal-group');
    document.getElementById('cancel-modal-group').onclick = () => closeModal('modal-group');

    document.getElementById('close-modal-members').onclick = () => closeModal('modal-members');
    document.getElementById('close-manage-members-btn').onclick = () => closeModal('modal-members');

    document.getElementById('close-modal-share').onclick = () => closeModal('modal-share');
    document.getElementById('close-modal-share-btn').onclick = () => closeModal('modal-share');

    // Close on backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.onclick = (e) => {
        if (e.target === modal) closeModal(modal.id);
      };
    });

    // Expose helpers globally
    window.app = {
      openAddExpenseModal,
      openSettleModal,
      openShareModal,
      openUpiQrModal,
      openGroupPrivacyModal
    };
  }

  // --- Initialize on DOM Ready ---
  document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initEvents();
    renderAll();
    // Check if a teammate shared a group import link
    checkUrlImport();
  });

})();
