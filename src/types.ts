export type View = 'LOGIN' | 'HOME' | 'SCAN';

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
