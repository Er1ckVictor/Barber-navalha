import type { CSSProperties } from 'react';
import type { Plano, SecaoLista } from '@/types/barbearia';
import { formatBRL } from '@/lib/booking';
import { SectionHeading } from './SectionHeading';

interface Props {
  secao: SecaoLista;
  planos: Plano[];
  active: boolean;
  light: boolean;
}

export function PlansSection({ secao, planos, active, light }: Props) {
  const classes = ['wide', light && 'light', active && 'active'].filter(Boolean).join(' ');
  return (
    <section id={secao.id} className={classes}>
      <div className="card wide">
        <SectionHeading rotulo={secao.rotulo} titulo={secao.titulo} texto={secao.texto} />
        <ul className="plans" data-scroll>
          {planos.map((p) => (
            <li key={p.id} className={p.destaque ? 'plan featured' : 'plan'} style={{ '--plan': p.cor } as CSSProperties}>
              {p.destaque && <span className="plan-tag">{p.destaque}</span>}
              <h3 className="plan-name">{p.nome}</h3>
              <p className="plan-price">
                <strong>{formatBRL(p.preco)}</strong>
                <span>/mês</span>
              </p>
              <p className="plan-desc">{p.descricao}</p>
              <ul className="plan-benefits">
                {p.beneficios.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <p className="muted small plans-note">Planos contratados direto na barbearia.</p>
      </div>
    </section>
  );
}
