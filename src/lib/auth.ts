// Login fake, só pra demonstração. Fica tudo no localStorage e não tem segurança
// nenhuma. Num projeto real isso precisa ir pra um backend de autenticação.
import type { Usuario } from '@/types/barbearia';
import { gravar, ler } from './storage';
import { CHAVE_AGENDAMENTOS, agendamentosSalvos } from './booking';
import { apagarComentariosDoUsuario } from './comentarios';

const USUARIOS = 'navalha:usuarios';
const SESSAO = 'navalha:sessao';

export const soDigitos = (s: string) => s.replace(/\D/g, '').slice(0, 11);

// formata (11) 98765-4321 enquanto digita
export function mascaraTelefone(valor: string) {
  const d = soDigitos(valor);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export const telefoneValido = (digitos: string) => digitos.length === 10 || digitos.length === 11;

// FNV-1a. Não é criptografia, só evita guardar a senha em texto puro.
function hashSimples(texto: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}
const hashSenha = (telefone: string, senha: string) => hashSimples(`navalha|${telefone}|${senha}`);

const usuarios = () => ler<Usuario[]>(USUARIOS, []);

export type ErroLogin =
  | 'telefone' | 'senha-curta' | 'nome' | 'nao-cadastrado' | 'senha-errada' | 'ja-cadastrado'
  | 'senhas-diferentes' | 'sem-sessao';

export function entrar(telefoneDigitado: string, senha: string): { usuario: Usuario } | { erro: ErroLogin } {
  const telefone = soDigitos(telefoneDigitado);
  if (!telefoneValido(telefone)) return { erro: 'telefone' };
  const u = usuarios().find((x) => x.telefone === telefone);
  if (!u) return { erro: 'nao-cadastrado' };
  if (u.senhaHash !== hashSenha(telefone, senha)) return { erro: 'senha-errada' };
  gravar(SESSAO, telefone);
  return { usuario: u };
}

export function cadastrar(nome: string, telefoneDigitado: string, senha: string): { usuario: Usuario } | { erro: ErroLogin } {
  const telefone = soDigitos(telefoneDigitado);
  if (nome.trim().length < 2) return { erro: 'nome' };
  if (!telefoneValido(telefone)) return { erro: 'telefone' };
  if (senha.length < 4) return { erro: 'senha-curta' };
  if (usuarios().some((x) => x.telefone === telefone)) return { erro: 'ja-cadastrado' };
  const usuario: Usuario = { nome: nome.trim(), telefone, senhaHash: hashSenha(telefone, senha), criadoEm: new Date().toISOString() };
  gravar(USUARIOS, [...usuarios(), usuario]);
  gravar(SESSAO, telefone);
  return { usuario };
}

export function sair() {
  gravar(SESSAO, null);
}

export function usuarioLogado(): Usuario | null {
  const tel = ler<string | null>(SESSAO, null);
  return tel ? usuarios().find((u) => u.telefone === tel) ?? null : null;
}

export function atualizarNome(telefone: string, nome: string): { ok: true } | { erro: ErroLogin } {
  if (nome.trim().length < 2) return { erro: 'nome' };
  gravar(USUARIOS, usuarios().map((u) => (u.telefone === telefone ? { ...u, nome: nome.trim() } : u)));
  return { ok: true };
}

export function trocarSenha(telefone: string, atual: string, nova: string): { ok: true } | { erro: ErroLogin } {
  const u = usuarios().find((x) => x.telefone === telefone);
  if (!u || u.senhaHash !== hashSenha(telefone, atual)) return { erro: 'senha-errada' };
  if (nova.length < 4) return { erro: 'senha-curta' };
  gravar(USUARIOS, usuarios().map((x) => (x.telefone === telefone ? { ...x, senhaHash: hashSenha(telefone, nova) } : x)));
  return { ok: true };
}

// apaga a conta junto com os agendamentos e comentários dela
export function excluirConta(telefone: string, senha: string): { ok: true } | { erro: ErroLogin } {
  const u = usuarios().find((x) => x.telefone === telefone);
  if (!u || u.senhaHash !== hashSenha(telefone, senha)) return { erro: 'senha-errada' };
  gravar(CHAVE_AGENDAMENTOS, agendamentosSalvos().filter((a) => a.usuario !== telefone));
  apagarComentariosDoUsuario(telefone);
  gravar(USUARIOS, usuarios().filter((x) => x.telefone !== telefone));
  gravar(SESSAO, null);
  return { ok: true };
}

export const CHAVES_AUTH = { USUARIOS, SESSAO };

export const MENSAGENS_ERRO: Record<ErroLogin, string> = {
  telefone: 'Informe um telefone com DDD (10 ou 11 dígitos).',
  'senha-curta': 'A senha precisa ter pelo menos 4 caracteres.',
  nome: 'Informe seu nome.',
  'nao-cadastrado': 'Telefone não cadastrado. Crie sua conta.',
  'senha-errada': 'Senha incorreta.',
  'ja-cadastrado': 'Este telefone já tem conta. Entre com sua senha.',
  'senhas-diferentes': 'A confirmação não é igual à nova senha.',
  'sem-sessao': 'Sua sessão terminou. Entre novamente.',
};
