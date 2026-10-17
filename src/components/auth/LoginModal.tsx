'use client';

import { useEffect, useRef, useState } from 'react';
import type { Usuario } from '@/types/barbearia';
import { MENSAGENS_ERRO, cadastrar, entrar, mascaraTelefone, type ErroLogin } from '@/lib/auth';

interface Props {
  // mensagem que aparece abaixo do título
  motivo?: string;
  onClose: () => void;
  onSuccess: (u: Usuario) => void;
}

type Modo = 'entrar' | 'criar';

export function LoginModal({ motivo, onClose, onSuccess }: Props) {
  const [modo, setModo] = useState<Modo>('entrar');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState<ErroLogin | null>(null);
  const primeiroCampo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    primeiroCampo.current?.focus();
  }, [modo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [onClose]);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const r = modo === 'entrar' ? entrar(telefone, senha) : cadastrar(nome, telefone, senha);
    if ('erro' in r) setErro(r.erro);
    else onSuccess(r.usuario);
  };

  const trocar = (m: Modo) => {
    setModo(m);
    setErro(null);
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal auth" role="dialog" aria-modal="true" aria-labelledby="auth-title" data-scroll>
        <header className="modal-head">
          <div className="modal-who">
            <h3 id="auth-title">{modo === 'entrar' ? 'Entrar' : 'Criar conta'}</h3>
            {motivo && <span className="muted small">{motivo}</span>}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </header>

        <div className="modal-body">
          <div className="notice" role="note">
            <strong>Site de exemplo.</strong> Este login é apenas uma demonstração: telefone, senha e agendamentos
            ficam salvos somente neste navegador (dados locais) e nada é enviado a um servidor. Não use uma senha real.
          </div>

          <div className="segmented" role="tablist" aria-label="Entrar ou criar conta">
            <button type="button" role="tab" aria-selected={modo === 'entrar'} className={modo === 'entrar' ? 'on' : ''} onClick={() => trocar('entrar')}>
              Já tenho conta
            </button>
            <button type="button" role="tab" aria-selected={modo === 'criar'} className={modo === 'criar' ? 'on' : ''} onClick={() => trocar('criar')}>
              Criar conta
            </button>
          </div>

          <form className="form" onSubmit={enviar} noValidate>
            {modo === 'criar' && (
              <label className="input">
                <span>Nome</span>
                <input
                  ref={primeiroCampo}
                  type="text"
                  autoComplete="name"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Como podemos te chamar?"
                />
              </label>
            )}

            <label className="input">
              <span>Telefone (com DDD)</span>
              <input
                ref={modo === 'entrar' ? primeiroCampo : undefined}
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={telefone}
                onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
                placeholder="(11) 98765-4321"
                aria-invalid={erro === 'telefone' || undefined}
              />
            </label>

            <label className="input">
              <span>Senha</span>
              <span className="with-action">
                <input
                  type={verSenha ? 'text' : 'password'}
                  autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder={modo === 'criar' ? 'Mínimo de 4 caracteres' : 'Sua senha'}
                  aria-invalid={erro === 'senha-errada' || erro === 'senha-curta' || undefined}
                />
                <button type="button" className="link" onClick={() => setVerSenha((v) => !v)}>
                  {verSenha ? 'Ocultar' : 'Mostrar'}
                </button>
              </span>
            </label>

            {erro && (
              <p className="error" role="alert">
                {MENSAGENS_ERRO[erro]}{' '}
                {erro === 'nao-cadastrado' && (
                  <button type="button" className="link" onClick={() => trocar('criar')}>Criar conta</button>
                )}
                {erro === 'ja-cadastrado' && (
                  <button type="button" className="link" onClick={() => trocar('entrar')}>Entrar</button>
                )}
              </p>
            )}

            <div className="modal-actions">
              <button type="submit" className="btn">{modo === 'entrar' ? 'Entrar' : 'Criar conta e entrar'}</button>
              <button type="button" className="btn ghost" onClick={onClose}>Agora não</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
