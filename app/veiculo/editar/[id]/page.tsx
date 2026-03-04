import { VeiculoEditarPage } from '../../../../views/VeiculoEditarPage';

export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function VeiculoEditar() {
  return <VeiculoEditarPage />;
}
