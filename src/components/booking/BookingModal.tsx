'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Agendamento, Barbeiro, Categoria, Servico, Usuario } from '@/types/barbearia';
import { mascaraTelefone } from '@/lib/auth';
import {
  formatBRL,
  formatDataLonga,
  formatDuracao,
  horarios,
  normalizar,
  proximosDias,
  salvarAgendamento,
  servicosDoBarbeiro,
} from '@/lib/booking';
import { Rating } from '../Rating';

type Etapa = 'data' | 'servico' | 'resumo' | 'ok';

interface Props {
  usuario: Usuario;
  barbeiro: Barbeiro;
  servicos: Servico[];
  categorias: Categoria[];
  formasPagamento: string[];
  // quando vem da seção de serviços já com um escolhido, pula a etapa 2
  servicoInicial?: string;
  onClose: () => void;
  onConfirmado?: (a: Agendamento) => void;
  onVerAgendamentos?: () => void;
}

const ETAPAS: { id: Exclude<Etapa, 'ok'>; nome: string }[] = [
  { id: 'data', nome: 'Data e horário' },
  { id: 'servico', nome: 'Serviço' },
  { id: 'resumo', nome: 'Resumo' },
];

export function BookingModal({ usuario, barbeiro, servicos, categorias, formasPagamento, servicoInicial, onClose, onConfirmado, onVerAgendamentos }: Props) {
  const [etapa, setEtapa] = useState<Etapa>('data');
  const [dia, setDia] = useState<string | null>(null);
  const [hora, setHora] = useState<string | null>(null);
  const [servicoId, setServicoId] = useState<string | null>(servicoInicial ?? null);
  const [busca, setBusca] = useState('');
  const [cat, setCat] = useState('todos');
  const [obs, setObs] = useState('');
  const [pagamento, setPagamento] = useState<string | null>(null);
  const [erro, setErro] = useState('');
  const [confirmado, setConfirmado] = useState<Agendamento | null>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);

  const dias = useMemo(() => proximosDias(barbeiro), [barbeiro]);
  const listaHorarios = useMemo(() => (dia ? horarios(barbeiro, dia) : []), [barbeiro, dia]);
  const doBarbeiro = useMemo(() => servicosDoBarbeiro(barbeiro, servicos), [barbeiro, servicos]);
  const servico = servicos.find((s) => s.id === servicoId) ?? null;

  const filtrados = useMemo(() => {
    const q = normalizar(busca.trim());
    return doBarbeiro.filter(
      (s) =>
        (cat === 'todos' || s.categoria === cat) &&
        (!q || normalizar(`${s.nome} ${s.descricao}`).includes(q)),
    );
  }, [doBarbeiro, busca, cat]);

  useEffect(() => {
    tituloRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [onClose]);

  const podeIr = (e: Etapa) => e === 'data' || (e === 'servico' && !!hora) || (e === 'resumo' && !!hora && !!servico);

  const escolherHora = (h: string) => {
    setHora(h);
    setEtapa(servico ? 'resumo' : 'servico');
  };

  const escolherServico = (id: string) => {
    setServicoId(id);
    setEtapa('resumo');
  };

  const confirmar = () => {
    if (!dia || !hora || !servico) return;
    if (!pagamento) {
      setErro('Escolha a forma de pagamento.');
      return;
    }
    const ag = salvarAgendamento({
      usuario: usuario.telefone,
      barbeiroId: barbeiro.id,
      servicoId: servico.id,
      data: dia,
      horario: hora,
      pagamento,
      observacao: obs.trim() || undefined,
      total: servico.preco,
    });
    setConfirmado(ag);
    setEtapa('ok');
    onConfirmado?.(ag);
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="booking-title" data-scroll>
        <header className="modal-head">
          <span className="modal-photo">
            <Image src={barbeiro.foto} alt="" fill sizes="56px" />
          </span>
          <div className="modal-who">
            <h3 id="booking-title" ref={tituloRef} tabIndex={-1}>
              Agendar com {barbeiro.nome}
            </h3>
            <Rating valor={barbeiro.avaliacao} total={barbeiro.totalAvaliacoes} />
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </header>

        {etapa !== 'ok' && (
          <ol className="stepper">
            {ETAPAS.map((e, i) => (
              <li key={e.id}>
                <button
                  type="button"
                  className={etapa === e.id ? 'on' : undefined}
                  disabled={!podeIr(e.id)}
                  onClick={() => setEtapa(e.id)}
                  aria-current={etapa === e.id ? 'step' : undefined}
                >
                  <span className="num">{i + 1}</span> {e.nome}
                </button>
              </li>
            ))}
          </ol>
        )}

        {/* data e horário */}
        {etapa === 'data' && (
          <div className="modal-body">
            <h4>Escolha o dia</h4>
            <div className="days" data-scroll>
              {dias.map((d) => (
                <button
                  key={d.iso}
                  type="button"
                  className={dia === d.iso ? 'day on' : 'day'}
                  disabled={!d.aberto}
                  onClick={() => {
                    setDia(d.iso);
                    setHora(null);
                  }}
                  aria-label={formatDataLonga(d.iso)}
                >
                  <span className="dow">{d.semana}</span>
                  <span className="num">{d.dia}</span>
                  <span className="mon">{d.mes}</span>
                </button>
              ))}
            </div>

            {dia && (
              <>
                <h4>Horários de {formatDataLonga(dia)}</h4>
                <div className="slots">
                  {listaHorarios.map((h) => (
                    <button
                      key={h.hora}
                      type="button"
                      className={hora === h.hora ? 'slot on' : 'slot'}
                      disabled={!h.livre}
                      onClick={() => escolherHora(h.hora)}
                    >
                      {h.hora}
                    </button>
                  ))}
                </div>
              </>
            )}
            {!dia && <p className="muted">Dias apagados: o barbeiro não atende ou está com a agenda cheia.</p>}
          </div>
        )}

        {/* serviço */}
        {etapa === 'servico' && (
          <div className="modal-body">
            <label className="search">
              <span className="sr-only">Buscar serviço</span>
              <input
                type="search"
                placeholder="Buscar serviço (ex.: barba, degradê)"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                autoFocus
              />
            </label>
            <div className="chips" data-scroll>
              {[{ id: 'todos', nome: 'Todos' }, ...categorias].map((c) => (
                <button key={c.id} type="button" className={cat === c.id ? 'chip on' : 'chip'} onClick={() => setCat(c.id)}>
                  {c.nome}
                </button>
              ))}
            </div>

            {categorias
              .filter((c) => filtrados.some((s) => s.categoria === c.id))
              .map((c) => (
                <div key={c.id} className="svc-group">
                  <h4>{c.nome}</h4>
                  <ul className="services compact">
                    {filtrados
                      .filter((s) => s.categoria === c.id)
                      .map((s) => (
                        <li key={s.id}>
                          <button
                            type="button"
                            className={servicoId === s.id ? 'service on' : 'service'}
                            onClick={() => escolherServico(s.id)}
                          >
                            <span className="service-main">
                              <span className="service-name">{s.nome}</span>
                              <span className="service-desc">
                                {s.descricao} · {formatDuracao(s.duracaoMin)}
                              </span>
                            </span>
                            <span className="service-price">{formatBRL(s.preco)}</span>
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            {filtrados.length === 0 && <p className="muted">Nenhum serviço encontrado.</p>}
          </div>
        )}

        {/* resumo */}
        {etapa === 'resumo' && servico && dia && hora && (
          <div className="modal-body">
            <dl className="summary">
              <div><dt>Barbeiro</dt><dd>{barbeiro.nome}</dd></div>
              <div><dt>Data</dt><dd>{formatDataLonga(dia)}</dd></div>
              <div><dt>Horário</dt><dd>{hora}</dd></div>
              <div><dt>Serviço</dt><dd>{servico.nome} <span className="muted">· {formatDuracao(servico.duracaoMin)}</span></dd></div>
              <div><dt>Cliente</dt><dd>{usuario.nome} <span className="muted">· {mascaraTelefone(usuario.telefone)}</span></dd></div>
            </dl>

            <label className="field">
              <span>Observação <span className="muted">(opcional)</span></span>
              <textarea
                rows={3}
                maxLength={300}
                placeholder="Ex.: quero manter o comprimento em cima"
                value={obs}
                onChange={(e) => setObs(e.target.value)}
              />
            </label>

            <fieldset className="field">
              <legend>Forma de pagamento</legend>
              <div className="chips wrap">
                {formasPagamento.map((f) => (
                  <label key={f} className={pagamento === f ? 'chip on' : 'chip'}>
                    <input
                      type="radio"
                      name="pagamento"
                      value={f}
                      checked={pagamento === f}
                      onChange={() => {
                        setPagamento(f);
                        setErro('');
                      }}
                    />
                    {f}
                  </label>
                ))}
              </div>
              <p className="muted small">Pagamento no local, no dia do atendimento.</p>
            </fieldset>

            <div className="total">
              <span>Total</span>
              <strong>{formatBRL(servico.preco)}</strong>
            </div>
            {erro && <p className="error" role="alert">{erro}</p>}

            <div className="modal-actions">
              <button type="button" className="btn" onClick={confirmar}>Confirmar agendamento</button>
              <button type="button" className="btn ghost" onClick={() => setEtapa('data')}>Editar</button>
              <button type="button" className="btn ghost danger" onClick={onClose}>Cancelar</button>
            </div>
          </div>
        )}

        {/* confirmado */}
        {etapa === 'ok' && confirmado && servico && (
          <div className="modal-body done">
            <span className="done-icon" aria-hidden="true">✓</span>
            <h4>Horário marcado!</h4>
            <p>
              {servico.nome} com {barbeiro.nome}, {formatDataLonga(confirmado.data)} às {confirmado.horario}.
              <br />
              Total {formatBRL(confirmado.total)} · {confirmado.pagamento}.
            </p>
            <p className="muted small">A barbearia confirma em instantes. Acompanhe o status em Meus agendamentos.</p>
            <div className="modal-actions">
              {onVerAgendamentos && (
                <button type="button" className="btn" onClick={onVerAgendamentos}>Ver meus agendamentos</button>
              )}
              <button type="button" className="btn ghost" onClick={onClose}>Concluir</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
