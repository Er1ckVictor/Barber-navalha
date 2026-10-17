import type { Marca, SecaoHero } from '@/types/barbearia';

interface Props {
  secao: SecaoHero;
  marca: Marca;
}

// as letras (data-letter) são animadas pelo engine
export function Hero({ secao, marca }: Props) {
  return (
    <section id={secao.id} className="hero">
      <div className="brand" data-brand>
        <h1 aria-label={marca.nome}>
          {marca.nome.split(' ').map((palavra, w) => (
            <span key={w} className={w === 0 && marca.nome.includes(' ') ? 'word lead' : 'word'}>
              {[...palavra].map((c, i) => (
                <span key={i} className="ch" data-letter aria-hidden="true">
                  {c}
                </span>
              ))}
            </span>
          ))}
        </h1>
        <span className="sub" data-hero-sub>
          {marca.slogan}
        </span>
        <div className="hint" data-hero-hint>
          {secao.dica}
        </div>
      </div>
    </section>
  );
}
