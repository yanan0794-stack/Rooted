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

export type PlantResult = {
  plant: string;
  description: string;
  imageSrc: string;
  filePath: string;
  careTasks: { id: string; text: string; done: boolean }[];
};
