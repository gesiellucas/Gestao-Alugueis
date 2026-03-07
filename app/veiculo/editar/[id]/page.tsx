import { VeiculoEditarPage } from '../../../../views/VeiculoEditarPage';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function VeiculoEditar() {
  return <VeiculoEditarPage />;
}
