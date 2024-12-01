export type CounterType = 'hard' | 'soft' | 'risky';
export type BattleType = 'squad' | 'fleet';
export type RequirementType = 'mods' | 'datacron' | 'omicron';
export type Alignment = 'light' | 'dark';
export type Language = 'en' | 'sv';
export type UnitType = 'character' | 'ship';

export interface BaseUnit {
  id: string;
  name: string;
  alignment: Alignment;
}

export interface Character extends BaseUnit {
  role: string;
  isGalacticLegend?: boolean;
}

export interface Ship extends BaseUnit {
  type: 'capital' | 'regular';
  isCapital: boolean;
  callOrder?: string;
}

export interface BaseDocument {
  lastFetchedBy?: string;
  updatedBy?: string;
  createdBy?: string;
  lastUpdated?: any;
  createdAt?: any;
}

export interface Squad extends BaseUnit, BaseDocument {
  type: BattleType;
  alignment: Alignment;
  characters: Character[];
  leader: Character | null;
  description?: string;
  twOmicronRequired?: boolean;
}

export interface Fleet extends BaseDocument {
  id: string;
  type: 'fleet';
  name: string;
  alignment: Alignment;
  capitalShip: Ship | null;
  startingLineup: Ship[];
  reinforcements: Ship[];
  callOrder?: string;
  warnings?: string[];
  description?: string;
}

export interface CounterStrategy {
  key: string;
  description: string;
  priority?: number;
}

export interface Requirement {
  type: RequirementType;
  description: string;
  priority: 'required' | 'recommended' | 'optional';
}

export interface Counter extends BaseDocument {
  id: string;
  targetSquad: Squad | Fleet;
  counterSquad: Squad | Fleet;
  counterType: CounterType;
  description: string;
  strategy: CounterStrategy[];
  requirements: Requirement[];
  video_url?: string;
  images?: string[];
  twOmicronRequired?: boolean;
  twOmicronComment?: string; 
  datacronRequired?: {
    level: number;
    description: string;
  };
  recommended_speeds?: {
    character: string;
    minimum: number;
    preferred: number;
  }[];
  notes?: string[];
}

export interface Filters {
  battleType: BattleType | null;
  alignment: Alignment | null;
  showTWOmicronOnly: boolean;
  showHardCounters: boolean;
  excludeGL: boolean;
  searchTerm: string;
}

export type FilterKey = keyof Filters;

export interface ModRequirement {
  character: string;
  sets: string[];
  stats: {
    primary?: string[];
    secondary?: string[];
  };
  speed?: {
    min?: number;
    recommended?: number;
  };
}

export interface Settings {
  language: Language;
}

export interface DefenseResponse {
  success: boolean;
  error?: string;
  data?: Squad | Fleet;
}

export interface CounterResponse {
  success: boolean;
  error?: string;
  data?: Counter;
}

export interface UserSettings {
  language: Language;
  theme: 'light' | 'dark';
  showGLWarning: boolean;
}

export interface AdminUser {
  uid: string;
  email: string;
  isAdmin: boolean;
  isMasterAdmin?: boolean;
  lastLogin?: string;
}

export interface ChangeRecord {
  id: string;
  timestamp: string;
  entityId: string;
  entityType: 'squad' | 'fleet' | 'counter';
  changeType: 'create' | 'update' | 'delete';
  userId: string;
  changes: Record<string, {
    old?: any;
    new: any;
  }>;
}

export interface ChangeHistory {
  id: string;
  changeType: 'create' | 'update' | 'delete';
  entityType: string;
  timestamp: string;
  changes: {
    old: any;
    new: any;
  };
}