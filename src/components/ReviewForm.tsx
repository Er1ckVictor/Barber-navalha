'use client';

import { useState } from 'react';
import type { Barbeiro, Usuario } from '@/types/barbearia';
import { salvarComentario } from '@/lib/comentarios';

interface Props {
  usuario: Usuario | null;
  barbeiros: Barbeiro[];
  onPedirLogin: () => void;
}

const ROTULOS = ['', 'Ruim', 'Regular', 'Bom', 'Muito bom', 'Excelente'];

export function ReviewForm({ usuario, barbeiros, onPedirLogin }: Props) {
  const [nota, setNota] = useState(0);
  const [hover, setHover] = useState(0);
  const [texto, setTexto] = useState('');
  const [barbeiroId, setBarbeiroId] = useState('');
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  if (!usuario) {
    return (
      <div className="review-form locked">
        <p>
          <strong>Quer deixar sua avaliação?</strong>
          <span className="muted"> Entre na sua conta para comentar.</span>
        </p>
        <button type="button" className="btn" onClick={onPedirLogin}>
          Entrar para comentar
        </button>
      </div>
    );
  }

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nota) return setAviso({ tipo: 'erro', texto: 'Escolha uma nota de 1 a 5 estrelas.' });
    if (texto.trim().length < 5) return setAviso({ tipo: 'erro', texto: 'Escreva um comentário (mínimo de 5 caracteres).' });
    salvarComentario({
      usuario: usuario.telefone,
      nome: usuario.nome,
      nota,
      texto,
      barbeiroId: barbeiroId || undefined,
    });
    setNota(0);
    setTexto('');
    setBarbeiroId('');
    setAviso({ tipo: 'ok', texto: 'Obrigado! Seu comentário foi publicado.' });
  };

  const mostrada = hover || nota;

  return (
    <form className="review-form" onSubmit={enviar}>
      <div className="review-form-head">
        <strong>Deixe sua avaliação</strong>
        <span className="muted small">Comentando como {usuario.nome}</span>
      </div>

      <div className="star-input" role="radiogroup" aria-label="Nota" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={nota === n}
            aria-label={`${n} estrela${n > 1 ? 's' : ''}: ${ROTULOS[n]}`}
            className={n <= mostrada ? 'on' : undefined}
            onMouseEnter={() => setHover(n)}
            onClick={() => {
              setNota(n);
              setAviso(null);
            }}
          >
            ★
          </button>
        ))}
        <span className="star-label">{mostrada ? ROTULOS[mostrada] : 'Toque para avaliar'}</span>
      </div>

      <div className="review-fields">
        <label className="input">
          <span className="sr-only">Comentário</span>
          <textarea
            rows={3}
            maxLength={400}
            placeholder="Como foi seu atendimento?"
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              setAviso(null);
            }}
          />
        </label>
        <label className="input select">
          <span className="sr-only">Barbeiro (opcional)</span>
          <select value={barbeiroId} onChange={(e) => setBarbeiroId(e.target.value)}>
            <option value="">Barbeiro (opcional)</option>
            {barbeiros.map((b) => (
              <option key={b.id} value={b.id}>{b.nome}</option>
            ))}
          </select>
        </label>
      </div>

      {aviso && <p className={aviso.tipo === 'ok' ? 'success' : 'error'} role="status">{aviso.texto}</p>}
      <div className="review-actions">
        <span className="muted small">{texto.length}/400</span>
        <button type="submit" className="btn">Publicar comentário</button>
      </div>
    </form>
  );
}
