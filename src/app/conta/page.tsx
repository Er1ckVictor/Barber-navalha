'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// redirect() de servidor não existe no export estático
export default function Conta() {
  const router = useRouter();
  useEffect(() => router.replace('/conta/perfil'), [router]);
  return null;
}
