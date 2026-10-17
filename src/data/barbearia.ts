import type { DadosBarbearia } from '@/types/barbearia';

// Todo o conteúdo do site vem daqui (dados fictícios).
// Imagens ficam em /public/img.
export const barbearia: DadosBarbearia = {
  marca: {
    nome: 'Barber Navalha',
    slogan: 'Barbearia clássica · desde 2012',
  },

  fotoFundo: {
    // foto de Joshua Lawrence no Unsplash; trocar por uma local, ex: /img/barbearia.jpg
    src: 'https://images.unsplash.com/photo-1621645582931-d1d3e6564943?auto=format&fit=crop&w=1920&q=70',
    alt: 'Interior da barbearia com cadeira clássica',
  },

  agendamento: { texto: 'Agendar', link: '#barbeiros' },

  categorias: [
    { id: 'cabelo', nome: 'Cabelo' },
    { id: 'barba', nome: 'Barba' },
    { id: 'combos', nome: 'Combos' },
    { id: 'tratamentos', nome: 'Tratamentos' },
  ],

  servicos: [
    { id: 'corte-social', nome: 'Corte social', descricao: 'Tesoura e máquina, acabamento na navalha.', preco: 45, duracaoMin: 40, categoria: 'cabelo' },
    { id: 'degrade', nome: 'Degradê', descricao: 'Navalhado ou na zero, com desenho opcional.', preco: 50, duracaoMin: 45, categoria: 'cabelo' },
    { id: 'tesoura', nome: 'Corte na tesoura', descricao: 'Para cabelos médios e longos.', preco: 60, duracaoMin: 50, categoria: 'cabelo' },
    { id: 'infantil', nome: 'Corte infantil', descricao: 'Até 12 anos, com paciência e capricho.', preco: 40, duracaoMin: 30, categoria: 'cabelo' },
    { id: 'barba-completa', nome: 'Barba completa', descricao: 'Toalha quente, navalha e óleo finalizador.', preco: 40, duracaoMin: 30, categoria: 'barba' },
    { id: 'barba-desenhada', nome: 'Barba desenhada', descricao: 'Contorno preciso e alinhamento do formato.', preco: 35, duracaoMin: 25, categoria: 'barba' },
    { id: 'pezinho', nome: 'Pezinho e sobrancelha', descricao: 'Manutenção rápida entre os cortes.', preco: 20, duracaoMin: 15, categoria: 'barba' },
    { id: 'corte-barba', nome: 'Corte + barba', descricao: 'O combo da casa, com toalha quente.', preco: 80, duracaoMin: 75, categoria: 'combos' },
    { id: 'completo', nome: 'Dia do noivo', descricao: 'Corte, barba, hidratação e massagem facial.', preco: 150, duracaoMin: 120, categoria: 'combos' },
    { id: 'hidratacao', nome: 'Hidratação capilar', descricao: 'Tratamento para fios ressecados.', preco: 35, duracaoMin: 25, categoria: 'tratamentos' },
    { id: 'pigmentacao', nome: 'Pigmentação de barba', descricao: 'Preenche falhas com acabamento natural.', preco: 45, duracaoMin: 30, categoria: 'tratamentos' },
  ],

  barbeiros: [
    {
      id: 'rafael',
      nome: 'Rafael Souza',
      foto: '/img/barbeiros/rafael.svg',
      descricao: 'Especialista em degradê e desenhos. 12 anos de cadeira.',
      especialidades: ['Degradê', 'Desenhos'],
      avaliacao: 4.9,
      totalAvaliacoes: 184,
      atendimento: { 1: ['09:00', '19:00'], 2: ['09:00', '19:00'], 3: ['09:00', '19:00'], 4: ['09:00', '20:00'], 5: ['09:00', '20:00'], 6: ['08:00', '17:00'] },
    },
    {
      id: 'diego',
      nome: 'Diego Lima',
      foto: '/img/barbeiros/diego.svg',
      descricao: 'Barba, visagismo e toalha quente. O mestre da navalha.',
      especialidades: ['Barba', 'Visagismo'],
      avaliacao: 4.8,
      totalAvaliacoes: 132,
      atendimento: { 2: ['10:00', '20:00'], 3: ['10:00', '20:00'], 4: ['10:00', '20:00'], 5: ['10:00', '20:00'], 6: ['08:00', '18:00'] },
      servicos: ['barba-completa', 'barba-desenhada', 'pezinho', 'corte-barba', 'completo', 'pigmentacao', 'corte-social'],
    },
    {
      id: 'marcos',
      nome: 'Marcos Alves',
      foto: '/img/barbeiros/marcos.svg',
      descricao: 'Cortes clássicos na tesoura, do social ao executivo.',
      especialidades: ['Tesoura', 'Clássicos'],
      avaliacao: 5.0,
      totalAvaliacoes: 211,
      atendimento: { 1: ['09:00', '18:00'], 2: ['09:00', '18:00'], 3: ['09:00', '18:00'], 4: ['09:00', '18:00'], 5: ['09:00', '18:00'] },
    },
  ],

  formasPagamento: ['Pix', 'Cartão de crédito', 'Cartão de débito', 'Dinheiro'],

  planos: [
    {
      id: 'corte',
      nome: 'Plano Corte',
      preco: 120,
      descricao: 'Para quem gosta do cabelo sempre alinhado.',
      beneficios: ['Cortes ilimitados no mês', 'Agendamento prioritário', 'Lavagem inclusa'],
      cor: '#4a2f22', // marrom couro
    },
    {
      id: 'completo',
      nome: 'Plano Completo',
      preco: 190,
      descricao: 'Cabelo e barba impecáveis o mês inteiro.',
      beneficios: ['Cortes e barbas ilimitados', 'Toalha quente em toda barba', '1 hidratação por mês', '10% em produtos'],
      destaque: 'Mais escolhido',
      cor: '#5e1b24', // bordô
    },
    {
      id: 'barba',
      nome: 'Plano Barba',
      preco: 100,
      descricao: 'A barba desenhada e hidratada toda semana.',
      beneficios: ['Barbas ilimitadas no mês', 'Pezinho e sobrancelha inclusos', 'Óleo finalizador'],
      cor: '#1f3a2e', // verde garrafa
    },
  ],

  funcionamento: {
    1: ['09:00', '20:00'],
    2: ['09:00', '20:00'],
    3: ['09:00', '20:00'],
    4: ['09:00', '20:00'],
    5: ['09:00', '20:00'],
    6: ['08:00', '18:00'],
  },
  endereco: 'Rua Exemplo, 123 · Centro · São Paulo',
  rodape: '© 2026 Barber Navalha · site de exemplo',

  avaliacoes: [
    { nome: 'Lucas M.', nota: 5, texto: 'Melhor degradê da cidade e pontualidade total. Nunca esperei mais de 5 minutos.', data: '2026-10-12', barbeiroId: 'rafael' },
    { nome: 'André P.', nota: 5, texto: 'A barba com toalha quente do Diego é outro nível. Saí renovado.', data: '2026-10-08', barbeiroId: 'diego' },
    { nome: 'Felipe R.', nota: 5, texto: 'Ambiente top, café bom e atendimento sem pressa. Virei cliente fixo.', data: '2026-10-03' },
    { nome: 'Bruno C.', nota: 4, texto: 'Corte na tesoura muito bem feito. Só achei o sábado bem cheio.', data: '2026-09-27', barbeiroId: 'marcos' },
    { nome: 'Thiago S.', nota: 5, texto: 'Fiz o Dia do Noivo e foi perfeito. Recomendo demais.', data: '2026-09-20', barbeiroId: 'rafael' },
    { nome: 'Gustavo L.', nota: 5, texto: 'Agendar pelo site é rápido e o lembrete ajuda muito.', data: '2026-09-14' },
  ],

  secoes: [
    { id: 'inicio', tipo: 'hero', rotulo: 'Início', dica: 'Role para entrar' },

    {
      id: 'sobre',
      tipo: 'conteudo',
      rotulo: 'Barbearia clássica',
      titulo: 'Corte de respeito, sem pressa.',
      texto:
        'Tesoura, navalha e toalha quente. Atendimento com hora marcada, café passado na hora e barbeiros que conhecem cada cliente pelo nome.',
      acoes: [
        { texto: 'Agendar horário', link: '#barbeiros' },
        { texto: 'Ver serviços', link: '#servicos', estilo: 'ghost' },
      ],
    },

    {
      id: 'barbeiros',
      tipo: 'barbeiros',
      rotulo: 'Equipe',
      titulo: 'Escolha seu barbeiro',
      texto: 'Toque no barbeiro para ver os horários e agendar.',
    },

    {
      id: 'servicos',
      tipo: 'servicos',
      rotulo: 'Serviços',
      titulo: 'Serviços e preços',
      texto: 'Escolha um serviço e depois o barbeiro.',
    },

    {
      id: 'planos',
      tipo: 'planos',
      rotulo: 'Assinatura',
      titulo: 'Planos mensais',
      texto: 'Pague uma vez por mês e venha quantas vezes quiser.',
    },

    {
      id: 'horarios',
      tipo: 'horarios',
      rotulo: 'Funcionamento',
      titulo: 'Horários',
    },
  ],
};
