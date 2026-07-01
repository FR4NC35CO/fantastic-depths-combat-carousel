const MODULE_ID = 'fantastic-depths-combat-carousel';

function _isDebug() {
  try { return game.settings.get(MODULE_ID, 'debugMode'); } catch(e) { return false; }
}
function _log(...args) { if (_isDebug()) console.log('%cFDCC:card |', 'color:#f8f; font-weight:bold', ...args); }

export class CombatantCard {

  constructor(combatant, { isActive = false, combat } = {}) {
    this.combatant = combatant;
    this.combat = combat;
    this.isActive = isActive;
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('combatant-card-wrapper');
    this.element = document.createElement('div');
    this.element.classList.add('combatant-card');
    this.element.setAttribute('data-combatant-id', combatant.id);
    this.element.setAttribute('data-token-id', combatant.token?.id ?? '');
    this.wrapper.appendChild(this.element);
    this._activateBaseListeners();
    this.refresh();
  }

  get actor() {
    return this.combatant?.actor;
  }

  get token() {
    return this.combatant?.token?.object;
  }

  get img() {
    return this.actor?.img ?? this.combatant.img ?? 'icons/svg/mystery-man.svg';
  }

  get name() {
    if (this.combatant.isOwner || game.user.isGM) return this.combatant.name;
    const tokenDoc = this.combatant.token;
    if (!tokenDoc) return '???';
    return [CONST.TOKEN_DISPLAY_MODES.HOVER, CONST.TOKEN_DISPLAY_MODES.ALWAYS].includes(tokenDoc.displayName)
      ? this.combatant.name : '???';
  }

  get initiative() {
    const init = this.combatant.initiative;
    if (init == null) return '—';
    // After a tie-reroll the value is decimal (e.g. 6.03).
    // Show the full value so the card visibly changes after the reroll.
    if (!Number.isInteger(init)) return init.toFixed(2);
    return init;
  }

  get hasDuplicateInitiative() {
    const init = this.combatant.initiative;
    if (init == null) return false;
    if (!this._isIndividualChecklistMode()) return false;
    // Only flag as duplicate if this combatant hasn't done a tie-reroll yet (integer initiative)
    // AND at least one other combatant shares the same integer base.
    if (!Number.isInteger(init)) return false;
    const base = Math.floor(init);
    return this.combat.combatants.filter(c => c.initiative != null && Math.floor(c.initiative) === base).length > 1;
  }

  get canRerollInitiative() {
    if (!this._isIndividualChecklistMode()) return false;
    if (this.combatant.initiative == null) return false;
    // Block tie rerolls if not all combatants have rolled initiative yet
    const carousel = ui.combatCarousel;
    if (carousel && !carousel._allInitiativeRolled()) return false;
    // _pendingTieRerolls is the single source of truth — do not use hasDuplicateInitiative
    // to gate the reroll button, as it may be stale on clients at the moment of refresh.
    const isPending = carousel?.isPendingTieReroll(this.combatant.id);
    if (!isPending) return false;
    if (game.user.isGM) return true;
    return this.isOwned;
  }

  get initiativeTooltip() {
    const total = this.combatant.initiative;
    if (total == null) return '';
    const actor = this.actor;
    if (!actor) return `${total}`;
    const dexMod = actor.system?.abilities?.dex?.mod ?? 0;
    const initMod = actor.system?.mod?.initiative ?? 0;
    const mod = dexMod + initMod;
    const base = Math.floor(total);
    const roll = base - mod;
    if (mod === 0) return `🎲 ${roll}`;
    const modParts = [];
    if (dexMod !== 0) modParts.push(`${dexMod > 0 ? '+' : ''}${dexMod} DEX`);
    if (initMod !== 0) modParts.push(`${initMod > 0 ? '+' : ''}${initMod} Init`);
    return `🎲 ${roll} ${modParts.join(' ')}`;
  }

  get isOwned() {
    return this.actor?.isOwner ?? false;
  }

  get isDefeated() {
    return this.combatant.isDefeated;
  }

