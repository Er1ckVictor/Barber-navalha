import type { Agendamento, Barbeiro, Servico, StatusAgendamento } from '@/types/barbearia';
import { gravar, ler } from './storage';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const formatBRL = (v: number) => brl.format(v);

export const formatDuracao = (min: number) =>
  min < 60 ? `${min} min` : `${Math.floor(min / 60)}h${min % 60 ? String(min % 60).padStart(2, '0') : ''}`;

// AAAA-MM-DD no fuso local (toISOString usaria UTC)
export const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const fromISODate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const formatDataLonga = (iso: string) =>
  fromISODate(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

export interface Dia {
  iso: string;
  semana: string; // "seg"
  dia: string; // "20"
  mes: string; // "out"
  aberto: boolean;
}

export function proximosDias(barbeiro: Barbeiro, n = 14, hoje = new Date()): Dia[] {
  const dias: Dia[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
    const dow = d.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    dias.push({
      iso: toISODate(d),
      semana: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      dia: String(d.getDate()),
      mes: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      aberto: Boolean(barbeiro.atendimento[dow]) && horarios(barbeiro, toISODate(d), hoje).some((h) => h.livre),
    });
  }
  return dias;
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const toHHMM = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

// Sem backend, alguns horários aparecem ocupados de propósito. O hash deixa
// isso estável, então o mesmo horário está sempre ocupado.
function ocupadoSimulado(barbeiroId: string, iso: string, hhmm: string) {
  let h = 0;
  for (const c of `${barbeiroId}|${iso}|${hhmm}`) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 4 === 0;
}

export interface Horario {
  hora: string;
  livre: boolean;
}

// slots de 30 min; bloqueia horários que já passaram, os "ocupados" e os já agendados
export function horarios(barbeiro: Barbeiro, iso: string, agora = new Date(), passo = 30): Horario[] {
  const d = fromISODate(iso);
  const faixa = barbeiro.atendimento[d.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6];
  if (!faixa) return [];
  const [ini, fim] = faixa.map(toMin);
  const ehHoje = iso === toISODate(agora);
  const agoraMin = agora.getHours() * 60 + agora.getMinutes();
  // o que já foi agendado neste navegador (menos os cancelados)
  const meus = new Set(
    agendamentosSalvos()
      .filter((a) => a.barbeiroId === barbeiro.id && a.data === iso && !a.canceladoEm)
      .map((a) => a.horario),
  );

  const lista: Horario[] = [];
  for (let m = ini; m + passo <= fim; m += passo) {
    const hora = toHHMM(m);
    const livre = !(ehHoje && m <= agoraMin + 15) && !ocupadoSimulado(barbeiro.id, iso, hora) && !meus.has(hora);
    lista.push({ hora, livre });
  }
  return lista;
}

export const servicosDoBarbeiro = (barbeiro: Barbeiro, todos: Servico[]) =>
  barbeiro.servicos ? todos.filter((s) => barbeiro.servicos!.includes(s.id)) : todos;

// pra busca ignorar acento e maiúscula
export const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Agendamentos ficam no localStorage (não tem backend).
export const CHAVE_AGENDAMENTOS = 'navalha:agendamentos';

// Simula a barbearia confirmando: depois desse tempo "marcado" vira "confirmado".
export const CONFIRMACAO_SIMULADA_MS = 20_000;

export function agendamentosSalvos(): Agendamento[] {
  return ler<Agendamento[]>(CHAVE_AGENDAMENTOS, []);
}

export function salvarAgendamento(a: Omit<Agendamento, 'id' | 'criadoEm'>): Agendamento {
  const novo: Agendamento = { ...a, id: `ag_${Date.now().toString(36)}`, criadoEm: new Date().toISOString() };
  gravar(CHAVE_AGENDAMENTOS, [...agendamentosSalvos(), novo]);
  return novo;
}

export function cancelarAgendamento(id: string) {
  gravar(
    CHAVE_AGENDAMENTOS,
    agendamentosSalvos().map((a) => (a.id === id && !a.canceladoEm ? { ...a, canceladoEm: new Date().toISOString() } : a)),
  );
}

export const inicioAgendamento = (a: Agendamento) => {
  const d = fromISODate(a.data);
  const [h, m] = a.horario.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d;
};

export function statusDe(a: Agendamento, agora = new Date()): StatusAgendamento {
  if (a.canceladoEm) return 'cancelado';
  if (inicioAgendamento(a) <= agora) return 'concluido';
  if (agora.getTime() - new Date(a.criadoEm).getTime() >= CONFIRMACAO_SIMULADA_MS) return 'confirmado';
  return 'marcado';
}

export const NOMES_STATUS: Record<StatusAgendamento, string> = {
  marcado: 'Marcado',
  confirmado: 'Confirmado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

export const DESCRICAO_STATUS: Record<StatusAgendamento, string> = {
  marcado: 'Aguardando a confirmação da barbearia.',
  confirmado: 'A barbearia confirmou seu horário.',
  concluido: 'Atendimento realizado.',
  cancelado: 'Este agendamento foi cancelado.',
};
