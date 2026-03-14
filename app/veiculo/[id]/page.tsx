import { VeiculoDetalhePage } from '../../../views/veiculos/template/VeiculoDetalhePage';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function VeiculoDetalhe() {
  return <VeiculoDetalhePage />;
}
