import { ClienteEditarPage } from '../../../../views/ClienteEditarPage';

export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function ClienteEditar() {
  return <ClienteEditarPage />;
}
