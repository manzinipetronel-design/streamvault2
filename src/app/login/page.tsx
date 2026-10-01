import { getPopularMovies } from '@/lib/services/tmdbService';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  const movies = await getPopularMovies();
  const posters = movies
    .filter((movie) => movie.img)
    .slice(0, 12)
    .map((movie) => ({ img: movie.img, alt: movie.alt }));

  return <LoginForm posters={posters} />;
}
