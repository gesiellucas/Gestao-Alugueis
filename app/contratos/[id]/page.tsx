import { ContratoDetalhePage } from '../../../views/contratos/template/ContratoDetalhePage';

export const dynamic = 'force-static';
export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default async function ContratoDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ContratoDetalhePage contractId={id} />;
}
