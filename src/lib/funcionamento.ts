import type { HorarioSemanal } from '@/types/barbearia';

type Dow = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const NOMES_DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
// segunda a domingo
export const ORDEM_SEMANA: Dow[] = [1, 2, 3, 4, 5, 6, 0];

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

// "09:00" vira "9h" e "18:30" vira "18h30"
export const horaCurta = (hhmm: string) => {
  const [h, m] = hhmm.split(':');
  return `${Number(h)}h${m === '00' ? '' : m}`;
};

export interface StatusFuncionamento {
  aberto: boolean;
  texto: string;
}

export function statusFuncionamento(f: HorarioSemanal, agora: Date): StatusFuncionamento {
  const dow = agora.getDay() as Dow;
  const min = agora.getHours() * 60 + agora.getMinutes();
  const hoje = f[dow];
  if (hoje && min >= toMin(hoje[0]) && min < toMin(hoje[1])) {
    return { aberto: true, texto: `Aberto agora · fecha às ${horaCurta(hoje[1])}` };
  }
  if (hoje && min < toMin(hoje[0])) {
    return { aberto: false, texto: `Fechado agora · abre hoje às ${horaCurta(hoje[0])}` };
  }
  for (let i = 1; i <= 7; i++) {
    const d = ((dow + i) % 7) as Dow;
    const faixa = f[d];
    if (faixa) {
      const quando = i === 1 ? 'amanhã' : NOMES_DIAS[d].toLowerCase();
      return { aberto: false, texto: `Fechado agora · abre ${quando} às ${horaCurta(faixa[0])}` };
    }
  }
  return { aberto: false, texto: 'Fechado' };
}
