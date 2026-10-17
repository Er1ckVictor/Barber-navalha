'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  titulo: string;
  children?: ReactNode;
  confirmar: string;
  cancelar?: string;
  /** Ação destrutiva (botão vermelho). */
  perigo?: boolean;
  /** Desabilita o botão de confirmar (ex.: enquanto falta preencher a senha). */
  bloqueado?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

/** Caixa de confirmação acessível (role="alertdialog"), fecha com Esc. */
export function ConfirmDialog({ titulo, children, confirmar, cancelar = 'Cancelar', perigo, bloqueado, onConfirmar, onCancelar }: Props) {
  const cancelarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // foco no botão seguro (cancelar), a menos que haja um campo dentro
    const campo = document.querySelector<HTMLInputElement>('.confirm-dialog input');
    (campo ?? cancelarRef.current)?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancelar();
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [onCancelar]);

  return (
    <div className="modal-backdrop confirm-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onCancelar()}>
      <form
        className="modal confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onSubmit={(e) => {
          e.preventDefault();
          if (!bloqueado) onConfirmar();
        }}
      >
        <div className="modal-body">
          <h3 id="confirm-title">{titulo}</h3>
          {children}
          <div className="modal-actions">
            <button type="submit" className={perigo ? 'btn danger-solid' : 'btn'} disabled={bloqueado}>
              {confirmar}
            </button>
            <button type="button" ref={cancelarRef} className="btn ghost" onClick={onCancelar}>
              {cancelar}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
