interface Props {
  rotulo: string;
  titulo: string;
  texto?: string;
}

export function SectionHeading({ rotulo, titulo, texto }: Props) {
  return (
    <header className="section-heading">
      <span className="kicker">{rotulo}</span>
      <h2>{titulo}</h2>
      {texto && <p>{texto}</p>}
    </header>
  );
}
