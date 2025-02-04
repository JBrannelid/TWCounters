import { Squad, Fleet, Character, Ship } from '@/types';

// Validators for squads and fleets to ensure they have the correct structure
export const squadValidators = {
  validateSquadStructure: (squad: Squad): boolean => {
    return Boolean(
      squad.id &&
      squad.name &&
      squad.alignment &&
      Array.isArray(squad.characters)
    );
  },

  validateCharacters: (characters: Character[]): boolean => {
    return characters.every(char => 
      Boolean(char.id && char.name && char.alignment)
    );
  },

  validateLeader: (leader: Character | null): boolean => {
    if (!leader) return true;
    return Boolean(leader.id && leader.name && leader.alignment);
  },

  validateCompleteSquad: (squad: Squad): { isValid: boolean; error: string | null } => {
    console.log('Validating squad:', {
      name: squad.name,
      hasLeader: Boolean(squad.leader),
      leader: squad.leader,
      membersCount: squad.characters?.length,
      members: squad.characters
    });

    // Check if the squad has a name
    if (!squad.name?.trim()) {
      return { isValid: false, error: 'Squad name is required' };
    }

    // Check if the squad has a leader
    if (!squad.leader) {
      console.log('Leader validation failed:', squad.leader);
      return { isValid: false, error: 'Squad must have a leader' };
    }

    // Check if the squad has members
    if (!squad.characters?.length) {
      return { isValid: false, error: 'Squad must have at least one member' };
    }

    return { isValid: true, error: null }; // Squad is valid
  }
};

// Validators for fleets to ensure they have the correct structure and ships are valid 
export const fleetValidators = {
  // Validate the structure of a fleet
  validateFleetStructure: (fleet: Fleet): boolean => {
    return Boolean(
      fleet.id &&
      fleet.name &&
      fleet.alignment &&
      Array.isArray(fleet.startingLineup)
    );
  },

  // Validate the ships in a fleet  
  validateShips: (ships: Ship[]): boolean => {
    return ships.every(ship => // Check if every ship has an id, name, and alignment
      Boolean(ship.id && ship.name && ship.alignment)
    );
  }
}; 