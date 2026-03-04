import { AluguelNovoPage } from '../../../../views/AluguelNovoPage';

export function generateStaticParams() {
  return [{ vehicleId: 'placeholder' }];
}

export default function AluguelNovo() {
  return <AluguelNovoPage />;
}
