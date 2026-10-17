interface Props {
  valor: number;
  total?: number;
}

export function Rating({ valor, total }: Props) {
  const cheias = Math.round(valor);
  const nota = valor.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return (
    <span className="rating" aria-label={`Nota ${nota} de 5${total ? `, ${total} avaliações` : ''}`}>
      <span className="stars" aria-hidden="true">
        {'★'.repeat(cheias)}
        <span className="off">{'★'.repeat(5 - cheias)}</span>
      </span>
      <strong>{nota}</strong>
      {total != null && <span className="count">· {total} avaliações</span>}
    </span>
  );
}
