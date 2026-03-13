import { getHeroRank } from '@/lib/api';
import RankingsClient from './RankingsClient';

export const metadata = {
  title: 'Rankings - Draft Whisperer',
  description: 'Mobile Legends hero rankings.',
};

export default async function RankingsPage() {
  const ranks = await getHeroRank();
  return <RankingsClient initialRanks={ranks} />;
}
