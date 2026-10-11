export const PROFILE_AVATARS = [
  { id: "cinema", name: "Cinema", url: "/assets/avatars/profile-1.png" },
  { id: "director", name: "Director", url: "/assets/avatars/profile-2.png" },
  { id: "gamer", name: "Gamer", url: "/assets/avatars/profile-3.png" },
  {
    id: "adventurer",
    name: "Adventurer",
    url: "/assets/avatars/profile-4.png",
  },
  {
    id: "movie-buff",
    name: "Movie Buff",
    url: "/assets/avatars/profile-5.png",
  },
  { id: "star", name: "Star", url: "/assets/avatars/profile-6.png" },
  { id: "film-fan", name: "Film Fan", url: "/assets/avatars/profile-7.png" },
  { id: "chill", name: "Chill", url: "/assets/avatars/profile-8.png" },
  { id: "premiere", name: "Premiere", url: "/assets/avatars/profile-9.png" },
] as const;

export const DEFAULT_PROFILE_AVATARS = PROFILE_AVATARS.map(
  (avatar) => avatar.url,
);
