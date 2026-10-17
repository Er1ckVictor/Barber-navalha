'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { Agendamento, Usuario } from '@/types/barbearia';
import { CHAVES_AUTH, usuarioLogado } from '@/lib/auth';
import { CHAVE_AGENDAMENTOS, agendamentosSalvos } from '@/lib/booking';
import { assinar, lerBruto } from '@/lib/storage';
import { CHAVE_COMENTARIOS, comentariosSalvos, type Comentario } from '@/lib/comentarios';

// Lê do localStorage e re-renderiza quando muda. O snapshot é a string crua,
// assim o parse só roda de novo quando o valor realmente mudou.
function useLocal<T>(chaves: string[], calcular: () => T, vazio: T): T {
  const bruto = useSyncExternalStore(
    assinar,
    () => chaves.map((c) => lerBruto(c) ?? '').join('\u0000'),
    () => '', // no servidor não tem nada
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => (bruto ? calcular() : vazio), [bruto]);
}

export function useUsuario(): Usuario | null {
  return useLocal([CHAVES_AUTH.SESSAO, CHAVES_AUTH.USUARIOS], usuarioLogado, null);
}

export function useAgendamentos(telefone: string | null): Agendamento[] {
  const todos = useLocal([CHAVE_AGENDAMENTOS], agendamentosSalvos, [] as Agendamento[]);
  return telefone
    ? todos.filter((a) => a.usuario === telefone).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
    : [];
}

export function useComentarios(): Comentario[] {
  return useLocal([CHAVE_COMENTARIOS], comentariosSalvos, [] as Comentario[]);
}

export function useAgora(intervaloMs = 5000) {
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), intervaloMs);
    return () => clearInterval(id);
  }, [intervaloMs]);
  return agora;
}
