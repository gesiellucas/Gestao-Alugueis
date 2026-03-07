import { ClienteEditarPage } from '../../../../views/ClienteEditarPage';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function ClienteEditar() {
  return <ClienteEditarPage />;
}
