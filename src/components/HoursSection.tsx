'use client';

import { useEffect, useRef, useState } from 'react';
import type { Avaliacao, Barbeiro, HorarioSemanal, SecaoLista } from '@/types/barbearia';
import { NOMES_DIAS, ORDEM_SEMANA, horaCurta, statusFuncionamento } from '@/lib/funcionamento';
import { fromISODate } from '@/lib/booking';
import { Rating } from './Rating';
import { ReviewForm } from './ReviewForm';
import { useComentarios, useUsuario } from '@/hooks/useLocalData';
import { apagarComentario } from '@/lib/comentarios';
import { SectionHeading } from './SectionHeading';

interface Props {
  secao: SecaoLista;
  funcionamento: HorarioSemanal;
  endereco: string;
  rodape: string;
  avaliacoes: Avaliacao[];
  barbeiros: Barbeiro[];
  active: boolean;
  light: boolean;
  onPedirLogin: () => void;
}

// Horários + comentários. A seção tem scroll próprio (data-scroll); quando ele chega
// no fim, o próximo gesto troca de seção.
export function HoursSection({ secao, funcionamento, endereco, rodape, avaliacoes, barbeiros, active, light, onPedirLogin }: Props) {
  const usuario = useUsuario();
  const comentarios = useComentarios();
  // comentários do usuário primeiro, depois os fixos
  const todos = [...comentarios.map((c) => ({ ...c, chave: c.id })), ...avaliacoes.map((a, i) => ({ ...a, chave: `fixo-${i}`, id: undefined, usuario: undefined }))];
  const scrollRef = useRef<HTMLDivElement>(null);
  const comentariosRef = useRef<HTMLDivElement>(null);
  // calculado só no client pra não dar erro de hydration
  const [agora, setAgora] = useState<Date | null>(null);
  useEffect(() => {
    setAgora(new Date());
    const id = setInterval(() => setAgora(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const status = agora ? statusFuncionamento(funcionamento, agora) : null;
  const hojeDow = agora?.getDay();
  const media = todos.reduce((s, a) => s + a.nota, 0) / Math.max(1, todos.length);
  const classes = ['wide', light && 'light', active && 'active'].filter(Boolean).join(' ');

  const irParaComentarios = () => {
    const box = scrollRef.current, alvo = comentariosRef.current;
    if (!box || !alvo) return;
    box.scrollTo({ top: alvo.offsetTop - 8, behavior: 'smooth' });
  };

  return (
    <section id={secao.id} className={classes}>
      <div className="card wide">
        <div className="inner-scroll" ref={scrollRef} data-scroll>
          <div className="hours-layout">
            <div>
              <SectionHeading rotulo={secao.rotulo} titulo={secao.titulo} texto={secao.texto} />
              <p className={status ? (status.aberto ? 'open-status open' : 'open-status closed') : 'open-status'} aria-live="polite">
                <span className="dot" aria-hidden="true" />
                {status ? status.texto : ' '}
              </p>
              <p className="address">{endereco}</p>
              <div className="actions">
                <a className="btn" href="#barbeiros">Agendar horário</a>
                <button type="button" className="btn ghost" onClick={irParaComentarios}>
                  Ver comentários
                </button>
              </div>
            </div>

            <ul className="hours" aria-label="Horário de funcionamento">
              {ORDEM_SEMANA.map((d) => {
                const faixa = funcionamento[d];
                const hoje = d === hojeDow;
                return (
                  <li key={d} className={[hoje && 'today', !faixa && 'closed'].filter(Boolean).join(' ') || undefined}>
                    <span className="day-name">
                      {NOMES_DIAS[d]}
                      {hoje && <span className="today-tag">Hoje</span>}
                    </span>
                    <span className="day-hours">{faixa ? `${horaCurta(faixa[0])} – ${horaCurta(faixa[1])}` : 'Fechado'}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="reviews-block" id="comentarios" ref={comentariosRef}>
            <div className="reviews-head">
              <div>
                <span className="kicker">Comentários</span>
                <h3>Quem corta, sempre volta.</h3>
              </div>
              <Rating valor={media} total={todos.length} />
            </div>
            <ReviewForm usuario={usuario} barbeiros={barbeiros} onPedirLogin={onPedirLogin} />

            <ul className="reviews">
              {todos.map((a) => (
                <li key={a.chave} className={a.usuario && a.usuario === usuario?.telefone ? 'review mine' : 'review'}>
                  <div className="review-top">
                    <strong>{a.nome}</strong>
                    <span className="stars" aria-label={`${a.nota} de 5`}>
                      {'★'.repeat(a.nota)}
                      <span className="off">{'★'.repeat(5 - a.nota)}</span>
                    </span>
                  </div>
                  <p>{a.texto}</p>
                  <span className="muted small">
                    {fromISODate(a.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {a.barbeiroId && ` · com ${barbeiros.find((b) => b.id === a.barbeiroId)?.nome ?? ''}`}
                  </span>
                  {a.id && usuario && a.usuario === usuario.telefone && (
                    <button type="button" className="link small review-delete" onClick={() => apagarComentario(a.id!, usuario.telefone)}>
                      Apagar meu comentário
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <p className="note">{rodape}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
