'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { DadosBarbearia } from '@/types/barbearia';
import { BarberPoleEngine, type NavState } from '@/lib/animation/BarberPoleEngine';
import { Header } from './Header';
import { SectionDots } from './SectionDots';
import { Hero } from './Hero';
import { ContentSection } from './ContentSection';
import { BarbersSection } from './BarbersSection';
import { ServicesSection } from './ServicesSection';
import { PlansSection } from './PlansSection';
import { HoursSection } from './HoursSection';
import { BookingModal } from './booking/BookingModal';
import { LoginModal } from './auth/LoginModal';
import { AccountMenu } from './account/AccountMenu';
import { ConfirmDialog } from './ConfirmDialog';
import { useRouter } from 'next/navigation';
import { useUsuario } from '@/hooks/useLocalData';
import { sair } from '@/lib/auth';

interface Props {
  data: DadosBarbearia;
}

export function BarberSite({ data }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const engineRef = useRef<BarberPoleEngine | null>(null);
  const [nav, setNav] = useState<NavState>({ target: 0, arrived: 0 });
  const [servicoPendente, setServicoPendente] = useState<string | null>(null);
  const [barbeiroAberto, setBarbeiroAberto] = useState<string | null>(null);
  const usuario = useUsuario();
  const [login, setLogin] = useState<{ motivo?: string; barbeiroDepois?: string } | null>(null);
  const [confirmarSaida, setConfirmarSaida] = useState(false);
  const router = useRouter();

  const [hero, ...internas] = data.secoes;
  const ids = data.secoes.map((s) => s.id).join('|');
  const indexOf = (id: string) => data.secoes.findIndex((s) => s.id === id);

  // A animação roda fora do React (senão seria um render por frame).
  // O engine cuida do canvas, da navegação entre seções e de alguns estilos inline.
  useEffect(() => {
    const canvas = canvasRef.current;
    const main = mainRef.current;
    if (!canvas || !main) return;

    let engine: BarberPoleEngine | null = null;
    try {
      engine = new BarberPoleEngine({
        canvas,
        sectionIds: ids.split('|'),
        onNavigate: setNav,
        dom: {
          brand: main.querySelector<HTMLElement>('[data-brand]'),
          letters: Array.from(main.querySelectorAll<HTMLElement>('[data-letter]')),
          heroSub: main.querySelector<HTMLElement>('[data-hero-sub]'),
          heroHint: main.querySelector<HTMLElement>('[data-hero-hint]'),
          introCard: main.querySelector<HTMLElement>('[data-intro-card]'),
          logo: logoRef.current,
          photo: photoRef.current,
        },
      });
      engine.start();
      engineRef.current = engine;
    } catch (err) {
      // sem WebGL: vira uma página normal com scroll
      console.warn('WebGL indisponível', err);
      document.documentElement.classList.add('no-webgl');
    }
    return () => {
      engine?.dispose();
      engineRef.current = null;
    };
  }, [ids]);

  // com modal aberto o scroll/teclado não pode trocar de seção
  const algumPainel = (barbeiroAberto !== null && usuario !== null) || login !== null || confirmarSaida;
  useEffect(() => {
    engineRef.current?.setInputLocked(algumPainel);
  }, [algumPainel]);

  const goTo = useCallback(
    (i: number) => {
      if (engineRef.current) engineRef.current.go(i);
      else document.getElementById(data.secoes[i].id)?.scrollIntoView();
    },
    [data.secoes],
  );

  const escolherServico = (servicoId: string) => {
    setServicoPendente(servicoId);
    goTo(indexOf('barbeiros'));
  };

  const fecharAgendamento = useCallback(() => setBarbeiroAberto(null), []);
  const fecharLogin = useCallback(() => setLogin(null), []);
  const cancelarSaida = useCallback(() => setConfirmarSaida(false), []);

  // só a home trava o scroll do body
  useEffect(() => {
    document.documentElement.classList.add('experiencia');
    return () => document.documentElement.classList.remove('experiencia');
  }, []);

  // "Agendar de novo" na conta manda pra /?agendar=<barbeiro>&servico=<id>#barbeiros
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const b = q.get('agendar');
    if (!b) return;
    const sv = q.get('servico');
    if (sv) setServicoPendente(sv);
    if (data.barbeiros.some((x) => x.id === b)) setBarbeiroAberto(b);
    history.replaceState(null, '', location.pathname + location.hash);
  }, [data.barbeiros]);

  // sem login, pede pra entrar e depois já abre o agendamento
  const escolherBarbeiro = (id: string) => {
    if (usuario) {
      setBarbeiroAberto(id);
      return;
    }
    const nome = data.barbeiros.find((b) => b.id === id)?.nome;
    setLogin({ motivo: `Entre para agendar com ${nome}.`, barbeiroDepois: id });
  };

  const servicoPendenteObj = data.servicos.find((s) => s.id === servicoPendente) ?? null;
  const barbeiro = data.barbeiros.find((b) => b.id === barbeiroAberto) ?? null;
  const servicoInicial =
    barbeiro && servicoPendente && (!barbeiro.servicos || barbeiro.servicos.includes(servicoPendente))
      ? servicoPendente
      : undefined;

  return (
    <>
      <canvas ref={canvasRef} className="gl" aria-hidden="true" />
      <div ref={photoRef} className="photo" aria-hidden="true">
        <Image
          src={data.fotoFundo.src}
          alt={data.fotoFundo.alt}
          fill
          sizes="100vw"
          quality={75}
          // se a foto falhar, fica só o fundo preto
          onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
        />
      </div>

      <Header
        marca={data.marca}
        agendamento={data.agendamento}
        logoRef={logoRef}
        conta={
          usuario ? (
            <AccountMenu usuario={usuario} onSair={() => setConfirmarSaida(true)} />
          ) : (
            <button type="button" className="btn ghost" onClick={() => setLogin({})}>
              Entrar
            </button>
          )
        }
      />
      <SectionDots secoes={data.secoes} active={nav.target} onSelect={goTo} />

      <main ref={mainRef}>
        <Hero secao={hero} marca={data.marca} />
        {internas.map((secao, i) => {
          const index = i + 1;
          const active = nav.arrived === index;
          const light = index >= 2 && index % 2 === 0;

          if (secao.tipo === 'barbeiros') {
            return (
              <BarbersSection
                key={secao.id}
                secao={secao}
                barbeiros={data.barbeiros}
                active={active}
                light={light}
                servicoPendente={servicoPendenteObj}
                onLimparServico={() => setServicoPendente(null)}
                onEscolher={escolherBarbeiro}
              />
            );
          }
          if (secao.tipo === 'servicos') {
            return (
              <ServicesSection
                key={secao.id}
                secao={secao}
                servicos={data.servicos}
                categorias={data.categorias}
                active={active}
                light={light}
                onEscolher={escolherServico}
              />
            );
          }
          if (secao.tipo === 'planos') {
            return <PlansSection key={secao.id} secao={secao} planos={data.planos} active={active} light={light} />;
          }
          if (secao.tipo === 'horarios') {
            return (
              <HoursSection
                key={secao.id}
                secao={secao}
                funcionamento={data.funcionamento}
                endereco={data.endereco}
                rodape={data.rodape}
                avaliacoes={data.avaliacoes}
                barbeiros={data.barbeiros}
                active={active}
                light={light}
                onPedirLogin={() => setLogin({ motivo: 'Entre para comentar e avaliar.' })}
              />
            );
          }
          if (secao.tipo === 'conteudo') {
            return <ContentSection key={secao.id} secao={secao} active={active} intro={index === 1} light={light} />;
          }
          return null;
        })}
      </main>

      {barbeiro && usuario && (
        <BookingModal
          key={barbeiro.id}
          usuario={usuario}
          barbeiro={barbeiro}
          servicos={data.servicos}
          categorias={data.categorias}
          formasPagamento={data.formasPagamento}
          servicoInicial={servicoInicial}
          onClose={fecharAgendamento}
          onConfirmado={() => setServicoPendente(null)}
          onVerAgendamentos={() => {
            setBarbeiroAberto(null);
            router.push('/conta/agendamentos');
          }}
        />
      )}

      {login && (
        <LoginModal
          motivo={login.motivo}
          onClose={fecharLogin}
          onSuccess={() => {
            const depois = login.barbeiroDepois;
            setLogin(null);
            if (depois) setBarbeiroAberto(depois);
          }}
        />
      )}

      {confirmarSaida && (
        <ConfirmDialog
          titulo="Deseja realmente sair?"
          confirmar="Sair"
          perigo
          onConfirm={() => {
            sair();
            setConfirmarSaida(false);
            setBarbeiroAberto(null);
          }}
          onCancel={cancelarSaida}
        >
          <p className="muted">Seus agendamentos continuam salvos neste navegador.</p>
        </ConfirmDialog>
      )}
    </>
  );
}
