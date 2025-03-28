# Turn Phases
## Phase 0 - Opening
- Display full screen modal
- Four options, large buttons that represent Generals
- only close modal when choice is made
- Choice represents initial unit choice, health, and fixed benefit

## Phase 1 - Powerups
- Reset countdown timer
- Reset ready indicator
- Reset / Recenter view
- Update resources
- Toggle fog of war on
- Only show units placed in round < currentRound
- Display powerup options window
- Hide window option available
- Show window option available
- Cannot move units until selection made
- Choose Powerup
- Spawn units
- Apply powerup
- Advance Phase
- Phase 2 - Planning
- Unit positioning enabled


## Phase 3 - Battle
- Disable fog of war
- Minimize UI
- Enable/Begin combat
- On unit death, check unit’s surviving on both teams
- If no unit’s surviving on one team
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



