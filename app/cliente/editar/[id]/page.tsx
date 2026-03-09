import { ClienteEditarPage } from '../../../../views/clientes/template/ClienteEditarPage';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function ClienteEditar() {
  return <ClienteEditarPage />;
}
