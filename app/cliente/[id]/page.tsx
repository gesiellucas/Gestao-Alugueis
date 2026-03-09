import { ClienteDetalhePage } from '../../../views/clientes/template/ClienteDetalhePage';

// Required by Next.js static export for dynamic segments.
// Routing is handled client-side at runtime via useParams().
export const dynamic = 'force-static';

export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function ClienteDetalhe() {
  return <ClienteDetalhePage />;
}
