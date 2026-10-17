'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  titulo: string;
  children?: ReactNode;
  confirmar: string;
  cancelar?: string;
  // botão de confirmar em vermelho
  perigo?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ titulo, children, confirmar, cancelar = 'Cancelar', perigo, onConfirm, onCancel }: Props) {
  const cancelarRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    cancelarRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="modal-backdrop confirm-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal confirm" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <div className="modal-body">
          <h3 id="confirm-title" className="confirm-title">{titulo}</h3>
          {children}
          <div className="modal-actions">
            <button type="button" className={perigo ? 'btn danger-solid' : 'btn'} onClick={onConfirm}>
              {confirmar}
            </button>
            <button type="button" ref={cancelarRef} className="btn ghost" onClick={onCancel}>
              {cancelar}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
