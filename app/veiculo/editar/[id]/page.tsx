import { VeiculoEditarPage } from '../../../../views/veiculos/template/VeiculoEditarPage';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function VeiculoEditar() {
  return <VeiculoEditarPage />;
}
