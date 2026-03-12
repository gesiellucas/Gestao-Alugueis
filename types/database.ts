export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      workshops: {
        Row: {
          id: number;
          name: string;
          address: string | null;
          status: 'ACTIVE' | 'INACTIVE';
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          address?: string | null;
          status?: 'ACTIVE' | 'INACTIVE';
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          address?: string | null;
          status?: 'ACTIVE' | 'INACTIVE';
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      app_users: {
        Row: {
          id: number;
          name: string;
          email: string;
          role_id: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          email: string;
          role_id: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          email?: string;
          role_id?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: number;
          user_id: number;
          name: string;
          phone: string | null;
          cpf: string | null;
          active_contract: boolean;
          balance_due: number;
          last_payment_date: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: number;
          user_id: number;
          name: string;
          phone?: string | null;
          cpf?: string | null;
          active_contract?: boolean;
          balance_due?: number;
          last_payment_date?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: number;
          user_id?: number;
          name?: string;
          phone?: string | null;
          cpf?: string | null;
          active_contract?: boolean;
          balance_due?: number;
          last_payment_date?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      vehicle_models: {
        Row: {
          id: number;
          name: string;
          brand: string;
          image_url: string | null;
          status: 'ACTIVE' | 'INACTIVE';
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          brand: string;
          image_url?: string | null;
          status?: 'ACTIVE' | 'INACTIVE';
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          brand?: string;
          image_url?: string | null;
          status?: 'ACTIVE' | 'INACTIVE';
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      vehicle_statuses: {
        Row: {
          id: number;
          name: string;
          color: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          color?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          color?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      vehicles: {
        Row: {
          id: number;
          plate: string;
          model_id: number;
          year: number;
          status_id: number;
          mileage: number;
          current_renter_id: number | null;
          default_monthly_rate: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: number;
          plate: string;
          model_id: number;
          year: number;
          status_id: number;
          mileage?: number;
          current_renter_id?: number | null;
          default_monthly_rate?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: number;
          plate?: string;
          model_id?: number;
          year?: number;
          status_id?: number;
          mileage?: number;
          current_renter_id?: number | null;
          default_monthly_rate?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'vehicles_model_id_fkey';
            columns: ['model_id'];
            isOneToOne: false;
            referencedRelation: 'vehicle_models';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vehicles_status_id_fkey';
            columns: ['status_id'];
            isOneToOne: false;
            referencedRelation: 'vehicle_statuses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vehicles_current_renter_id_fkey';
            columns: ['current_renter_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
        ];
      };
      rentals: {
        Row: {
          id: number;
          user_id: number;
          vehicle_id: number;
          customer_id: number;
          start_date: string;
          end_date: string | null;
          monthly_rate: number;
          status: 'ACTIVE' | 'ENDED';
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: number;
          user_id: number;
          vehicle_id: number;
          customer_id: number;
          start_date: string;
          end_date?: string | null;
          monthly_rate: number;
          status?: 'ACTIVE' | 'ENDED';
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: number;
          user_id?: number;
          vehicle_id?: number;
          customer_id?: number;
          start_date?: string;
          end_date?: string | null;
          monthly_rate?: number;
          status?: 'ACTIVE' | 'ENDED';
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'rentals_vehicle_id_fkey';
            columns: ['vehicle_id'];
            isOneToOne: false;
            referencedRelation: 'vehicles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'rentals_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
        ];
      };
      contracts: {
        Row: {
          id: number;
          rental_id: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: number;
          rental_id: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: number;
          rental_id?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'contracts_rental_id_fkey';
            columns: ['rental_id'];
            isOneToOne: true;
            referencedRelation: 'rentals';
            referencedColumns: ['id'];
          },
        ];
      };
      maintenance_records: {
        Row: {
          id: number;
          user_id: number;
          vehicle_id: number;
          customer_id: number | null;
          workshop_id: number | null;
          vehicle_plate: string;
          entry_date: string;
          completion_date: string | null;
          mechanic_name: string;
          description: string;
          type: 'Revisão Periódica' | 'Corretiva/Quebra' | 'Troca de Óleo' | 'Troca de Pneu' | 'Vistoria de Entrada';
          cost: number;
          status: 'OPEN' | 'COMPLETED';
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: number;
          user_id: number;
          vehicle_id: number;
          customer_id?: number | null;
          workshop_id?: number | null;
          vehicle_plate: string;
          entry_date?: string;
          completion_date?: string | null;
          mechanic_name: string;
          description: string;
          type: 'Revisão Periódica' | 'Corretiva/Quebra' | 'Troca de Óleo' | 'Troca de Pneu' | 'Vistoria de Entrada';
          cost?: number;
          status?: 'OPEN' | 'COMPLETED';
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: number;
          user_id?: number;
          vehicle_id?: number;
          customer_id?: number | null;
          workshop_id?: number | null;
          vehicle_plate?: string;
          entry_date?: string;
          completion_date?: string | null;
          mechanic_name?: string;
          description?: string;
          type?: 'Revisão Periódica' | 'Corretiva/Quebra' | 'Troca de Óleo' | 'Troca de Pneu' | 'Vistoria de Entrada';
          cost?: number;
          status?: 'OPEN' | 'COMPLETED';
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'maintenance_records_vehicle_id_fkey';
            columns: ['vehicle_id'];
            isOneToOne: false;
            referencedRelation: 'vehicles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'maintenance_records_workshop_id_fkey';
            columns: ['workshop_id'];
            isOneToOne: false;
            referencedRelation: 'workshops';
            referencedColumns: ['id'];
          },
        ];
      };
      documents: {
        Row: {
          id: number;
          parent_id: number;
          origin_type: 'CONTRACT' | 'WORKSHOP';
          file_url: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: number;
          parent_id: number;
          origin_type: 'CONTRACT' | 'WORKSHOP';
          file_url: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: number;
          parent_id?: number;
          origin_type?: 'CONTRACT' | 'WORKSHOP';
          file_url?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      maintenance_type: 'Revisão Periódica' | 'Corretiva/Quebra' | 'Troca de Óleo' | 'Troca de Pneu' | 'Vistoria de Entrada';
      user_role: 'ADMIN' | 'MECHANIC' | 'BILLING';
      contract_status: 'ACTIVE' | 'ENDED';
      maintenance_status: 'OPEN' | 'COMPLETED';
    };
    CompositeTypes: {};
  };
}

// Atalhos de tipo para uso direto
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type InsertDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type UpdateDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Tipos das entidades (Row)
export type DbAppUser = Tables<'app_users'>;
export type DbCustomer = Tables<'customers'>;
export type DbVehicle = Tables<'vehicles'>;
export type DbRentalContract = Tables<'rentals'>;
export type DbMaintenanceRecord = Tables<'maintenance_records'>;
export type DbWorkshop = Tables<'workshops'>;
export type DbContract = Tables<'contracts'>;
export type DbDocument = Tables<'documents'>;
