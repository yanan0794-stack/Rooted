export type View = 'LOGIN' | 'HOME' | 'SCAN' | 'LIBRARY' | 'PROFILE';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  provider: 'google' | 'apple' | 'x' | 'link' | 'email';
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  completed: boolean;
}

export type BadgeIcon = 'trophy' | 'waves' | 'leaf' | 'lock' | 'sun' | 'flame' | 'scan' | 'scissors' | 'shield';

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: BadgeIcon;
  earned: boolean;
  type: 'featured' | 'standard' | 'locked';
  level: string;
  progress: number;
  goal: number;
  result: string;
}

export type CareTask = {
  id: string;
  title: string;
  detail: string;
  frequency: string;
  done: boolean;
};

export type TaskGroup = {
  category: string;
  tasks: CareTask[];
};

export type VideoGuideScene = {
  title: string;
  caption: string;
  detail: string;
  duration: number;
};

export type VideoGuide = {
  title: string;
  scenes: VideoGuideScene[];
};

export type PlantResult = {
  id: string;
  scannedAt: string;
  plant: string;
  scientificName: string;
  description: string;
  imageUrl: string;
  imageSrc: string;
  jsonPath: string;
  confidence: number;
  alternatives: string[];
  visualEvidence?: string[];
  diagnosticNotes?: string;
  quickFacts: {
    difficulty: string;
    light: string;
    water: string;
    humidity: string;
  };
  taskGroups: TaskGroup[];
  tips: string[];
  videoGuide: VideoGuide;
};
