'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import type { Agendamento, Barbeiro, Servico, StatusAgendamento, Usuario } from '@/types/barbearia';
import {
  DESCRICAO_STATUS,
  NOMES_STATUS,
  cancelarAgendamento,
  formatBRL,
  formatDataLonga,
  formatDuracao,
  inicioAgendamento,
  statusDe,
} from '@/lib/booking';
import { useAgendamentos, useAgora } from '@/hooks/useLocalData';

interface Props {
  usuario: Usuario;
  barbeiros: Barbeiro[];
  servicos: Servico[];
  onAgendarNovamente: (barbeiroId: string, servicoId: string) => void;
}

type Filtro = 'todos' | StatusAgendamento;
const FILTROS: Filtro[] = ['todos', 'marcado', 'confirmado', 'concluido', 'cancelado'];

const dataHora = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export function BookingsList({ usuario, barbeiros, servicos, onAgendarNovamente }: Props) {
  const agendamentos = useAgendamentos(usuario.telefone);
  const agora = useAgora(5000); // o status muda com o tempo, então atualiza de vez em quando
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [cancelando, setCancelando] = useState<string | null>(null);

  const comStatus = useMemo(
    () => agendamentos.map((a) => ({ a, status: statusDe(a, agora) })),
    [agendamentos, agora],
  );

  const contagem = useMemo(() => {
    const c: Record<Filtro, number> = { todos: comStatus.length, marcado: 0, confirmado: 0, concluido: 0, cancelado: 0 };
    comStatus.forEach(({ status }) => c[status]++);
    return c;
  }, [comStatus]);

  // próximos atendimentos primeiro, depois o histórico
  const lista = useMemo(() => {
    const ativos = (s: StatusAgendamento) => s === 'marcado' || s === 'confirmado';
    return comStatus
      .filter(({ status }) => filtro === 'todos' || status === filtro)
      .sort((x, y) => {
        const ax = ativos(x.status), ay = ativos(y.status);
        if (ax !== ay) return ax ? -1 : 1;
        const dx = inicioAgendamento(x.a).getTime(), dy = inicioAgendamento(y.a).getTime();
        return ax ? dx - dy : dy - dx;
      });
  }, [comStatus, filtro]);

  const proximo = comStatus
    .filter(({ status }) => status === 'marcado' || status === 'confirmado')
    .sort((x, y) => inicioAgendamento(x.a).getTime() - inicioAgendamento(y.a).getTime())[0];

  return (
    <div className="bookings-wrap">
          {proximo && (
            <div className="next-up">
              <span className="kicker">Próximo atendimento</span>
              <strong>
                {formatDataLonga(proximo.a.data)} às {proximo.a.horario}
              </strong>
              <span className="muted small">
                {servicos.find((s) => s.id === proximo.a.servicoId)?.nome} com{' '}
                {barbeiros.find((b) => b.id === proximo.a.barbeiroId)?.nome} · {NOMES_STATUS[proximo.status]}
              </span>
            </div>
          )}

          <div className="chips" role="tablist" aria-label="Filtrar por status" data-scroll>
            {FILTROS.map((f) => (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={filtro === f}
                className={filtro === f ? 'chip on' : 'chip'}
                onClick={() => setFiltro(f)}
              >
                {f === 'todos' ? 'Todos' : NOMES_STATUS[f]} <span className="chip-count">{contagem[f]}</span>
              </button>
            ))}
          </div>

          {lista.length === 0 && (
            <p className="muted empty">
              {agendamentos.length === 0 ? 'Você ainda não tem agendamentos.' : 'Nenhum agendamento com este status.'}
            </p>
          )}

          <ul className="bookings">
            {lista.map(({ a, status }) => (
              <BookingItem
                key={a.id}
                a={a}
                status={status}
                barbeiro={barbeiros.find((b) => b.id === a.barbeiroId)}
                servico={servicos.find((s) => s.id === a.servicoId)}
                confirmandoCancelamento={cancelando === a.id}
                onPedirCancelamento={() => setCancelando(a.id)}
                onDesistirCancelamento={() => setCancelando(null)}
                onCancelar={() => {
                  cancelarAgendamento(a.id);
                  setCancelando(null);
                }}
                onAgendarNovamente={() => onAgendarNovamente(a.barbeiroId, a.servicoId)}
              />
            ))}
          </ul>

    </div>
  );
}

interface ItemProps {
  a: Agendamento;
  status: StatusAgendamento;
  barbeiro?: Barbeiro;
  servico?: Servico;
  confirmandoCancelamento: boolean;
  onPedirCancelamento: () => void;
  onDesistirCancelamento: () => void;
  onCancelar: () => void;
  onAgendarNovamente: () => void;
}

function BookingItem({
  a, status, barbeiro, servico, confirmandoCancelamento,
  onPedirCancelamento, onDesistirCancelamento, onCancelar, onAgendarNovamente,
}: ItemProps) {
  const ativo = status === 'marcado' || status === 'confirmado';
  return (
    <li className={`booking s-${status}`}>
      <div className="booking-top">
        {barbeiro && (
          <span className="booking-photo">
            <Image src={barbeiro.foto} alt="" fill sizes="44px" />
          </span>
        )}
        <div className="booking-title">
          <strong>{servico?.nome ?? 'Serviço'}</strong>
          <span className="muted small">com {barbeiro?.nome ?? 'barbeiro'}</span>
        </div>
        <span className={`badge b-${status}`} title={DESCRICAO_STATUS[status]}>
          {NOMES_STATUS[status]}
        </span>
      </div>

      <dl className="booking-details">
        <div><dt>Data</dt><dd>{formatDataLonga(a.data)}</dd></div>
        <div><dt>Horário</dt><dd>{a.horario}{servico ? ` · ${formatDuracao(servico.duracaoMin)}` : ''}</dd></div>
        <div><dt>Pagamento</dt><dd>{a.pagamento}</dd></div>
        <div><dt>Total</dt><dd>{formatBRL(a.total)}</dd></div>
        {a.observacao && <div className="full"><dt>Observação</dt><dd>{a.observacao}</dd></div>}
        <div><dt>Agendado em</dt><dd>{dataHora(a.criadoEm)}</dd></div>
        {a.canceladoEm && <div><dt>Cancelado em</dt><dd>{dataHora(a.canceladoEm)}</dd></div>}
        <div><dt>Código</dt><dd className="mono">{a.id.replace('ag_', '').toUpperCase()}</dd></div>
      </dl>
      <p className="muted small status-note">{DESCRICAO_STATUS[status]}</p>

      <div className="booking-actions">
        {ativo && !confirmandoCancelamento && (
          <button type="button" className="btn ghost danger" onClick={onPedirCancelamento}>
            Cancelar agendamento
          </button>
        )}
        {ativo && confirmandoCancelamento && (
          <div className="confirm-cancel" role="alert">
            <span>Cancelar este horário?</span>
            <button type="button" className="btn danger-solid" onClick={onCancelar}>Sim, cancelar</button>
            <button type="button" className="btn ghost" onClick={onDesistirCancelamento}>Voltar</button>
          </div>
        )}
        {!ativo && (
          <button type="button" className="btn ghost" onClick={onAgendarNovamente}>
            Agendar de novo
          </button>
        )}
      </div>
    </li>
  );
}
