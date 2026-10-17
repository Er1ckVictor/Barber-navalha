import type { SecaoConteudo } from '@/types/barbearia';

interface Props {
  secao: SecaoConteudo;
  active: boolean;
  light: boolean;
  // no main quem controla o card é a animação de abertura, não o `active`
  intro: boolean;
}

export function ContentSection({ secao, active, light, intro }: Props) {
  const classes = [light && 'light', active && 'active', intro && 'intro'].filter(Boolean).join(' ') || undefined;

  return (
    <section id={secao.id} className={classes}>
      <div className={intro ? 'card manual' : 'card'} data-intro-card={intro || undefined}>
        <span className="kicker">{secao.rotulo}</span>
        <h2>{secao.titulo}</h2>
        {secao.texto && <p>{secao.texto}</p>}

        {secao.itens && (
          <ul className="list">
            {secao.itens.map((it) => (
              <li key={it.nome}>
                <div>
                  <span className="n">{it.nome}</span>
                  {it.detalhe && <span className="d">{it.detalhe}</span>}
                </div>
                {it.valor && <span className="v">{it.valor}</span>}
              </li>
            ))}
          </ul>
        )}

        {secao.acoes && (
          <div className="actions">
            {secao.acoes.map((a) => (
              <a key={a.texto} className={a.estilo === 'ghost' ? 'btn ghost' : 'btn'} href={a.link}>
                {a.texto}
              </a>
            ))}
          </div>
        )}

        {secao.rodape && <p className="note">{secao.rodape}</p>}
      </div>
    </section>
  );
}
