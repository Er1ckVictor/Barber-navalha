import type { ReactNode, Ref } from 'react';
import type { Acao, Marca } from '@/types/barbearia';

interface Props {
  marca: Marca;
  agendamento: Acao;
  // a opacidade do logo é controlada pela animação
  logoRef: Ref<HTMLAnchorElement>;
  conta?: ReactNode;
}

export function Header({ marca, agendamento, logoRef, conta }: Props) {
  return (
    <header className="site-header">
      <a ref={logoRef} className="logo" href="#inicio">
        <span>{marca.nome.split(' ').slice(0, -1).join(' ')}</span> {marca.nome.split(' ').slice(-1)[0]}
      </a>
      <div className="header-actions">
        {conta}
        <a className="btn" href={agendamento.link}>
          {agendamento.texto}
        </a>
      </div>
    </header>
  );
}
