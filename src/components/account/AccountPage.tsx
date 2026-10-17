'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { barbearia } from '@/data/barbearia';
import { sair } from '@/lib/auth';
import { useUsuario } from '@/hooks/useLocalData';
import { LoginModal } from '../auth/LoginModal';
import { ConfirmDialog } from '../ConfirmDialog';
import { AccountMenu } from './AccountMenu';
import { BookingsList } from './BookingsList';
import { ProfileTab } from './ProfileTab';

interface Props {
  aba: 'perfil' | 'agendamentos';
}

export function AccountPage({ aba }: Props) {
  const usuario = useUsuario();
  const router = useRouter();
  const [pronto, setPronto] = useState(false); // localStorage só existe no client
  const [confirmarSaida, setConfirmarSaida] = useState(false);
  useEffect(() => setPronto(true), []);

  const cancelarSaida = useCallback(() => setConfirmarSaida(false), []);
  const voltarAoSite = useCallback(() => router.push('/'), [router]);
  const { marca } = barbearia;

  return (
    <div className="account-shell">
      <header className="account-header">
        <Link href="/" className="logo static">
          <span>{marca.nome.split(' ').slice(0, -1).join(' ')}</span> {marca.nome.split(' ').slice(-1)[0]}
        </Link>
        <div className="header-actions">
          <Link href="/#barbeiros" className="btn ghost">Agendar</Link>
          {pronto && usuario && <AccountMenu usuario={usuario} onSair={() => setConfirmarSaida(true)} />}
        </div>
      </header>

      <main className="account">
        <Link href="/" className="back-link">← Voltar ao site</Link>
        <h1 className="account-title">Minha conta</h1>

        {pronto && usuario && (
          <>
            <nav className="tabs" aria-label="Conta">
              <Link href="/conta/perfil" className={aba === 'perfil' ? 'on' : undefined} aria-current={aba === 'perfil' ? 'page' : undefined}>
                Perfil
              </Link>
              <Link
                href="/conta/agendamentos"
                className={aba === 'agendamentos' ? 'on' : undefined}
                aria-current={aba === 'agendamentos' ? 'page' : undefined}
              >
                Agendamentos
              </Link>
            </nav>

            {aba === 'perfil' ? (
              <ProfileTab usuario={usuario} onContaExcluida={voltarAoSite} onSair={() => setConfirmarSaida(true)} />
            ) : (
              <BookingsList
                usuario={usuario}
                barbeiros={barbearia.barbeiros}
                servicos={barbearia.servicos}
                onAgendarNovamente={(b, s) => router.push(`/?agendar=${b}&servico=${s}#barbeiros`)}
              />
            )}

            <p className="muted small account-note">
              Site de exemplo: conta e agendamentos ficam salvos somente neste navegador (dados locais).
            </p>
          </>
        )}

        {pronto && !usuario && (
          <div className="account-empty">
            <p>Entre para ver seu perfil e seus agendamentos.</p>
            <LoginModal motivo="Entre para acessar sua conta." onClose={voltarAoSite} onSuccess={() => undefined} />
          </div>
        )}
      </main>

      {confirmarSaida && (
        <ConfirmDialog
          titulo="Deseja realmente sair?"
          confirmar="Sair"
          perigo
          onConfirm={() => {
            sair();
            setConfirmarSaida(false);
            router.push('/');
          }}
          onCancel={cancelarSaida}
        >
          <p className="muted">Seus agendamentos continuam salvos neste navegador.</p>
        </ConfirmDialog>
      )}
    </div>
  );
}
