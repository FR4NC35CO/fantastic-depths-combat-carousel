# Soluzione IF/THEN - Combat Carousel Synchronization

## Data: 2026-05-19
## Versione: v1.0-stable

---

## Il Problema

Quando il client (Player1) passava l'ultimo turno e il combat passava al round successivo, il GM vedeva le azioni del round precedente (verdi) invece di "Seleziona..." (gialle). Il client invece vedeva correttamente le azioni resettate.

---

## La Soluzione IF/THEN

### Logica Implementata

```javascript
// File: CombatCarousel.mjs
// Hook: updateCombat
// Linee: ~1055-1068

// CRITICAL FIX: When GM receives round change (triggered by client passing last turn),
// force immediate refresh with all combatants marked as pending so declaredActions show "Seleziona..." (yellow)
if (game.user.isGM && 
    this.initiativeMode === 'individualChecklist' && 
    (nextRound === 'reroll' || nextRound === 'reset' || nextRound === 'hold')) {
  
  // STEP 1: Popola _resetPendingIds con TUTTI i combatant
  this._resetPendingIds = new Set(Array.from(this.combat.combatants).map(c => c.id));
  console.log(`FDCC | updateCombat | GM populated _resetPendingIds (${this._resetPendingIds.size}) for immediate refresh`);
  
  // STEP 2: Refresh immediato - mostra "Seleziona..." (gialle)
  this.refreshCards();
  
  // STEP 3: Refresh differito - cattura aggiornamenti degli attori
  setTimeout(() => {
    this._roundChanging = false;
    console.log(`FDCC | updateCombat | GM deferred refresh after round change`);
    this.refreshCards();
  }, 500);
}
```

---

## Come Funziona

### Scenario: Client passa l'ultimo turno

1. **Client** (Player1) clicca "Passa Turno" sull'ultimo combatant
2. **Foundry** chiama `combat.nextRound()` → triggera `updateCombat` hook
3. **Hook** `updateCombat` viene eseguito su **TUTTI** i client (GM + Player)

### Flusso sul GM:

```
IF (round cambia && sono GM && mode === 'individualChecklist') THEN:
  
  1. _resetPendingIds = [tutti i combatant IDs]  
     → Questo forza la visualizzazione "Seleziona..." (gialla)
  
  2. refreshCards() immediato
     → Il carosello mostra immediatamente i bordi gialli
  
  3. setTimeout(500ms) → secondo refresh
     → Cattura eventuali aggiornamenti tardivi degli attori
```

### Flusso sul Client (Player1):

```
IF (round cambia && NON sono GM) THEN:
  
  1. _resetPendingIds = [tutti i combatant IDs]
  
  2. setTimeout(300ms) → refresh differito
     → Aspetta che il GM resetti le azioni
```

---

## Componenti Chiave

### 1. `_resetPendingIds` (Set)

Contiene gli ID dei combatant che devono ancora scegliere un'azione nel round corrente.

- Quando un combatant sceglie un'azione → rimosso dal Set
- Quando il round cambia → TUTTI i combatant vengono aggiunti al Set
- Il getter `isPendingReset` controlla se `this.combatant.id` è nel Set

### 2. `isPendingReset` (Getter in CombatantCard)

```javascript
get isPendingReset() {
  return carousel?._resetPendingIds?.has(this.combatant.id) ?? false;
}
```

Se `true` → mostra "Seleziona..." con bordo giallo.

### 3. `declaredAction` (Getter in CombatantCard)

```javascript
get declaredAction() {
  // Se è in attesa di reset → mostra vuoto ("Seleziona...")
  if (this.isPendingReset) return '';
  
  // Altrimenti → prendi l'azione dall'attore
  const action = this.actor?.system?.combat?.declaredAction;
  return action || '';
}
```

### 4. Sincronizzazione Socket

Quando un client sceglie un'azione:

```javascript
// Client emette socket
game.socket.emit(`module.${MODULE_ID}`, {
  action: 'actionChanged',
  combatId: carousel.combat.id,
  combatantId: this.combatant.id,
  newAction: newAction,
  round: carousel.combat.round,
  userId: game.userId
});
```

Il GM riceve il socket e aggiorna il carosello.

---

## Test Effettuati

- ✅ Round 1-30 senza errori
- ✅ Client passa ultimo turno → GM vede gialle
- ✅ GM passa ultimo turno → Client vede gialle  
- ✅ Tie-reroll funzionano correttamente
- ✅ Ordine iniziativa corretto dopo reroll
- ✅ Socket sincronizzazione stabile

---

## File Modificati

1. `CombatCarousel.mjs` - Hook `updateCombat` con logica IF/THEN
2. `CombatantCard.mjs` - Getter `declaredAction` e `isPendingReset`
3. `main.mjs` - Socket handlers per `actionChanged`

---

## Note per Futuri Sviluppi

Questa soluzione è **robusta** e **scalabile** perché:

1. **Non dipende dalla sincronizzazione di Foundry** - usa il nostro `_resetPendingIds`
2. **Funziona anche se gli attori non sono aggiornati** - il Set è la fonte della verità
3. **Gestisce race conditions** - il refresh immediato + differito copre tutti i casi
4. **Efficace per qualsiasi round mode** - reset, reroll, hold

**La chiave del successo:** Separare la logica di visualizzazione (UI) dalla logica dei dati (actor updates). Il carosello mostra ciò che `_resetPendingIds` dice, non ciò che l'attore ha memorizzato.
