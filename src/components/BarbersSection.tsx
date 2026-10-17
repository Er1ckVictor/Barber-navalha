'use client';

import Image from 'next/image';
import type { Barbeiro, SecaoLista, Servico } from '@/types/barbearia';
import { Rating } from './Rating';
import { SectionHeading } from './SectionHeading';

interface Props {
  secao: SecaoLista;
  barbeiros: Barbeiro[];
  active: boolean;
  light: boolean;
  // serviço escolhido antes na seção de serviços
  servicoPendente: Servico | null;
  onLimparServico: () => void;
  onEscolher: (barbeiroId: string) => void;
}

export function BarbersSection({ secao, barbeiros, active, light, servicoPendente, onLimparServico, onEscolher }: Props) {
  const classes = ['wide', light && 'light', active && 'active'].filter(Boolean).join(' ');

  return (
    <section id={secao.id} className={classes}>
      <div className="card wide">
        <SectionHeading rotulo={secao.rotulo} titulo={secao.titulo} texto={secao.texto} />

        {servicoPendente && (
          <div className="pending" role="status">
            <span>
              Serviço escolhido: <strong>{servicoPendente.nome}</strong>. Agora escolha o barbeiro.
            </span>
            <button type="button" className="link" onClick={onLimparServico}>
              Trocar serviço
            </button>
          </div>
        )}

        <ul className="barbers" data-scroll>
          {barbeiros.map((b) => {
            const atende = !servicoPendente || !b.servicos || b.servicos.includes(servicoPendente.id);
            return (
              <li key={b.id}>
                <button
                  type="button"
                  className="barber"
                  onClick={() => onEscolher(b.id)}
                  disabled={!atende}
                  aria-label={`Agendar com ${b.nome}`}
                >
                  <span className="barber-photo">
                    <Image src={b.foto} alt="" fill sizes="(max-width: 700px) 70vw, 300px" unoptimized={b.foto.endsWith('.svg')} />
                  </span>
                  <span className="barber-info">
                    <span className="barber-name">{b.nome}</span>
                    <span className="barber-desc">{b.descricao}</span>
                    <Rating valor={b.avaliacao} total={b.totalAvaliacoes} />
                    <span className="barber-cta">{atende ? 'Ver horários →' : 'Não faz este serviço'}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
