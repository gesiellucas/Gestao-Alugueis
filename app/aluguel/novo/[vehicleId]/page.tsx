import { AluguelNovoPage } from '../../../../views/AluguelNovoPage';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return [{ vehicleId: 'placeholder' }];
}

export default function AluguelNovo() {
  return <AluguelNovoPage />;
}
