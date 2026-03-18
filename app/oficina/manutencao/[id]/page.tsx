import { OficinaManutencaoDetalhe } from '../../../../views/oficina/template/OficinaManutencaoDetalhe';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function OficinaManutencaoDetalhePage() {
  return <OficinaManutencaoDetalhe />;
}
