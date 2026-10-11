export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  isKids: boolean;
}

import { DEFAULT_PROFILE_AVATARS } from "@/lib/profileAvatars";

export const PRESET_PROFILES: UserProfile[] = [
  {
    id: "1",
    name: "Peter",
    avatar: DEFAULT_PROFILE_AVATARS[0],
    isKids: false,
  },
  {
    id: "2",
    name: "Guest",
    avatar: DEFAULT_PROFILE_AVATARS[1],
    isKids: false,
  },
  {
    id: "3",
    name: "Kids",
    avatar: DEFAULT_PROFILE_AVATARS[2],
    isKids: true,
  },
];
