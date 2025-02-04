import { Character, Counter, Filters, Squad } from '@/types';

export function filterCounters(counters: Counter[], filters: Filters): Counter[] {
  return counters.filter(counter => {
    // check for hard counter filter
    if (filters.showHardCounters && counter.counterType !== 'hard') {
      return false;
    }

    // GL-filtret
    if (filters.excludeGL) {
      if (counter.counterSquad.type === 'squad') {
        const squad = counter.counterSquad as Squad;

        // Kolla om ledaren är en GL
        if (squad.leader?.isGalacticLegend) {
          //console.log(`Excluding counter due to GL leader: ${squad.leader.name}`);
          return false;
        }

        // Kolla om någon medlem är en GL
        const hasGLMember = squad.characters?.some(
          (member) => member?.isGalacticLegend
        );

        if (hasGLMember) {
          console.log(
            `Excluding counter due to GL member(s):`,
            squad.characters
              .filter((char) => char?.isGalacticLegend)
              .map((char) => char?.name)
          );
          return false;
        }
      }
    }

    return true; // Counter är giltig
  });
}

export function getCountersForUnit(
  allCounters: Counter[], 
  unitId: string, 
  type: 'squad' | 'fleet',
  filters: Filters
): Counter[] {
  // find all counters where either the target or counter squad is the unit
  const relevantCounters = allCounters.filter(counter => {
    if (!counter || !counter.targetSquad || !counter.counterSquad) {
      return false;
    }

    const isTargetUnit = counter.targetSquad.id === unitId;
    const isCounterUnit = counter.counterSquad.id === unitId;
    
    // special handling for capital ships
    const isTargetCapitalShip = type === 'fleet' && 
      'capitalShip' in counter.targetSquad && 
      counter.targetSquad.capitalShip?.id === unitId;
    
    return isTargetUnit || isCounterUnit || isTargetCapitalShip;
  });

  // apply filters to the relevant counters
  return filterCounters(relevantCounters, filters);
}