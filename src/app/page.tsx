import { BarberSite } from '@/components/BarberSite';
import { barbearia } from '@/data/barbearia';

export default function Home() {
  return <BarberSite data={barbearia} />;
}
