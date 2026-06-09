'use client';
import { useEffect, useState } from 'react';
import { ContratosPage } from '../../views/contratos/template/ContratosPage';
import { supabaseContractsApi } from '../../database/api/supabase/contracts';
import { Contract } from '../../types';

export default function Contratos() {
  const [contratos, setContratos] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabaseContractsApi.getAll()
      .then(setContratos)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return <ContratosPage contratos={contratos} loading={loading} />;
}
