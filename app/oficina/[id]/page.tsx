import { OficinaDetalhePage } from '../../../views/OficinaDetalhePage';

export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function OficinaDetalhe() {
  return <OficinaDetalhePage />;
}
