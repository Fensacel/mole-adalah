import { getHeroRank } from '@/lib/api';
import RankingsClient from './RankingsClient';

export const metadata = {
  title: 'Rankings - MLBB Analytics',
  description: 'Ranking hero Mobile Legends.',
};

export default async function RankingsPage() {
  const ranks = await getHeroRank();
  return <RankingsClient initialRanks={ranks} />;
}