  /**
   * Check if combatant is using a slow weapon.
   * Returns true only if:
   * - initiativeMode is 'advancedGroup', 'individualChecklist', or 'individual'
   * - declared action is 'attack', 'fire', or 'throw' (for advancedGroup/individualChecklist)
   *   OR any slow weapon is equipped (for individual mode without declared actions)
   * - equipped weapon has isSlow=true AND canMelee (for attack) or canRanged (for fire/throw)
   */
  get isSlow() {
    const carousel = ui.combatCarousel;
    if (!carousel) return false;
    const mode = carousel.initiativeMode;
    // For advancedGroup and individualChecklist: check declared action
    if (mode === 'advancedGroup' || mode === 'individualChecklist') {
      const action = this.actor?.system?.combat?.declaredAction;
      if (action !== 'attack' && action !== 'fire' && action !== 'throw') return false;
    }
    // For individual mode: no declared actions, check if any slow weapon is equipped
    else if (mode !== 'individual') {
      return false;
    }

    // Find equipped weapons with isSlow=true
    const items = this.actor?.items;
    if (!items) return false;

    const equippedSlowWeapons = items.filter(i =>
      i.type === 'weapon' &&
      i.system?.equipped === true &&
      i.system?.isSlow === true
    );

    if (equippedSlowWeapons.length === 0) return false;

    // For individual mode: any slow weapon equipped makes the combatant slow
    if (mode === 'individual') {
      return true;
    }

    // For advancedGroup and individualChecklist: check based on declared action type
    const action = this.actor?.system?.combat?.declaredAction;
    if (action === 'attack') {
      // For attack: need weapon with canMelee=true
      return equippedSlowWeapons.some(w => w.system?.canMelee === true);
    } else if (action === 'fire' || action === 'throw') {
      // For fire/throw: need weapon with canRanged=true
      return equippedSlowWeapons.some(w => w.system?.canRanged === true);
    }

    return false;
  }

  get isWaitingForRound() {
    return this.combatant.getFlag('fantastic-depths-combat-carousel', 'waitingForRound') === true;
  }

  get hpData() {
    if (!this.actor) return null;
    const hp = this.actor.system?.hp;
    if (!hp || hp.max == null) return null;
    const raw = Math.round((hp.value / hp.max) * 100);
    const pct = Math.min(Math.max(raw, 0), 100);
    let color = '#4caf50';
    if (pct <= 25) color = '#f44336';
    else if (pct <= 50) color = '#ff9800';
    else if (pct <= 75) color = '#ffc107';
    return { value: hp.value, max: hp.max, percent: pct, color };
  }

  get showHPBar() {
    if (game.user.isGM) return !!this.hpData;
    // Players see HP bars only if GM enabled the setting
    const showToPlayers = game.settings.get('fantastic-depths-combat-carousel', 'showHPBarToPlayers');
    if (!showToPlayers) return false;
    return !!this.hpData;
  }

  get showActionSelect() {
    // In simpleIndividual mode: no declared actions (simplified initiative)
    // Try multiple ways to detect the mode for robustness
    let initMode = null;
    
    // Method 1: via ui.combatCarousel (if available)
    if (ui.combatCarousel?.initiativeMode) {
      initMode = ui.combatCarousel.initiativeMode;
    }
    
    // Method 2: via game.settings directly
    if (!initMode && game.system?.id) {
      try {
        initMode = game.settings.get(game.system.id, 'initiativeMode');
      } catch (e) {
        // Setting not available
      }
    }
    
    // Check for simpleIndividual or individual (no declared actions)
    if (initMode === 'simpleIndividual' || initMode === 'individual') {
      return false;
    }
    
    // Check if declared actions are enabled in FaDe settings
    let declaredActions = true;
    if (game.system?.id) {
      try {
        declaredActions = game.settings.get(game.system.id, 'declaredActions');
      } catch (e) {
        declaredActions = true;
      }
    }
    if (declaredActions === false) return false;
    
    // Show action on all combatant cards for everyone
    return true;
  }

  get isPendingReset() {
    return ui.combatCarousel?._resetPendingIds?.has(this.combatant.id) ?? false;
  }

  get hasActionChosen() {
    if (this.isPendingReset) return false;
    if (this.combatant.getFlag('fantastic-depths-combat-carousel', 'choseNothing')) return true;
    const action = this.actor?.system?.combat?.declaredAction;
    return !!action && action !== 'nothing';
  }

  get isInitiativeRolled() {
    return this.combatant.initiative != null;
  }

  get canChangeAction() {
    if (game.user.isGM) return true;
    // Players can only change their own
    if (!this.isOwned) return false;
    // Lock action once combat has started (initiative rolled), unless re-selection is pending (e.g. hold mode)
    if (game.combat?.started && this.combatant.initiative != null && !this.isPendingReset) return false;
    return true;
  }

