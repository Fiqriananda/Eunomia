'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InboxRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/?tab=inbox');
  }, [router]);
  return null;
}
