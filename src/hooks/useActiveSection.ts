'use client';

import { useEffect, useState, type RefObject } from 'react';

/** Índice da seção visível (≥ 55% na tela). Só re-renderiza quando a seção muda. */
export function useActiveSection(containerRef: RefObject<HTMLElement | null>) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const sections = Array.from(container.querySelectorAll<HTMLElement>(':scope > section'));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(sections.indexOf(e.target as HTMLElement));
        }
      },
      { threshold: 0.55 },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [containerRef]);

  return active;
}
