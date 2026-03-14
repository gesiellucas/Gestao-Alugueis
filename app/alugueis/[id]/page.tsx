import { AluguelDetalhePage } from '../../../views/alugueis/template/AluguelDetalhePage';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function AluguelDetalhe() {
  return <AluguelDetalhePage />;
}
