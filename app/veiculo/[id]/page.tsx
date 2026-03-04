import { VeiculoDetalhePage } from '../../../views/VeiculoDetalhePage';

export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function VeiculoDetalhe() {
  return <VeiculoDetalhePage />;
}
