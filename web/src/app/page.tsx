import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/session';
import { homeFor } from '@/lib/roles';

export default async function Home() {
  const s = await requireSession();
  redirect(homeFor(s.role));
}
