# Turn Phases
## Phase 0 - Opening
- Display full screen modal
- Four options, large buttons that represent Generals
- only close modal when choice is made
- Choice represents initial unit choice, health, and fixed benefit

## Phase 1 - Powerups
- Reset countdown timer
- Reset ready indicator
- Reset / Recenter view (focus on current player's deployment zone)
- Update resources (default amount + 200 gold per round)
- Toggle fog of war on
- Unit visibility rules:
  - Current round units: invisible to opponent
  - Previous round units: visible to all
- Display powerup options window (modal, not full screen)
  - Four powerup choices
  - "Hide Powerup Menu" button available
  - When hidden, "Show Powerup Menu" button appears at top of screen
  - Window is not draggable
  - Window is destroyed after selection
- Cannot move units until selection made
- Choose Powerup
- Spawn units
- Apply powerup
- Advance Phase

## Phase 2 - Planning
- Unit positioning enabled


## Phase 3 - Battle
- Disable fog of war
- Minimize UI
- Enable/Begin combat
- On unit death, check unit's surviving on both teams
- If no unit's surviving on one team
  - Do damage
  - Assess survival
    - If losing player has health remaining
      - Reset to phase 1
    - If losing player health <= 0
      - End battle

#Phase 4 - RESOLUTION
- Display battle summary screen
- Winner / loser
- Round statistics ?
- MMR +/-?
- Rewards?
- Option to view battle field
Reset battlefield state to last configuration
- Exit button
- Exit back to main menu 