  get declaredAction() {
    // Check shadow state FIRST (for actions synced via socket on non-GM clients)
    // This takes priority over isPendingReset so that selected actions are visible
    const carousel = ui.combatCarousel;
    const shadowAction = carousel?._npcActions?.get(this.combatant.id);
    if (shadowAction !== undefined) return shadowAction;
    // If pending reset and no shadow action, show empty ("Seleziona...")
    if (this.isPendingReset) return '';
    const action = this.actor?.system?.combat?.declaredAction;
    if (this.combatant.getFlag('fantastic-depths-combat-carousel', 'choseNothing')) return 'nothing';
    if (!action) return '';
    // Return 'nothing' as-is so it gets properly translated to "Niente"
    return action;
  }

  get activeEffects() {
    if (!this.actor) return [];
    const effects = [];
    const seen = new Set();
    // Build a map: statusId -> effect that provides it (for icon/name lookup)
    const statusToEffect = new Map();
    for (const effect of this.actor.effects) {
      if (effect.disabled) continue;
      for (const s of (effect.statuses ?? [])) {
        statusToEffect.set(s, effect);
      }
    }
    // Also check item effects for statuses
    for (const item of this.actor.items) {
      for (const effect of (item.effects ?? [])) {
        if (effect.disabled) continue;
        for (const s of (effect.statuses ?? [])) {
          if (!statusToEffect.has(s)) statusToEffect.set(s, effect);
        }
      }
    }
    // Show one icon per status on the actor
    for (const statusId of (this.actor.statuses ?? [])) {
      if (statusId === CONFIG.specialStatusEffects.DEFEATED) continue;
      if (seen.has(statusId)) continue;
      seen.add(statusId);
      // Try CONFIG.statusEffects first (has dedicated icon per status)
      const statusDef = CONFIG.statusEffects.find(s => s.id === statusId);
      if (statusDef?.img) {
        effects.push({
          img: statusDef.img,
          name: statusDef.name ? game.i18n.localize(statusDef.name) : statusId,
        });
      } else {
        // Fallback: use the effect that provides this status
        const effect = statusToEffect.get(statusId);
        if (effect?.img) {
          effects.push({
            img: effect.img,
            name: effect.name ?? effect.label ?? statusId,
          });
        } else {
          // Last resort: search token/actor statuses for an icon via the token overlay
          const tokenEffects = this.combatant.token?.actorLink
            ? this.actor.effects : (this.combatant.token?.delta?.effects ?? []);
          let fallbackImg = 'icons/svg/aura.svg';
          for (const te of tokenEffects) {
            if (te.statuses?.has?.(statusId) || [...(te.statuses ?? [])].includes(statusId)) {
              fallbackImg = te.img ?? fallbackImg;
              break;
            }
          }
          effects.push({
            img: fallbackImg,
            name: statusId,
          });
        }
      }
    }
    // Also show non-status effects (effects without any statuses)
    for (const effect of this.actor.effects) {
      if (effect.disabled) continue;
      if (!effect.statuses?.size && effect.img) {
        effects.push({
          img: effect.img,
          name: effect.name ?? effect.label ?? '',
        });
      }
    }
    return effects;
  }

  get availableActions() {
    if (!this.actor) return [];
    let actions;
    if (typeof this.actor.getAvailableActions === 'function') {
      actions = this.actor.getAvailableActions();
    } else {
      actions = Object.keys(CONFIG.FADE?.CombatManeuvers ?? {});
    }
    return actions
      .filter(key => key !== 'nothing')
      .map(key => {
        const locKey = `FADE.combat.maneuvers.${key}.name`;
        const localized = game.i18n.localize(locKey);
        let label;
        if (localized !== locKey) {
          label = localized;
        } else {
          // Try module-level fallback translation
          const fallbackKey = `FDCC.Actions.${key}`;
          const fallback = game.i18n.localize(fallbackKey);
          label = fallback !== fallbackKey ? fallback : key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
        }
        return { value: key, label, selected: key === this.declaredAction };
      }).sort((a, b) => a.label.localeCompare(b.label));
  }

