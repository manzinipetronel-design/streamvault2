UPDATE public.viewer_profiles
SET avatar_url = CASE avatar_url
  WHEN 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    THEN '/assets/avatars/profile-1.png'
  WHEN 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    THEN '/assets/avatars/profile-2.png'
  WHEN 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150'
    THEN '/assets/avatars/profile-3.png'
  WHEN 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150'
    THEN '/assets/avatars/profile-4.png'
  WHEN 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'
    THEN '/assets/avatars/profile-5.png'
END
WHERE avatar_url IN (
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'
);
