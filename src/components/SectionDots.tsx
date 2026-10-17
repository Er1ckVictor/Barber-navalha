'use client';

import type { Secao } from '@/types/barbearia';

interface Props {
  secoes: Secao[];
  active: number;
  onSelect: (index: number) => void;
}

export function SectionDots({ secoes, active, onSelect }: Props) {
  return (
    <nav className="dots" aria-label="Seções">
      {secoes.map((s, i) => (
        <button
          key={s.id}
          type="button"
          className={i === active ? 'on' : undefined}
          aria-label={`Ir para ${s.tipo === 'hero' ? s.rotulo : s.titulo}`}
          aria-current={i === active ? 'true' : undefined}
          onClick={() => onSelect(i)}
        />
      ))}
    </nav>
  );
}
