import { redirect } from 'next/navigation';

export default function Home() {
  // Automatically redirect from root to login (or dashboard during dev)
  redirect('/login');
}
