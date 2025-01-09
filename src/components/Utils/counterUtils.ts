// src/lib/counterUtils.ts

import { Character, Counter, Filters, Squad } from '@/types';

export function filterCounters(counters: Counter[], filters: Filters): Counter[] {
  return counters.filter(counter => {
    // Kontrollera Hard Counter-filter
    if (filters.showHardCounters && counter.counterType !== 'hard') {
      return false;
    }

    // GL-filtret
    if (filters.excludeGL) {
      if (counter.counterSquad.type === 'squad') {
        const squad = counter.counterSquad as Squad;

        // Kolla om ledaren är en GL
        if (squad.leader?.isGalacticLegend) {
          console.log(`Excluding counter due to GL leader: ${squad.leader.name}`);
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
  // Först hitta alla relevanta counters för enheten
  const relevantCounters = allCounters.filter(counter => {
    const isTargetUnit = counter.targetSquad.id === unitId;
    const isCounterUnit = counter.counterSquad.id === unitId;
    
    // Specialhantering för capital ships i fleet counters
    const isTargetCapitalShip = type === 'fleet' && 
      'capitalShip' in counter.targetSquad && 
      counter.targetSquad.capitalShip?.id === unitId;
    
    return isTargetUnit || isCounterUnit || isTargetCapitalShip;
  });

  // Applicera sedan filtreringen
  return filterCounters(relevantCounters, filters);
}