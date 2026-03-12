import { getAllHeroes, getHeroRank } from '@/lib/api';
import DraftClient from './DraftClient';

export const metadata = {
  title: 'Simulasi Draft - MLBB Analytics',
  description: '',
};

export default async function DraftPage() {
  const [heroes, ranks] = await Promise.all([getAllHeroes(), getHeroRank()]);
  return <DraftClient heroes={heroes} ranks={ranks} />;
}
