import { OficinaDetalhePage } from '../../../views/oficina/template/OficinaDetalhePage';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function OficinaDetalhe() {
  return <OficinaDetalhePage />;
}
