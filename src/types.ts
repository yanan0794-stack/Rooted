export type View = 'LOGIN' | 'HOME' | 'SCAN' | 'PROFILE';

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

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  type: 'featured' | 'standard' | 'locked';
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

export type PlantResult = {
  id: string;
  scannedAt: string;
  plant: string;
  scientificName: string;
  description: string;
  imageUrl: string;
  imageSrc: string;
  jsonPath: string;
  quickFacts: {
    difficulty: string;
    light: string;
    water: string;
    humidity: string;
  };
  taskGroups: TaskGroup[];
  tips: string[];
};
