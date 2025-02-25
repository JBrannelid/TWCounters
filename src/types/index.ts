export type CounterType = 'hard' | 'soft' | 'risky';
export type BattleType = 'squad' | 'fleet';
export type RequirementType = 'mods' | 'datacron' | 'omicron';
export type Alignment = 'light' | 'dark';
export type Language = 'en' | 'sv';
export type UnitType = 'character' | 'ship';

// Cookie consent types
export interface CookieCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  enabled: boolean;
}

// Cookie consent types
export interface CookieConsent {
  necessary: boolean;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

// unit types
export interface BaseUnit {
  id: string;
  name: string;
  alignment: Alignment;
}

// unit types
export interface Character extends BaseUnit {
  role: string;
  isGalacticLegend?: boolean;
}

// ship types
export interface Ship extends BaseUnit {
  type: 'capital' | 'regular';
  isCapital: boolean;
  callOrder?: string;
}

// document types
export interface BaseDocument {
  lastFetchedBy?: string;
  updatedBy?: string;
  createdBy?: string;
  lastUpdated?: any;
  createdAt?: any;
}

// squad types
export interface Squad extends BaseUnit, BaseDocument {
  type: BattleType;
  alignment: Alignment;
  characters: Character[];
  leader: Character | null;
  description?: string;
  twOmicronRequired?: boolean;
  twOmicronComment?: string;
  modRequirements?: ModRequirement[];
}

// fleet types
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

// counter types
export interface CounterStrategy {
  key: string;
  description: string;
  priority?: number;
}

// counter types
export interface Requirement {
  type: RequirementType;
  description: string;
  priority: 'required' | 'recommended' | 'optional';
}

// counter types 
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

// filter types for counters
export interface Filters {
  battleType: BattleType | null;
  alignment: Alignment | null;
  showTWOmicronOnly: boolean;
  showHardCounters: boolean;
  excludeGL: boolean;
  searchTerm: string;
}

// filter types for counters
export type FilterKey = keyof Filters;

// mod requirement types for counters
export interface ModRequirement {
  character: string;
  stats: {
    primary?: string[];
    secondary?: string[];
  };
  sets?: string[];
  speed?: {
    min?: number;
    recommended?: number;
  };
}

// Language types (not in use atm)
export interface Settings {
  language: Language;
}

// response types for squads and fleets
export interface DefenseResponse {
  success: boolean;
  error?: string;
  data?: Squad | Fleet;
}

// Response types for counters
export interface CounterResponse {
  success: boolean;
  error?: string;
  data?: Counter;
}

// User settings types for language (not in use) and theme
export interface UserSettings {
  language: Language;
  theme: 'light' | 'dark';
  showGLWarning: boolean;
}

// User types for authentication
export interface AdminUser {
  uid: string;
  email: string;
  isAdmin: boolean;
  isMasterAdmin?: boolean;
  lastLogin?: string;
}

// User types for authentication 
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

// User types for crud operations
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

// User types for authentication
export type CounterInput = Omit<Counter, "id">;
