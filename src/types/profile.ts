export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  isKids: boolean;
}

export const PRESET_PROFILES: UserProfile[] = [
  {
    id: '1',
    name: 'Peter',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    isKids: false,
  },
  {
    id: '2',
    name: 'Guest',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    isKids: false,
  },
  {
    id: '3',
    name: 'Kids',
    avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150',
    isKids: true,
  },
];
