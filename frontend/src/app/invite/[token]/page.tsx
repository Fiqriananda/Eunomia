'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, Suspense } from 'react';

function RedirectContent() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  useEffect(() => {
    if (token) {
      router.replace(`/invitation/${token}`);
    }
  }, [token, router]);

  return null;
}

export default function InviteRedirectPage() {
  return (
    <Suspense fallback={null}>
      <RedirectContent />
    </Suspense>
  );
}
