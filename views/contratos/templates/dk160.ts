import { ContratoTemplate } from '../../../types';

/**
 * Template: Contrato Compra Facilitada DK160
 * Arquivo original: public/contratos/CONTRATO COMPRA FACILITADA DK160.docx
 *
 * Variáveis automáticas (preenchidas pelo sistema):
 *   nome_cliente, cpf_cliente, telefone_cliente, email_cliente → cliente
 *   cnh_cliente, categoria_cnh_cliente → CNH do cliente
 *   endereço_cliente, bairro_cliente, cidade_cliente → endereço do cliente
 *   endereco_completo_cliente → junção "Rua e Nº, Bairro, Cidade-Estado"
 *   placa_veiculo, chassi_veiculo, modelo_veiculo, marca_veiculo, ano_veiculo → veículo
 *   dia_contrato, mes_contrato_extenso, ano_contrato → data atual
 *
 * Variáveis manuais:
 *   valor_recebido   → valor da caução
 *   forma_pagamento  → forma de pagamento da caução (texto livre)
 */
export const templateDK160: ContratoTemplate = {
  id: 'compra-facilitada-dk160',
  name: 'Contrato Compra Facilitada DK160',
  description: 'Tarifário, termo de responsabilidade de multa, recebimento de caução e declaração de monitoramento.',
  templateFile: '/contratos/CONTRATO COMPRA FACILITADA DK160.docx',
  fields: [
    // ── Dados do cliente (pré-preenchidos, editáveis) ──────────────────────
    {
      key: 'nome_cliente',
      label: 'Nome do Locatário',
      type: 'text',
      required: true,
      source: 'customer.name',
    },
    {
      key: 'cpf_cliente',
      label: 'CPF do Locatário',
      type: 'cpf',
      required: true,
      source: 'customer.cpf',
    },
    {
      key: 'endereço_cliente',
      label: 'Endereço (rua e número)',
      type: 'text',
      required: true,
      placeholder: 'Ex: Rua das Flores, 123',
      source: 'customer.address',
    },
    {
      key: 'bairro_cliente',
      label: 'Bairro',
      type: 'text',
      required: true,
      placeholder: 'Ex: Centro',
      source: 'customer.neighborhood',
    },
    {
      key: 'cidade_cliente',
      label: 'Cidade-Estado',
      type: 'text',
      required: true,
      placeholder: 'Ex: Ribeirão Preto-SP',
      source: 'customer.cityState',
    },
    // ── Dados do veículo (pré-preenchidos, editáveis) ──────────────────────
    {
      key: 'placa_veiculo',
      label: 'Placa do Veículo',
      type: 'text',
      required: true,
      source: 'vehicle.plate',
    },
    {
      key: 'modelo_veiculo',
      label: 'Modelo',
      type: 'text',
      required: false,
      source: 'vehicle.model',
    },
    {
      key: 'marca_veiculo',
      label: 'Marca',
      type: 'text',
      required: false,
      source: 'vehicle.brand',
    },
    {
      key: 'ano_veiculo',
      label: 'Ano',
      type: 'text',
      required: false,
      source: 'vehicle.year',
    },
    {
      key: 'chassi_veiculo',
      label: 'Chassi',
      type: 'text',
      required: true,
      placeholder: 'Ex: 9C2KC16009R200001',
      source: 'vehicle.chassi',
    },
    // ── Dados adicionais do cliente ────────────────────────────────────────
    {
      key: 'cnh_cliente',
      label: 'CNH',
      type: 'text',
      required: false,
      placeholder: 'Ex: 12345678900',
      source: 'customer.cnh',
    },
    {
      key: 'categoria_cnh_cliente',
      label: 'Categoria da CNH',
      type: 'select',
      required: false,
      options: ['A', 'AB', 'AC', 'AD', 'AE'],
      source: 'customer.cnh_category',
    },
    {
      key: 'email_cliente',
      label: 'E-mail',
      type: 'text',
      required: false,
      placeholder: 'Ex: cliente@email.com',
      source: 'customer.email',
    },
    {
      key: 'telefone_cliente',
      label: 'Telefone',
      type: 'phone',
      required: false,
      source: 'customer.phone',
    },
    {
      key: 'endereco_completo_cliente',
      label: 'Endereço Completo',
      type: 'text',
      required: false,
      placeholder: 'Ex: Rua das Flores, 123, Centro, Ribeirão Preto-SP',
      source: 'customer.addressFull',
    },
    // ── Período do contrato ────────────────────────────────────────────────
    {
      key: 'data_inicio_contrato',
      label: 'Data de Início',
      type: 'date',
      required: false,
    },
    {
      key: 'data_final_contrato',
      label: 'Data de Encerramento',
      type: 'date',
      required: false,
    },
    // ── Caução ─────────────────────────────────────────────────────────────
    {
      key: 'valor_recebido',
      label: 'Valor da Caução',
      type: 'text',
      required: true,
      placeholder: 'Ex: R$ 700,00',
    },
    {
      key: 'forma_pagamento',
      label: 'Forma de Pagamento da Caução',
      type: 'textarea',
      required: true,
      placeholder: 'Ex: Pix para chave CPF 000.000.000-00',
    },
  ],
};
