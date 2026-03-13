import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Draft Simulator - Draft Whisperer',
  description: '',
};

export default async function DraftPage() {
  redirect('/draftsimulator');
}
