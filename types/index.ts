// Pagination types
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}


export interface SyncMetadata {
  created_at: string;
  updated_at: string;
  updated_by?: string | null;
  device_id: string;
  version: number;
  is_deleted: number;
  sync_status: 'pending' | 'synced' | 'error';
}

export interface Workshop extends SyncMetadata {
  id: string;
  name: string;
  address?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface VehicleStatusRecord extends SyncMetadata {
  id: string;
  name: string;
  code: string; // Stable semantic key: AVAILABLE, RENTED, MAINTENANCE, UNAVAILABLE, STOLEN, TOTALED
  color: string;
  is_default: boolean | number;
}

export interface Role extends SyncMetadata {
  id: string;
  name: string;
  permissions: string[]; // e.g. ['dashboard', 'veiculos', 'oficina', 'clientes', 'alugueis', 'financeiro', 'configuracoes']
}

export interface AppUser extends SyncMetadata {
  id: string;
  name: string;
  email: string;
  role_id: string;
  role?: Role; // Populated from join
  password?: string;
}

export interface Customer extends SyncMetadata {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  cpf: string;
  active_contract: boolean;
  balance_due: number;
  last_payment_date?: string | null;
  email?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  cnh?: string | null;
  cnh_category?: string | null;
}

export interface VehicleModel extends SyncMetadata {
  id: string;
  name: string;
  brand: string;
  status: 'ACTIVE' | 'INACTIVE';
  image_url?: string | null;
}

export interface Vehicle extends SyncMetadata {
  id: string;
  plate: string;
  chassi?: string | null;
  model_id: string;
  model?: VehicleModel; // Populated from join
  year: number;
  status_id: string;
  vehicleStatus?: VehicleStatusRecord; // Populated from join
  mileage: number;
  current_renter_id?: string | null;
  default_monthly_rate: number;
}

export interface RentalContract extends SyncMetadata {
  id: string;
  user_id: string;
  vehicle_id: string;
  customer_id: string;
  start_date: string;
  end_date?: string | null;
  monthly_rate: number;
  status: 'ACTIVE' | 'ENDED';
}

export interface Contract extends SyncMetadata {
  id: string;
  rental_id: string;
  template_id: string;
  template_name: string;
  form_data: Record<string, string>; // variáveis preenchidas do template
  status: ContratoStatus;
}

export type ContratoFieldType = 'text' | 'textarea' | 'date' | 'number' | 'select' | 'cpf' | 'phone';

export interface ContratoTemplateField {
  key: string;
  label: string;
  type: ContratoFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
  /** Caminho para pré-preencher: 'customer.name', 'customer.cpf', 'vehicle.plate' */
  source?: string;
}

export interface ContratoTemplate {
  id: string;
  name: string;
  description: string;
  /** Caminho relativo ao /public para o arquivo .docx de template */
  templateFile: string;
  fields: ContratoTemplateField[];
}

export type ContratoStatus = 'rascunho' | 'ativo' | 'encerrado' | 'cancelado';

export interface ContratoGerado {
  id: string;
  template_id: string;
  template_name: string;
  data: Record<string, string | number>;
  status: ContratoStatus;
  customer_id?: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export type MaintenanceType = 'Revisão Periódica' | 'Corretiva/Quebra' | 'Troca de Óleo' | 'Troca de Pneu' | 'Vistoria de Entrada';

export interface MaintenanceRecord extends SyncMetadata {
  id: string;
  user_id: string;
  vehicle_id: string;
  workshop_id?: string | null;
  vehicle_plate: string;
  entry_date: string;
  completion_date?: string | null;
  mechanic_name: string;
  description: string;
  type: MaintenanceType;
  cost: number;
  status: 'OPEN' | 'COMPLETED';
  service_order_url?: string | null;
}

export type UnavailableStatusType = 'STOLEN' | 'TOTAL_LOSS';

export interface UnavailableVehicle extends SyncMetadata {
  id: string;
  user_id: string;
  vehicle_id: string;
  status_type: UnavailableStatusType;
  reason: string;
}

export interface Document extends SyncMetadata {
  id: string;
  parent_id: string;
  origin_type: 'CONTRACT' | 'WORKSHOP' | 'UNAVAILABLE_VEHICLE' | 'SERVICE_ORDER';
  file_url: string;
}
