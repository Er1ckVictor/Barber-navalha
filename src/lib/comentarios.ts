// Comentários dos clientes, salvos no localStorage como o resto da conta.
import type { Avaliacao } from '@/types/barbearia';
import { gravar, ler } from './storage';

export const CHAVE_COMENTARIOS = 'navalha:comentarios';

export interface Comentario extends Avaliacao {
  id: string;
  usuario: string;
  criadoEm: string;
}

export const comentariosSalvos = () => ler<Comentario[]>(CHAVE_COMENTARIOS, []);

export function salvarComentario(c: Omit<Comentario, 'id' | 'criadoEm' | 'data'>): Comentario {
  const agora = new Date();
  const novo: Comentario = {
    ...c,
    texto: c.texto.trim(),
    id: `cm_${agora.getTime().toString(36)}`,
    criadoEm: agora.toISOString(),
    data: `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`,
  };
  gravar(CHAVE_COMENTARIOS, [novo, ...comentariosSalvos()]);
  return novo;
}

export function apagarComentario(id: string, usuario: string) {
  gravar(CHAVE_COMENTARIOS, comentariosSalvos().filter((c) => !(c.id === id && c.usuario === usuario)));
}

export function apagarComentariosDoUsuario(usuario: string) {
  gravar(CHAVE_COMENTARIOS, comentariosSalvos().filter((c) => c.usuario !== usuario));
}
