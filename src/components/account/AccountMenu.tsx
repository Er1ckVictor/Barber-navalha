'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Usuario } from '@/types/barbearia';
import { statusDe } from '@/lib/booking';
import { useAgendamentos } from '@/hooks/useLocalData';

interface Props {
  usuario: Usuario;
  onSair: () => void;
}

export const iniciais = (nome: string) =>
  nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('');

export function AccountMenu({ usuario, onSair }: Props) {
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const ags = useAgendamentos(usuario.telefone);
  const ativos = ags.filter((a) => {
    const s = statusDe(a);
    return s === 'marcado' || s === 'confirmado';
  }).length;

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => !raiz.current?.contains(e.target as Node) && setAberto(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false);
    document.addEventListener('mousedown', fora);
    addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fora);
      removeEventListener('keydown', esc);
    };
  }, [aberto]);

  return (
    <div className="account-menu" ref={raiz}>
      <button
        type="button"
        className="account-btn"
        aria-haspopup="menu"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
      >
        <span className="avatar sm" aria-hidden="true">{iniciais(usuario.nome)}</span>
        <span className="account-label">{usuario.nome.split(' ')[0]}</span>
        <span className="caret" aria-hidden="true">▾</span>
      </button>

      {aberto && (
        <div className="dropdown" role="menu">
          <div className="dropdown-head">
            <strong>{usuario.nome}</strong>
            <span className="muted small">Conta de exemplo (dados locais)</span>
          </div>
          <Link role="menuitem" href="/conta/perfil" onClick={() => setAberto(false)}>
            Perfil
          </Link>
          <Link role="menuitem" href="/conta/agendamentos" onClick={() => setAberto(false)}>
            Agendamentos
            {ativos > 0 && <span className="pill">{ativos}</span>}
          </Link>
          <button
            role="menuitem"
            type="button"
            className="danger-item"
            onClick={() => {
              setAberto(false);
              onSair();
            }}
          >
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
