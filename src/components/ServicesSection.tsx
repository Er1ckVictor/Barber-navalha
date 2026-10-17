'use client';

import { useState } from 'react';
import type { Categoria, SecaoLista, Servico } from '@/types/barbearia';
import { formatBRL, formatDuracao } from '@/lib/booking';
import { SectionHeading } from './SectionHeading';

interface Props {
  secao: SecaoLista;
  servicos: Servico[];
  categorias: Categoria[];
  active: boolean;
  light: boolean;
  onEscolher: (servicoId: string) => void;
}

export function ServicesSection({ secao, servicos, categorias, active, light, onEscolher }: Props) {
  const [cat, setCat] = useState<string>('todos');
  const lista = cat === 'todos' ? servicos : servicos.filter((s) => s.categoria === cat);
  const classes = ['wide', light && 'light', active && 'active'].filter(Boolean).join(' ');

  return (
    <section id={secao.id} className={classes}>
      <div className="card wide">
        <SectionHeading rotulo={secao.rotulo} titulo={secao.titulo} texto={secao.texto} />

        <div className="chips" role="tablist" aria-label="Categorias" data-scroll>
          {[{ id: 'todos', nome: 'Todos' }, ...categorias].map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={cat === c.id}
              className={cat === c.id ? 'chip on' : 'chip'}
              onClick={() => setCat(c.id)}
            >
              {c.nome}
            </button>
          ))}
        </div>

        <ul className="services" data-scroll>
          {lista.map((s) => (
            <li key={s.id}>
              <button type="button" className="service" onClick={() => onEscolher(s.id)}>
                <span className="service-main">
                  <span className="service-name">{s.nome}</span>
                  <span className="service-desc">{s.descricao}</span>
                  <span className="service-meta">
                    {categorias.find((c) => c.id === s.categoria)?.nome} · {formatDuracao(s.duracaoMin)}
                  </span>
                </span>
                <span className="service-price">{formatBRL(s.preco)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
