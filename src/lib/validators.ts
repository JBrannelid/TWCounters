import { Squad, Fleet, Character, Ship } from '@/types';

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

    if (!squad.name?.trim()) {
      return { isValid: false, error: 'Squad name is required' };
    }

    if (!squad.leader) {
      console.log('Leader validation failed:', squad.leader);
      return { isValid: false, error: 'Squad must have a leader' };
    }

    if (!squad.characters?.length) {
      return { isValid: false, error: 'Squad must have at least one member' };
    }

    return { isValid: true, error: null };
  }
};

export const fleetValidators = {
  validateFleetStructure: (fleet: Fleet): boolean => {
    return Boolean(
      fleet.id &&
      fleet.name &&
      fleet.alignment &&
      Array.isArray(fleet.startingLineup)
    );
  },

  validateShips: (ships: Ship[]): boolean => {
    return ships.every(ship => 
      Boolean(ship.id && ship.name && ship.alignment)
    );
  }
}; 