export interface Marca {
  // no hero cada palavra vai pra uma linha
  nome: string;
  slogan: string;
}

export interface Acao {
  texto: string;
  link: string;
  estilo?: 'primario' | 'ghost';
}

export interface Item {
  nome: string;
  detalhe?: string;
  valor?: string;
}

export interface Categoria {
  id: string;
  nome: string;
}

export interface Servico {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  duracaoMin: number;
  categoria: Categoria['id'];
}

// 0 = domingo ... 6 = sábado, com [abre, fecha] em "HH:MM"
export type HorarioSemanal = Partial<Record<0 | 1 | 2 | 3 | 4 | 5 | 6, [string, string]>>;

export interface Barbeiro {
  id: string;
  nome: string;
  // caminho dentro de /public
  foto: string;
  descricao: string;
  especialidades: string[];
  avaliacao: number;
  totalAvaliacoes: number;
  atendimento: HorarioSemanal;
  // ids dos serviços que ele faz; sem a lista, faz todos
  servicos?: Servico['id'][];
}

export interface SecaoHero {
  id: string;
  tipo: 'hero';
  rotulo: string;
  dica: string;
}

export interface SecaoConteudo {
  id: string;
  tipo: 'conteudo';
  rotulo: string;
  titulo: string;
  texto?: string;
  itens?: Item[];
  acoes?: Acao[];
  rodape?: string;
}

export interface Plano {
  id: string;
  nome: string;
  // valor mensal
  preco: number;
  descricao: string;
  beneficios: string[];
  // texto do selo, ex: "Mais escolhido"
  destaque?: string;
  cor: string;
}

export interface Avaliacao {
  nome: string;
  nota: number;
  texto: string;
  // AAAA-MM-DD
  data: string;
  barbeiroId?: string;
}

// seções que montam o conteúdo a partir dos dados
export interface SecaoLista {
  id: string;
  tipo: 'barbeiros' | 'servicos' | 'planos' | 'horarios';
  rotulo: string;
  titulo: string;
  texto?: string;
}

export type SecaoInterna = SecaoConteudo | SecaoLista;
export type Secao = SecaoHero | SecaoInterna;

export interface DadosBarbearia {
  marca: Marca;
  // foto de fundo do main
  fotoFundo: { src: string; alt: string };
  agendamento: Acao;
  categorias: Categoria[];
  servicos: Servico[];
  barbeiros: Barbeiro[];
  formasPagamento: string[];
  planos: Plano[];
  funcionamento: HorarioSemanal;
  endereco: string;
  rodape: string;
  avaliacoes: Avaliacao[];
  // a ordem importa: hero primeiro, depois o main (a animação conta com isso)
  secoes: [SecaoHero, SecaoConteudo, ...SecaoInterna[]];
}

export type StatusAgendamento = 'marcado' | 'confirmado' | 'concluido' | 'cancelado';

export interface Agendamento {
  id: string;
  // telefone de quem agendou (só dígitos)
  usuario: string;
  barbeiroId: string;
  servicoId: string;
  // AAAA-MM-DD
  data: string;
  horario: string;
  pagamento: string;
  observacao?: string;
  total: number;
  criadoEm: string;
  canceladoEm?: string;
}

export interface Usuario {
  nome: string;
  // só dígitos, com DDD
  telefone: string;
  // hash simples, só pra não salvar a senha em texto puro
  senhaHash: string;
  criadoEm: string;
}
