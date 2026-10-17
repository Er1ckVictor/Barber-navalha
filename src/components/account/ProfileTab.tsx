'use client';

import { useState } from 'react';
import type { Usuario } from '@/types/barbearia';
import { MENSAGENS_ERRO, atualizarNome, excluirConta, mascaraTelefone, trocarSenha, type ErroLogin } from '@/lib/auth';
import { statusDe } from '@/lib/booking';
import { useAgendamentos } from '@/hooks/useLocalData';
import { ConfirmDialog } from '../ConfirmDialog';
import { iniciais } from './AccountMenu';

interface Props {
  usuario: Usuario;
  onContaExcluida: () => void;
  onSair: () => void;
}

type Aviso = { tipo: 'ok' | 'erro'; texto: string } | null;
const erro = (e: ErroLogin): Aviso => ({ tipo: 'erro', texto: MENSAGENS_ERRO[e] });

export function ProfileTab({ usuario, onContaExcluida, onSair }: Props) {
  const ags = useAgendamentos(usuario.telefone);
  const contagem = ags.reduce(
    (c, a) => {
      c[statusDe(a)]++;
      return c;
    },
    { marcado: 0, confirmado: 0, concluido: 0, cancelado: 0 },
  );

  const [nome, setNome] = useState(usuario.nome);
  const [avisoNome, setAvisoNome] = useState<Aviso>(null);
  const salvarNome = (e: React.FormEvent) => {
    e.preventDefault();
    const r = atualizarNome(usuario.telefone, nome);
    setAvisoNome('erro' in r ? erro(r.erro) : { tipo: 'ok', texto: 'Nome atualizado.' });
  };

  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [avisoSenha, setAvisoSenha] = useState<Aviso>(null);
  const salvarSenha = (e: React.FormEvent) => {
    e.preventDefault();
    if (nova !== confirmacao) return setAvisoSenha(erro('senhas-diferentes'));
    const r = trocarSenha(usuario.telefone, atual, nova);
    if ('erro' in r) return setAvisoSenha(erro(r.erro));
    setAtual('');
    setNova('');
    setConfirmacao('');
    setAvisoSenha({ tipo: 'ok', texto: 'Senha alterada.' });
  };

  const [excluindo, setExcluindo] = useState(false);
  const [senhaExcluir, setSenhaExcluir] = useState('');
  const [avisoExcluir, setAvisoExcluir] = useState<Aviso>(null);
  const confirmarExclusao = () => {
    const r = excluirConta(usuario.telefone, senhaExcluir);
    if ('erro' in r) return setAvisoExcluir(erro(r.erro));
    onContaExcluida();
  };

  return (
    <div className="profile-grid">
      <div className="panel profile-card">
        <span className="avatar lg" aria-hidden="true">{iniciais(usuario.nome)}</span>
        <div>
          <h2 className="profile-name">{usuario.nome}</h2>
          <p className="muted">{mascaraTelefone(usuario.telefone)}</p>
          <p className="muted small">Cliente desde {new Date(usuario.criadoEm).toLocaleDateString('pt-BR')}</p>
        </div>
        <dl className="stats">
          <div><dt>Marcados</dt><dd>{contagem.marcado}</dd></div>
          <div><dt>Confirmados</dt><dd>{contagem.confirmado}</dd></div>
          <div><dt>Concluídos</dt><dd>{contagem.concluido}</dd></div>
          <div><dt>Cancelados</dt><dd>{contagem.cancelado}</dd></div>
        </dl>
        <button type="button" className="btn ghost danger" onClick={onSair}>Sair da conta</button>
      </div>

      <div className="panel">
        <h3>Editar nome</h3>
        <form className="form" onSubmit={salvarNome}>
          <label className="input">
            <span>Nome</span>
            <input type="text" autoComplete="name" value={nome} onChange={(e) => { setNome(e.target.value); setAvisoNome(null); }} />
          </label>
          <label className="input">
            <span>Telefone</span>
            <input type="tel" value={mascaraTelefone(usuario.telefone)} disabled />
            <span className="muted small field-hint">O telefone identifica a conta e não pode ser alterado.</span>
          </label>
          {avisoNome && <p className={avisoNome.tipo === 'ok' ? 'success' : 'error'} role="status">{avisoNome.texto}</p>}
          <div className="modal-actions">
            <button type="submit" className="btn">Salvar nome</button>
          </div>
        </form>
      </div>

      <div className="panel">
        <h3>Alterar senha</h3>
        <form className="form" onSubmit={salvarSenha}>
          <label className="input">
            <span>Senha atual</span>
            <input type="password" autoComplete="current-password" value={atual} onChange={(e) => { setAtual(e.target.value); setAvisoSenha(null); }} />
          </label>
          <label className="input">
            <span>Nova senha</span>
            <input type="password" autoComplete="new-password" value={nova} onChange={(e) => { setNova(e.target.value); setAvisoSenha(null); }} placeholder="Mínimo de 4 caracteres" />
          </label>
          <label className="input">
            <span>Confirmar nova senha</span>
            <input type="password" autoComplete="new-password" value={confirmacao} onChange={(e) => { setConfirmacao(e.target.value); setAvisoSenha(null); }} />
          </label>
          {avisoSenha && <p className={avisoSenha.tipo === 'ok' ? 'success' : 'error'} role="status">{avisoSenha.texto}</p>}
          <div className="modal-actions">
            <button type="submit" className="btn">Alterar senha</button>
          </div>
        </form>
      </div>

      <div className="panel danger-zone">
        <h3>Excluir conta</h3>
        <p className="muted">
          Remove sua conta e todos os seus agendamentos deste navegador. Esta ação não pode ser desfeita.
        </p>
        <div className="modal-actions">
          <button type="button" className="btn danger-solid" onClick={() => setExcluindo(true)}>Excluir minha conta</button>
        </div>
      </div>

      {excluindo && (
        <ConfirmDialog
          titulo="Excluir sua conta?"
          confirmar="Excluir conta"
          perigo
          onConfirm={confirmarExclusao}
          onCancel={() => {
            setExcluindo(false);
            setSenhaExcluir('');
            setAvisoExcluir(null);
          }}
        >
          <p className="muted">Digite sua senha para confirmar. Seus agendamentos também serão apagados.</p>
          <label className="input" style={{ marginTop: 14 }}>
            <span>Senha</span>
            <input
              type="password"
              autoComplete="current-password"
              value={senhaExcluir}
              onChange={(e) => { setSenhaExcluir(e.target.value); setAvisoExcluir(null); }}
              onKeyDown={(e) => e.key === 'Enter' && confirmarExclusao()}
            />
          </label>
          {avisoExcluir && <p className="error" role="alert">{avisoExcluir.texto}</p>}
        </ConfirmDialog>
      )}
    </div>
  );
}
