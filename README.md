# Fantastic Depths Combat Carousel

![Foundry VTT](https://img.shields.io/badge/Foundry_VTT-v14-brightgreen)
![System](https://img.shields.io/badge/System-Fantastic_Depths-orange)
![License](https://img.shields.io/badge/License-MIT-blue)

[English](#english) | [Italiano](#italiano)

<!-- <img src="img/combat-carousel-main.jpg" alt="Combat Carousel" width="80%"> -->

<a name="english"></a>
## English

A **Combat Carousel** module for Foundry VTT v14, designed specifically for the **Fantastic Depths** system (BECMI/Rules Cyclopedia rules). Replaces the default combat tracker with a visual, interactive horizontal carousel featuring multiple initiative modes, action declaration system, and automated round management.

### Compatibility
- **Foundry VTT**: v14.363+
- **System Requirements**: Fantastic Depths v1.0.13+
- **Module Version**: 1.1.0
- **Socket Support**: Yes (multi-client synchronization)

### Installation
#### Method 1: Manifest URL (Recommended)

1. Open Foundry VTT and go to **Add-on Modules**
2. Click **Install Module**
3. Enter this URL in the **Manifest URL** field:
   ```
   https://github.com/FR4NC35CO/fantastic-depths-combat-carousel/releases/latest/download/module.json
   ```
4. Click **Install**

#### Method 2: Manual

1. Download the `.zip` file from the [Releases](https://github.com/FR4NC35CO/fantastic-depths-combat-carousel/releases) section
2. Extract to the `Data/modules/` folder of Foundry VTT
3. Rename the folder to `fantastic-depths-combat-carousel`
4. Restart Foundry VTT

### Features

#### 🎴 Combat Carousel Display
- Horizontal scrolling carousel with combatant portraits
- Visual turn order with active combatant highlighting
- HP bars with customizable visibility (GM-only or shared with players)
- Portrait size adjustable via settings (80px - 150px)
- Defeated and hidden state indicators

#### ⚔️ Multiple Initiative Modes
The module supports 5 distinct initiative modes compatible with Fantastic Depths:

| Mode | Description |
|------|-------------|
| **simpleIndividual** | Basic individual initiative, no declared actions |
| **individual** | Individual initiative with slow weapon support |
| **individualChecklist** | Full individual initiative with action declaration required |
| **group** | Group-based initiative (one roll per side) |
| **advancedGroup** | Enhanced group mode with slow weapon and action phase ordering |

#### 🔄 Round Management Modes
Three round transition modes supporting different gameplay styles:

| Mode | Description |
|------|-------------|
| **Reset** | Clear all initiatives each round, re-declare actions |
| **Reroll** | Auto-roll new initiative after all actions declared |
| **Hold** | Keep previous initiative, only reset actions |

#### 📝 Action Declaration System
- Dropdown for selecting combat actions (attack, fire, throw, wrestle, etc.)
- Visual "Select..." indicator (yellow border) when action pending
- Action sync across all clients via socket
- Integration with Fantastic Depths slow weapon rules

#### 🎲 Automated Initiative Rolling
- **Auto-roll**: Automatically rolls initiative when all combatants have declared actions
- **Group mode**: Players roll once for all friendly combatants
- **Individual mode**: Each player rolls for their owned characters
- **GM Controls**: Roll NPCs, Roll All, Roll PCs buttons
- Dice So Nice integration for visual dice rolling

#### 🎯 Tie Detection & Resolution
- Automatic detection of tied initiative scores
- Visual orange "reroll" indicator on tied combatants
- Persistent tie tracking across multiple rerolls
- Decimals support for tie-breaking (e.g., 11.14 vs 11.23)

#### 🔊 Sound Effects
Context-aware sound playback (client-side only, non-GM):
- **Combat Start**: Horn sound when combat begins
- **New Round**: Distinct sound for round transitions
- **Your Turn**: Sound plays only for the player whose combatant is active

#### ⚙️ Module Settings
- **Portrait Size**: Adjust card size (80px - 150px)
- **HP Bar Visibility**: Show/hide HP bars
- **HP Bar to Players**: Allow players to see HP bars
- **Action Dropdown**: Show/hide declared action selector

### Usage

After installation and activation, the Combat Carousel automatically replaces the default combat tracker whenever a combat encounter begins.

#### Combat Controls (GM)
- **Start/End Combat**: Begin or conclude an encounter
- **Next/Previous Turn**: Navigate through the turn order
- **Next/Previous Round**: Manage round transitions
- **Roll NPCs**: Roll initiative for hostile tokens
- **Roll All**: Roll initiative for all combatants
- **Roll PCs**: Roll initiative for player characters (group mode)

#### Initiative Editing (GM)
Right-click on any initiative score to edit it manually. In group modes, editing one combatant's initiative updates all combatants sharing the same initiative value.

#### Action Selection (Players)
Players select their character's declared action from the dropdown on their card. The carousel tracks when all actions are chosen and triggers auto-roll in reroll mode.

### Multi-Client Synchronization
The module uses Foundry's socket system to ensure all clients see:
- Synchronized action selections (even for NPCs)
- Consistent pending/ready states
- Real-time turn order updates
- Tie reroll indicators

### Technical Features
- **15+ Tested Mode Combinations**: All initiative × round modes tested through 15+ rounds
- **Slow Weapon Support**: Automatic decimal adjustment for slow weapons
- **FaDe Integration**: Patches FaDe's roundReset to preserve carousel state
- **Permission Bypass**: Socket-based sync bypasses Foundry's observer limitations
- **Round Change Guards**: Prevents stale action updates during round transitions

### Requirements
- **Fantastic Depths v1.0.13** system installed and active
- **Game Master** role to access all GM features
- Players need **Observer** permission to see NPC actions (or use socket sync)

### Support
For bugs, suggestions, or support:
- Open an issue on [GitHub](https://github.com/FR4NC35CO/fantastic-depths-combat-carousel/issues)
- Discord: FR4NC35C0

### Credits
- **Author**: FR4NC35C0
- **System**: Fantastic Depths by Forelius
- **License**: MIT

### Changelog
#### v1.0.0
- Initial stable release
- Foundry V14.363 compatibility
- 5 initiative modes with full round mode support (simpleIndividual, individual, individualChecklist, group, advancedGroup)
- 3 round management modes (reset, reroll, hold)
- Action declaration system with dropdown selection
- Tie detection and reroll system with visual indicators
- Multi-client action synchronization via socket
- Group and individual rolling modes
- Compact initiative edit dialog with localization support (EN/IT)
- Audio feedback for combat events (combat start, new round, your turn)
- Multi-client synchronization stability improvements
- Removed debug console logging

#### v1.1.0
- Foundry VTT v14.364 verified compatibility
- Added compact, localized initiative chat messages (EN/IT)
- Fixed individual initiative chat messages not appearing
- Added optional confirmation dialog for individual initiative reroll
- Added combatant removal handling (empty carousel cleanup + XP prompt)
- Added "Enable console DEBUG" client setting for troubleshooting
- Fixed toggle-hidden synchronization with scene tokens
- Stabilized all 15 initiative/round mode combinations across multi-client tests

#### v0.9 (Pre-release)
- Beta testing versions 0.9.x
- Core carousel functionality
- Initial initiative modes implementation
- Socket communication foundation

---

<a name="italiano"></a>
## Italiano

Modulo **Combat Carousel** per Foundry VTT v14, progettato specificamente per il sistema **Fantastic Depths** (regole BECMI/Rules Cyclopedia). Sostituisce il tracker di combattimento predefinito con un carosello orizzontale visivo e interattivo, con supporto per multiple modalità di iniziativa, sistema di dichiarazione azioni e gestione automatizzata dei round.

### Compatibilità
- **Foundry VTT**: v14.363+
- **Requisiti Sistema**: Fantastic Depths v1.0.13+
- **Versione Modulo**: 1.1.0
- **Supporto Socket**: Sì (sincronizzazione multi-client)

### Installazione
#### Metodo 1: Manifest URL (Consigliato)

1. Apri Foundry VTT e vai nella sezione **Add-on Modules**
2. Clicca **Install Module**
3. Inserisci questo URL nel campo **Manifest URL**:
   ```
   https://github.com/FR4NC35CO/fantastic-depths-combat-carousel/releases/latest/download/module.json
   ```
4. Clicca **Install**

#### Metodo 2: Manuale

1. Scarica il file `.zip` dalla sezione [Releases](https://github.com/FR4NC35CO/fantastic-depths-combat-carousel/releases)
2. Estrai nella cartella `Data/modules/` di Foundry VTT
3. Rinomina la cartella in `fantastic-depths-combat-carousel`
4. Riavvia Foundry VTT

### Caratteristiche

#### 🎴 Visualizzazione Combat Carousel
- Carosello orizzontale scorrevole con le immagini dei combattenti
- Ordine di turno visivo con evidenziazione del combattente attivo
- Barre PF con visibilità personalizzabile (solo GM o condivise con giocatori)
- Dimensione immagini regolabile nelle impostazioni (80px - 150px)
- Indicatori di stato sconfitto e nascosto

#### ⚔️ Multiple Modalità di Iniziativa
Il modulo supporta 5 distinte modalità di iniziativa compatibili con Fantastic Depths:

| Modalità | Descrizione |
|----------|-------------|
| **simpleIndividual** | Iniziativa individuale base, senza azioni dichiarate |
| **individual** | Iniziativa individuale con supporto armi lente |
| **individualChecklist** | Iniziativa individuale completa con dichiarazione azioni richiesta |
| **group** | Iniziativa per gruppi (un tiro per lato) |
| **advancedGroup** | Modalità gruppo avanzata con armi lente e ordine per fase azione |

#### 🔄 Modalità di Gestione Round
Tre modalità di transizione round che supportano diversi stili di gioco:

| Modalità | Descrizione |
|----------|-------------|
| **Reset** | Azzera tutte le iniziative ogni round, ridichiara azioni |
| **Reroll** | Tira automaticamente nuova iniziativa dopo azioni dichiarate |
| **Hold** | Mantiene iniziativa precedente, azzera solo azioni |

#### 📝 Sistema di Dichiarazione Azioni
- Dropdown per selezionare azioni di combattimento (attacco, fuoco, lancio, lotta, ecc.)
- Indicatore visivo "Seleziona..." in giallo quando azione in attesa
- Sincronizzazione azioni su tutti i client via socket
- Integrazione con regole armi lente di Fantastic Depths

#### 🎲 Tiro Iniziativa Automatizzato
- **Auto-roll**: Tira automaticamente iniziativa quando tutti i combattenti hanno dichiarato azioni
- **Modalità gruppo**: I giocatori tirano una volta per tutti i combattenti amici
- **Modalità individuale**: Ogni giocatore tira per i personaggi posseduti
- **Controlli GM**: Tira NPC, Tira Tutti, Tira PG
- Integrazione Dice So Nice per i dadi 3D

#### 🎯 Rilevazione e Risoluzione Contese
- Rilevamento automatico di punteggi iniziativa uguali
- Indicatore arancione "ritira" su combattenti in contesa
- Tracciamento contese persistente attraverso multiple ritirate
- Supporto decimali per spareggio (es. 11.14 vs 11.23)

#### 🔊 Effetti Sonori
Riproduzione audio contestuale (solo lato client, non-GM):
- **Inizio Combattimento**: Suono tromba all'inizio del combattimento
- **Nuovo Round**: Suono distintivo per transizioni di round
- **Il Tuo Turno**: Suono solo per il giocatore il cui personaggio è attivo

#### ⚙️ Impostazioni Modulo
- **Dimensione Immagini**: Regola dimensione tessere (80px - 150px)
- **Visibilità Barre PF**: Mostra/nascondi barre PF
- **Barre PF ai Giocatori**: Permetti ai giocatori di vedere le barre PF
- **Dropdown Azioni**: Mostra/nascondi selettore azione dichiarata

### Utilizzo

Dopo installazione e attivazione, il Combat Carousel sostituisce automaticamente il tracker di combattimento predefinito quando inizia un incontro.

#### Controlli Combattimento (GM)
- **Inizia/Termina Combattimento**: Avvia o conclude un incontro
- **Turno Successivo/Precedente**: Naviga attraverso l'ordine di turno
- **Round Successivo/Precedente**: Gestisci transizioni di round
- **Tira NPC**: Tira iniziativa per token ostili
- **Tira Tutti**: Tira iniziativa per tutti i combattenti
- **Tira PG**: Tira iniziativa per personaggi giocatore (modalità gruppo)

#### Modifica Iniziativa (GM)
Tasto destro su qualsiasi punteggio di iniziativa per modificarlo manualmente. Nelle modalità gruppo, modificare l'iniziativa di un combattente aggiorna tutti i combattenti che condividono lo stesso valore.

#### Selezione Azioni (Giocatori)
I giocatori selezionano l'azione dichiarata del loro personaggio dal dropdown sulla tessera. Il carosello traccia quando tutte le azioni sono scelte e attiva l'auto-roll in modalità reroll.

### Sincronizzazione Multi-Client
Il modulo usa il sistema socket di Foundry per garantire che tutti i client vedano:
- Selezioni azioni sincronizzate (anche per PNG)
- Stati pending/pronti consistenti
- Aggiornamenti ordine di turno in tempo reale
- Indicatori ritiro contese

### Caratteristiche Tecniche
- **15+ Combinazioni Modalità Testate**: Tutte le combinazioni iniziativa × round testate per 15+ round
- **Supporto Armi Lente**: Aggiustamento automatico decimali per armi lente
- **Integrazione FaDe**: Patch FaDe roundReset per preservare stato carosello
- **Bypass Permessi**: Sync via socket aggira limitazioni osservatore Foundry
- **Guardie Cambio Round**: Previene aggiornamenti azioni stale durante transizioni round

### Requisiti
- Sistema **Fantastic Depths v1.0.13** installato e attivo
- Ruolo **Game Master** per accedere a tutte le funzionalità GM
- I giocatori necessitano permesso **Observer** per vedere azioni PNG (o usare socket sync)

### Supporto
Per bug, suggerimenti o supporto:
- Apri una issue su [GitHub](https://github.com/FR4NC35CO/fantastic-depths-combat-carousel/issues)
- Discord: FR4NC35C0

### Crediti
- **Autore**: FR4NC35C0
- **Sistema**: Fantastic Depths di Forelius
- **Licenza**: MIT

### Changelog
#### v1.0.0
- Rilascio stabile iniziale
- Compatibilità Foundry V14.363
- 5 modalità iniziativa con supporto completo modalità round (simpleIndividual, individual, individualChecklist, group, advancedGroup)
- 3 modalità gestione round (reset, reroll, hold)
- Sistema dichiarazione azioni con dropdown selezione
- Sistema rilevamento e ritiro contese con indicatori visivi
- Sincronizzazione azioni multi-client via socket
- Modalità tiro gruppo e individuale
- Dialog modifica iniziativa compatto con supporto localizzazione (EN/IT)
- Feedback audio per eventi di combattimento (inizio combat, nuovo round, il tuo turno)
- Miglioramenti stabilità sincronizzazione multi-client
- Rimosso logging console debug

#### v1.1.0
- Compatibilità verificata con Foundry VTT v14.364
- Aggiunti messaggi chat iniziativa compatti e localizzati (EN/IT)
- Fix: messaggi chat iniziativa individuale non comparivano
- Aggiunta conferma opzionale per ritiro iniziativa individuale
- Aggiunta gestione rimozione combattenti (pulizia carousel vuoto + popup PX)
- Aggiunto setting client "Abilita console DEBUG" per troubleshooting
- Fix: toggle-hidden sincronizza ora i token sulla scena
- Stabilizzate tutte le 15 combinazioni iniziativa/round mode su test multi-client

#### v0.9 (Pre-release)
- Versioni beta 0.9.x
- Funzionalità core del carosello
- Implementazione iniziale modalità iniziativa
- Fondamenta comunicazione socket

---

### AI Disclosure / Disclosure IA

This module was developed with AI coding assistance.
All code has been reviewed, understood, tested, and is fully maintained by the author.
This project complies with the [Foundry VTT AI Content Policy](https://foundryvtt.com/article/ai-policy/).

---

Questo modulo è stato sviluppato con assistenza AI nella codifica.
Tutto il codice è stato revisionato, compreso, testato ed è completamente mantenuto dall'autore.
Questo progetto è conforme alla [Foundry VTT AI Content Policy](https://foundryvtt.com/article/ai-policy/).