  refresh() {
    const cssClasses = ['combatant-card'];
    if (this.isActive) cssClasses.push('active');
    if (this.isDefeated) cssClasses.push('defeated');
    if (this.combatant.hidden) cssClasses.push('hidden-combatant');
    if (this.isWaitingForRound) cssClasses.push('waiting-for-round');
    this.element.className = cssClasses.join(' ');

    const hp = this.hpData;
    const showHP = this.showHPBar;
    const showAction = this.showActionSelect;

    let controlsHtml = '';
    if (game.user.isGM) {
      const hiddenIcon = this.combatant.hidden ? 'fa-eye-slash' : 'fa-eye';
      const defeatedIcon = this.isDefeated ? 'fa-skull' : 'fa-skull-crossbones';
      const defeatedActive = this.isDefeated ? 'control-active' : '';
      const hiddenActive = this.combatant.hidden ? 'control-active' : '';
      const isPendingGM = ui.combatCarousel?.isPendingTieReroll(this.combatant.id);
      const initDupClass = (this.hasDuplicateInitiative || isPendingGM) ? 'init-duplicate' : '';
      const initClickable = this.canRerollInitiative ? 'init-clickable' : '';
      const noInit = this.combatant.initiative == null;
      // In simpleIndividual/individual mode: no actions needed, show dice immediately
      const mode = game.settings.get(game.system.id, 'initiativeMode');
      const isSimpleMode = mode === 'simpleIndividual' || mode === 'individual';
      const showSpinDice = noInit && this._isIndividualChecklistMode() && (isSimpleMode || this.hasActionChosen);
      const initEditable = (this.combatant.initiative != null && !showSpinDice) ? 'init-editable' : '';
      const initContent = showSpinDice
        ? '<i class="fas fa-dice-d6 init-spin-dice"></i>'
        : `<span class="card-initiative ${initDupClass} ${initClickable} ${initEditable}" data-tooltip="${this.initiativeTooltip}">${this.initiative}</span>`;
      controlsHtml = `
      <div class="card-controls">
        ${initContent}
        <button type="button" class="card-control ${hiddenActive}" data-control="toggle-hidden" data-tooltip="${this.combatant.hidden ? 'Visible' : 'Hidden'}">
          <i class="fas ${hiddenIcon}"></i>
        </button>
        <button type="button" class="card-control ${defeatedActive}" data-control="toggle-defeated" data-tooltip="${this.isDefeated ? 'Alive' : 'Defeated'}">
          <i class="fas ${defeatedIcon}"></i>
        </button>
      </div>`;
    }

    let html = `
      <div class="card-portrait" style="background-image: url('${this.img}')">
        ${this.isDefeated ? '<div class="defeated-overlay"><i class="fas fa-skull"></i></div>' : ''}
        ${this.combatant.hidden ? '<div class="hidden-indicator"><i class="fas fa-eye-slash"></i></div>' : ''}
        ${this.isSlow ? '<div class="slow-indicator" data-tooltip="Lento / Slow"><img src="systems/fantastic-depths/assets/img/ui/snail.png" alt="Slow"></div>' : ''}
        ${this.isWaitingForRound ? '<div class="waiting-indicator" data-tooltip="In attesa del prossimo round / Waiting for next round"><i class="fas fa-hourglass-half"></i></div>' : ''}
      </div>
      ${this.isActive && (game.user.isGM || this.isOwned) ? (() => {
        const combat = game.combat;
        const carousel = ui.combatCarousel;
        const hasInitiative = !combat?.combatants.some(c => c.initiative == null);
        // In simpleIndividual/individual mode: no actions needed, always ready
        const mode = game.settings.get(game.system.id, 'initiativeMode');
        const isSimpleMode = mode === 'simpleIndividual' || mode === 'individual';
        // Check for pending action resets at round start
        const hasPendingResets = carousel?._resetPendingIds?.size > 0;
        const allActionsChosen = isSimpleMode ? true : (!hasPendingResets && !combat?.combatants.some(c => {
          if (!c.actor) return false;
          if (c.getFlag('fantastic-depths-combat-carousel', 'choseNothing')) return false;
          const act = c.actor.system?.combat?.declaredAction;
          return !act || act === 'nothing';
        }));
        const canAdvance = hasInitiative && allActionsChosen;
        if (canAdvance) return '<div class="active-indicator ready">»</div>';
        // In simpleIndividual/individual mode: show ready indicator to players too (no actions to wait for)
        if (isSimpleMode && this.isOwned && hasInitiative) return '<div class="active-indicator ready">»</div>';
        if (game.user.isGM) return '<div class="active-indicator waiting">װ</div>';
        return '';
      })() : ''}
      ${controlsHtml}
      <div class="card-info">
        <span class="card-name">${this.name}</span>
      </div>`;

    const effects = this.activeEffects;
    if (effects.length > 0) {
      const effectsHtml = effects.map(e =>
        `<img class="effect-icon" src="${e.img}" data-tooltip="${e.name}" width="16" height="16" />`
      ).join('');
      html += `<div class="card-effects">${effectsHtml}</div>`;
    }

    if (!game.user.isGM) {
      const isPendingPlayer = ui.combatCarousel?.isPendingTieReroll(this.combatant.id);
      const initDupClass = (this.hasDuplicateInitiative || isPendingPlayer) ? 'init-duplicate' : '';
      const initClickable = this.canRerollInitiative ? 'init-clickable' : '';
      html += `<div class="card-initiative-overlay"><span class="card-initiative ${initDupClass} ${initClickable}" data-tooltip="${this.initiativeTooltip}">${this.initiative}</span></div>`;
    }

    if (showAction) {
      const currentAction = this.declaredAction;
      const actionChosen = this.hasActionChosen;
      const placeholderLabel = game.i18n.localize('FDCC.SelectAction');
      const placeholderSelected = !currentAction ? 'selected' : '';
      const options = this.availableActions.map(a =>
        `<option value="${a.value}" ${a.selected ? 'selected' : ''}>${a.label}</option>`
      ).join('');
      // CSS state class: pending (yellow) or confirmed (green)
      const nothingLabel = game.i18n.localize('FDCC.Actions.nothing');
      const nothingSelected = currentAction === 'nothing' ? 'selected' : '';
      const stateClass = actionChosen ? 'action-confirmed' : 'action-pending';
      // For players: add blinking class when action not yet chosen
      const blinkClass = (!game.user.isGM && (!actionChosen || this.isPendingReset)) ? 'action-blink' : '';
      html += `
      <div class="card-action ${stateClass} ${blinkClass}">
        <select name="declaredAction" ${!this.canChangeAction ? 'disabled' : ''}>
          <option value="" disabled ${placeholderSelected}>${placeholderLabel}</option>
          <option value="nothing" ${nothingSelected}>${nothingLabel}</option>
          ${options}
        </select>
      </div>`;
    }

    if (showHP) {
      html += `
      <div class="card-hp-bar">
        <div class="hp-fill" style="width: ${hp.percent}%; background-color: ${hp.color};"></div>
      </div>`;
    }

    this.element.innerHTML = html;

    // Per-card initiative dice button for individualChecklist mode (player only, owned cards)
    // Rendered outside the card, as a sibling in the wrapper
    // NOTE: In 'reroll' mode from round 1+, initiative is auto-rolled when all actions are chosen
    // In round 0, always show dice for initial roll. In 'reset' mode, always show dice.
    const existingDice = this.wrapper.querySelector('.card-roll-init');
    if (existingDice) existingDice.remove();
    if (!game.user.isGM && this.isOwned && this._isIndividualChecklistMode()) {
      // Get round mode and current round
      let nextRound = 'reset';
      try { nextRound = game.settings.get(game.system.id, 'nextRound') ?? 'reset'; } catch(e) {}
      const isRoundZero = this.combatant.combat?.round === 0;
      // Auto-roll mode only applies from round 1+ in reroll mode
      const isAutoRollMode = nextRound === 'reroll' && !isRoundZero;

      // In simpleIndividual/individual mode: no declared actions needed, always consider "ready"
      const mode = game.settings.get(game.system.id, 'initiativeMode');
      const isSimpleMode = mode === 'simpleIndividual' || mode === 'individual';
      const hasAction = isSimpleMode ? true : this.hasActionChosen;
      const hasInit = this.combatant.initiative != null;
      const isPendingReroll = ui.combatCarousel?.isPendingTieReroll(this.combatant.id);
      const needsReroll = hasInit && (this.hasDuplicateInitiative || isPendingReroll);

      // Show dice if: needs tie reroll (always), or no initiative and not in auto-roll mode
      // Round 0: always show if no initiative (isRoundZero prevents auto-roll mode)
      // Round 1+ reroll: hide dice, will auto-roll when all actions chosen (only for individualChecklist)
      // Round 1+ reset: show dice (manual roll)
      // simpleIndividual/individual: always show dice (no actions to wait for)
      const showDice = needsReroll || (!hasInit && !isAutoRollMode) || (isSimpleMode && !hasInit);
      if (showDice) {
        const diceBtn = document.createElement('button');
        const isReady = needsReroll || hasAction || isSimpleMode;
        diceBtn.className = isReady ? 'card-roll-init init-ready' : 'card-roll-init init-disabled';
        diceBtn.setAttribute('data-tooltip', game.i18n.localize('FDCC.Controls.RollMyInit'));
        diceBtn.innerHTML = '<i class="fas fa-dice-d6"></i>';
        this.wrapper.appendChild(diceBtn);
        if (isReady) {
          diceBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (needsReroll) {
              this._onRerollInitiative();
            } else {
              this._onRollMyInitiative();
            }
          });
        }
      }
    }

    this._activateCardListeners();
  }

  _activateBaseListeners() {
    this.element.addEventListener('mouseenter', () => {
      if (this.token?.isVisible && !this.token.controlled) {
        this.token._onHoverIn(new MouseEvent('mouseenter'));
      }
    });

    this.element.addEventListener('mouseleave', () => {
      if (this.token?.hover) {
        this.token._onHoverOut(new MouseEvent('mouseleave'));
      }
    });
  }

  _activateCardListeners() {
    const portrait = this.element.querySelector('.card-portrait');
    if (portrait) {
      portrait.addEventListener('click', (e) => this._onPortraitClick(e));
      portrait.addEventListener('dblclick', (e) => this._onPortraitDblClick(e));
    }

    // Note: select change listener is handled via event delegation on the carousel container
    // to avoid stale listener issues during card refresh

    this.element.querySelectorAll('.card-control').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const control = e.currentTarget.dataset.control;
        this._onControlClick(control);
      });
    });

    const activeIndicator = this.element.querySelector('.active-indicator.ready');
    if (activeIndicator) {
      activeIndicator.addEventListener('click', (e) => {
        e.stopPropagation();
        if (ui.combatCarousel) ui.combatCarousel._nextTurn();
        else game.combat?.nextTurn();
      });
    }

    const initClickable = this.element.querySelector('.card-initiative.init-clickable');
    if (initClickable) {
      initClickable.addEventListener('click', (e) => {
        e.stopPropagation();
        this._onRerollInitiative();
      });
    }

    if (game.user.isGM) {
      const initSpan = this.element.querySelector('.card-initiative.init-editable');
      if (initSpan) {
        initSpan.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this._onEditInitiative();
        });
      }
    }

    const spinDice = this.element.querySelector('.init-spin-dice');
    if (spinDice) {
      spinDice.addEventListener('click', (e) => {
        e.stopPropagation();
        this._onRollGMInitiative();
      });
    }
  }

  _onPortraitClick(event) {
    event.preventDefault();
    const token = this.token;
    if (!token) return;
    if (!this.actor?.testUserPermission(game.user, 'OBSERVER')) return;
    token.control({ releaseOthers: true });
    canvas.animatePan(token.center);
  }

  _onPortraitDblClick(event) {
    event.preventDefault();
    if (!this.actor?.testUserPermission(game.user, 'OBSERVER')) return;
    this.actor.sheet.render(true);
  }

  async _onActionChange(event, target) {
    // target is passed from the delegated event handler
    if (!target) target = event.currentTarget;
    const newAction = target.value;
    const actor = this.actor;
    if (!actor) return;
    
    const currentAction = actor.system?.combat?.declaredAction;
    _log(`_onActionChange | ${this.combatant.name} | ${currentAction} → ${newAction} | user=${game.user.name}`);
    
    // Eagerly remove from _resetPendingIds so the UI updates immediately.
    // This also handles the Foundry no-op case where actor.update is skipped
    // because the new value equals the current DB value (e.g. re-selecting 'attack').
    const carousel = ui.combatCarousel;
    const hadPending = carousel?._resetPendingIds?.has(this.combatant.id);
    if (hadPending) {
      carousel._resetPendingIds.delete(this.combatant.id);
    }
    // Sync action change to ALL clients via socket (bypasses Foundry permission restrictions)
    // This ensures NPC actions selected by GM are visible to players even without Observer permission
    if (carousel?.combat) {
      const MODULE_ID = 'fantastic-depths-combat-carousel';
      game.socket.emit(`module.${MODULE_ID}`, {
        action: 'actionChanged',
        combatId: carousel.combat.id,
        combatantId: this.combatant.id,
        newAction: newAction,
        round: carousel.combat.round,
        userId: game.userId
      });
    }
    if (newAction === 'nothing') {
      await this.combatant.setFlag('fantastic-depths-combat-carousel', 'choseNothing', true);
    } else {
      if (this.combatant.getFlag('fantastic-depths-combat-carousel', 'choseNothing')) {
        await this.combatant.unsetFlag('fantastic-depths-combat-carousel', 'choseNothing');
      }
      await actor.update({ 'system.combat.declaredAction': newAction });
    }
    carousel?.refreshCards();
    carousel?._autoRollIfReady();
  }

  _isIndividualChecklistMode() {
    // Include individual, individualChecklist and simpleIndividual (they share the same roll behavior)
    const mode = game.settings.get(game.system.id, 'initiativeMode');
    return mode === 'individual' || mode === 'individualChecklist' || mode === 'simpleIndividual';
  }

  async _onRollGMInitiative() {
    if (!game.user.isGM) return;
    if (this.combatant.initiative != null) return;
    const actor = this.actor;
    const formula = game.settings.get(game.system.id, 'initiativeFormula') || '1d6';
    const rollData = actor?.getRollData() ?? {};
    const dexMod = actor?.system?.abilities?.dex?.mod ?? 0;
    const initMod = actor?.system?.mod?.initiative ?? 0;
    rollData.mod = dexMod + initMod;
    const roll = new Roll(formula, rollData);
    await roll.evaluate();
    if (game.dice3d) {
      await game.dice3d.showForRoll(roll, game.user, true);
    }
    // Slow weapon rule: slow combatants go last with score 0 + (roll/100)
    const finalInit = this.isSlow ? Math.round(roll.total / 100 * 100) / 100 : roll.total;
    _log(`_onRollGMInitiative | ${this.combatant.name} | roll=${roll.total} | slow=${this.isSlow} | final=${finalInit}`);
    await this.combatant.update({ initiative: finalInit });
    // Send chat message for individual GM roll
    if (ui.combatCarousel) {
      await ui.combatCarousel._sendInitiativeChatMessage(this.combatant.name, finalInit, 1);
    }
    // After any individual GM roll, check for ties
    setTimeout(() => ui.combatCarousel?.detectTies(), 150);
  }

  async _onRerollInitiative() {
    if (!this.canRerollInitiative) return;

    // In individualChecklist mode: block tie rerolls if not all initiatives are rolled yet
    const carousel = ui.combatCarousel;
    if (carousel?.initiativeMode === 'individualChecklist') {
      const allRolled = carousel.combat?.combatants.every(c => c.initiative != null);
      const hasPendingTies = carousel._pendingTieRerolls?.size > 0;
      if (!allRolled && hasPendingTies) {
        // Show warning on canvas
        ui.notifications.warn(game.i18n.localize('FDCC.TieRerollBlockedPendingInitiatives') || 'Tira tutte le iniziative prima di risolvere le contese!');
        return;
      }
    }
    const actor = this.actor;
    const formula = game.settings.get(game.system.id, 'initiativeFormula') || '1d6';
    const rollData = actor?.getRollData() ?? {};
    const dexMod = actor?.system?.abilities?.dex?.mod ?? 0;
    const initMod = actor?.system?.mod?.initiative ?? 0;
    rollData.mod = dexMod + initMod;
    const roll = new Roll(formula, rollData);
    await roll.evaluate();
    if (game.dice3d) {
      await game.dice3d.showForRoll(roll, game.user, true);
    }
    // Store result as base + (tieRoll / 100) so order within the tie is decided by this roll
    const base = Math.floor(this.combatant.initiative);
    const tieValue = Math.round((base + (roll.total / 100)) * 100) / 100;
    await this.combatant.update({ initiative: tieValue });
    // Mark AFTER update so clearTieRerolls is not emitted before all combatants have written their value
    ui.combatCarousel?.markTieRerolled(this.combatant.id);
  }

  async _onRollMyInitiative() {
    if (this.combatant.initiative != null) return;
    // CRITICAL FIX: Prevent multiple simultaneous rolls due to slow connections/impatient clicks
    if (this._isRolling) {
      console.log(`FDCC:card | _onRollMyInitiative | skipping - already rolling for ${this.combatant.name}`);
      return;
    }
    // In simpleIndividual or individual mode: no actions needed, allow roll immediately
    const mode = game.settings.get(game.system.id, 'initiativeMode');
    const isSimpleMode = mode === 'simpleIndividual' || mode === 'individual';
    if (!isSimpleMode && !this.hasActionChosen) return;
    
    // Set rolling flag to prevent multiple simultaneous rolls
    this._isRolling = true;
    
    try {
      // Roll manually to trigger Dice So Nice 3D animation
      const actor = this.actor;
      const formula = game.settings.get(game.system.id, 'initiativeFormula') || '1d6';
      const rollData = actor?.getRollData() ?? {};
      const dexMod = actor?.system?.abilities?.dex?.mod ?? 0;
      const initMod = actor?.system?.mod?.initiative ?? 0;
      rollData.mod = dexMod + initMod;
      const roll = new Roll(formula, rollData);
      await roll.evaluate();
      // Show 3D dice via Dice So Nice if available
      if (game.dice3d) {
        await game.dice3d.showForRoll(roll, game.user, true);
      }
      // Double-check initiative is still null before updating (race condition protection)
      if (this.combatant.initiative == null) {
        // Set the initiative value
        await this.combatant.update({ initiative: roll.total });
        // Send chat message for individual player roll
        if (ui.combatCarousel) {
          await ui.combatCarousel._sendInitiativeChatMessage(this.combatant.name, roll.total, 1);
        }
        console.log(`FDCC:card | _onRollMyInitiative | ${this.combatant.name} rolled ${roll.total}`);
      } else {
        console.log(`FDCC:card | _onRollMyInitiative | ${this.combatant.name} initiative already set, skipping update`);
      }
      // After individual player roll, GM-side hook will call detectTies via main.mjs updateCombatant
    } catch (error) {
      console.error(`FDCC:card | _onRollMyInitiative | error for ${this.combatant.name}:`, error);
    } finally {
      // Always clear the rolling flag
      this._isRolling = false;
    }
  }

  async _onEditInitiative() {
    if (!game.user.isGM) return;
    const current = this.combatant.initiative;
    if (current == null) return;

    const carousel = ui.combatCarousel;
    const mode = carousel?.initiativeMode;
    const isGroupMode = mode === 'group' || mode === 'advancedGroup';

    const result = await foundry.applications.api.DialogV2.prompt({
      window: { title: game.i18n.format('FDCC.EditInit.Title', { name: this.combatant.name }) },
      position: { width: 160 },
      content: `
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:4px 0;">
          <input type="number" id="fdcc-edit-init" name="fdcc-edit-init" value="${current}" step="0.01" min="0.01" max="99.99" style="width:80px;text-align:center;font-size:1.6em;" autofocus />
          ${isGroupMode ? `<span style="font-size:0.75em;color:#aaa;">${game.i18n.format('FDCC.EditInit.GroupHint', { value: current })}</span>` : ''}
        </div>`,
      ok: {
        icon: 'fas fa-check',
        label: game.i18n.localize('FDCC.EditInit.Confirm'),
        callback: (event, button) => {
          const val = button.form.querySelector('#fdcc-edit-init')?.value;
          if (val === undefined || val === '') return null;
          const parsed = parseFloat(val);
          if (isNaN(parsed)) return null;
          return Math.min(99.99, Math.max(0.01, Math.round(parsed * 100) / 100));
        }
      },
      rejectClose: false
    });
    const input = result;

    if (input == null || isNaN(input)) return;
    const newInit = input;

    if (isGroupMode) {
      // Propagate to all combatants that share the same initiative value
      const sameGroup = Array.from(carousel.combat.combatants).filter(c =>
        c.initiative === current
      );
      await Promise.all(sameGroup.map(c => c.update({ initiative: newInit })));
    } else {
      await this.combatant.update({ initiative: newInit });
    }

    carousel?.refreshCards();
  }

  async _onControlClick(control) {
    switch (control) {
      case 'toggle-hidden':
        const newHidden = !this.combatant.hidden;
        await this.combatant.update({ hidden: newHidden });
        const tokenDoc = this.combatant.token;
        if (tokenDoc) await tokenDoc.update({ hidden: newHidden });
        break;
      case 'toggle-defeated':
        const newDefeated = !this.isDefeated;
        await this.combatant.update({ defeated: newDefeated });
        // Apply/remove dead condition on the specific combatant's token only
        const token = this.combatant.token?.object;
        if (token && canvas.ready) {
          await token.actor?.toggleStatusEffect('dead', { active: newDefeated, overlay: true });
        }
        // Force refresh of this card to sync UI state
        this.refresh();
        break;
    }
  }
}
