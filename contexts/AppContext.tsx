'use client';
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Vehicle,
  MaintenanceRecord,
  Customer,
  VEHICLE_STATUS_IDS,
  VehicleStatusRecord,
  AppUser,
  RentalContract,
  VehicleModel,
  Workshop,
  UnavailableVehicle,
  UnavailableStatusType,
} from "../types";
import { localVehiclesApi } from "../database/api/local/vehicles";
import { localCustomersApi } from "../database/api/local/customers";
import { localRentalsApi } from "../database/api/local/rentals";
import { localMaintenanceApi } from "../database/api/local/maintenance";
import { localUsersApi } from "../database/api/local/users";
import { localVehicleModelsApi } from "../database/api/local/vehicleModels";
import { localVehicleStatusesApi } from "../database/api/local/vehicleStatuses";
import { localWorkshopsApi } from "../database/api/local/workshops";
import { localUnavailableVehiclesApi } from "../database/api/local/unavailableVehicles";

interface AppContextType {
  user: AppUser | null;
  setUser: (user: AppUser | null) => void;
  vehicles: Vehicle[];
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  vehicleModels: VehicleModel[];
  setVehicleModels: React.Dispatch<React.SetStateAction<VehicleModel[]>>;
  vehicleStatuses: VehicleStatusRecord[];
  workshops: Workshop[];
  maintenanceRecords: MaintenanceRecord[];
  setMaintenanceRecords: React.Dispatch<
    React.SetStateAction<MaintenanceRecord[]>
  >;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  rentalContracts: RentalContract[];
  setRentalContracts: React.Dispatch<React.SetStateAction<RentalContract[]>>;
  handleAddMaintenanceRecord: (record: MaintenanceRecord) => Promise<void>;
  handleFinishMaintenance: (recordId: string) => Promise<void>;
  handleCreateRental: (vehicleId: string, customerId: string, monthlyRate: number, startDate: string) => Promise<RentalContract>;
  handleUpdateRental: (id: string, updates: { start_date?: string; monthly_rate?: number }) => Promise<void>;
  handleEndRental: (vehicleId: string) => Promise<void>;
  unavailableVehicles: UnavailableVehicle[];
  handleMakeVehicleUnavailable: (vehicleId: string, statusType: UnavailableStatusType, reason: string) => Promise<UnavailableVehicle>;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context)
    throw new Error("useAppContext must be used within AppProvider");
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);
  const [vehicleStatuses, setVehicleStatuses] = useState<VehicleStatusRecord[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<
    MaintenanceRecord[]
  >([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rentalContracts, setRentalContracts] = useState<RentalContract[]>([]);
  const [unavailableVehicles, setUnavailableVehicles] = useState<UnavailableVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Re-hydrate user from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmail = localStorage.getItem("electron_user_email");
      if (storedEmail) {
        localUsersApi.login(storedEmail).then((u: AppUser | null) => {
          if (u) {
            setUser(u);
            localStorage.setItem("electron_user_id", u.id);
          } else {
            localStorage.removeItem("electron_user_email");
            localStorage.removeItem("electron_user_id");
          }
        }).catch(() => { });
      }
    }
  }, []);

  // Função para carregar todos os dados
  const loadData = async () => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('electron_user_id') : null;

    try {
      setLoading(true);
      setError(null);

      // 1. Dados Globais (Sempre carregar)
      const [vehiclesData, modelsData, statusesData, customersData, workshopsData] =
        await Promise.all([
          localVehiclesApi.getAll().catch(() => [] as Vehicle[]),
          localVehicleModelsApi.getAll().catch(() => [] as VehicleModel[]),
          localVehicleStatusesApi.getAll().catch(() => [] as VehicleStatusRecord[]),
          localCustomersApi.getAll().catch(() => [] as Customer[]),
          localWorkshopsApi.getAll().catch(() => [] as Workshop[]),
        ]);

      setVehicles(vehiclesData);
      setVehicleModels(modelsData);
      setVehicleStatuses(statusesData);
      setCustomers(customersData);
      setWorkshops(workshopsData);

      // 2. Dados Privados (Apenas se logado)
      if (userId) {
        const [contractsData, maintenanceData, unavailableData] = await Promise.all([
          localRentalsApi.getAll().catch(() => [] as RentalContract[]),
          localMaintenanceApi.getAll().catch(() => [] as MaintenanceRecord[]),
          localUnavailableVehiclesApi.getAll().catch(() => [] as UnavailableVehicle[]),
        ]);
        setRentalContracts(contractsData);
        setMaintenanceRecords(maintenanceData);
        setUnavailableVehicles(unavailableData);
      } else {
        setRentalContracts([]);
        setMaintenanceRecords([]);
        setUnavailableVehicles([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados na montagem e quando o user mudar
  useEffect(() => {
    loadData();
  }, [user]);

  const handleAddMaintenanceRecord = async (record: MaintenanceRecord) => {
    if (!user) throw new Error('Usuário não autenticado.');
    try {
      const newRecord = await localMaintenanceApi.create({
        vehicle_id: record.vehicle_id,
        workshop_id: record.workshop_id ?? null,
        vehicle_plate: record.vehicle_plate,
        entry_date: record.entry_date,
        mechanic_name: record.mechanic_name,
        description: record.description,
        type: record.type,
        cost: record.cost,
        status: record.status,
      });

      await localVehiclesApi.updateStatus(
        record.vehicle_id,
        VEHICLE_STATUS_IDS.MAINTENANCE,
      );

      const maintenanceStatus = vehicleStatuses.find(s => s.id === VEHICLE_STATUS_IDS.MAINTENANCE);

      setMaintenanceRecords((prev) => [newRecord, ...prev]);
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === record.vehicle_id
            ? { ...v, status_id: VEHICLE_STATUS_IDS.MAINTENANCE, vehicleStatus: maintenanceStatus }
            : v,
        ),
      );
    } catch (err) {
      throw err;
    }
  };

  const handleFinishMaintenance = async (recordId: string) => {
    try {
      const record = maintenanceRecords.find((r) => r.id === recordId);
      if (!record) return;

      await localMaintenanceApi.complete(recordId, record.cost);

      await localVehiclesApi.updateStatus(
        record.vehicle_id,
        VEHICLE_STATUS_IDS.AVAILABLE,
      );

      const availableStatus = vehicleStatuses.find(s => s.id === VEHICLE_STATUS_IDS.AVAILABLE);

      setMaintenanceRecords((prev) =>
        prev.map((r) =>
          r.id === recordId
            ? {
              ...r,
              status: "COMPLETED",
              completion_date: new Date().toISOString(),
              cost: record.cost,
            }
            : r,
        ),
      );

      setVehicles((prev) =>
        prev.map((v) =>
          v.id === record.vehicle_id
            ? { ...v, status_id: VEHICLE_STATUS_IDS.AVAILABLE, vehicleStatus: availableStatus }
            : v,
        ),
      );
    } catch (err) {
      throw err;
    }
  };

  const handleCreateRental = async (
    vehicleId: string,
    customerId: string,
    monthlyRate: number,
    startDate: string,
  ): Promise<RentalContract> => {
    if (!user) throw new Error('Usuário não autenticado.');
    try {
      const newContract = await localRentalsApi.create({
        vehicle_id: vehicleId,
        customer_id: customerId,
        monthly_rate: monthlyRate,
        start_date: startDate,
        status: "ACTIVE",
      });

      await localVehiclesApi.update(vehicleId, {
        status_id: VEHICLE_STATUS_IDS.RENTED,
        current_renter_id: customerId,
      });

      const rentedStatus = vehicleStatuses.find(s => s.id === VEHICLE_STATUS_IDS.RENTED);

      await localCustomersApi.update(customerId, { active_contract: true });

      setRentalContracts((prev) => [newContract, ...prev]);
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === vehicleId
            ? { ...v, status_id: VEHICLE_STATUS_IDS.RENTED, vehicleStatus: rentedStatus, current_renter_id: customerId }
            : v,
        ),
      );
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId ? { ...c, active_contract: true } : c,
        ),
      );
      return newContract;
    } catch (err) {
      throw err;
    }
  };

  const handleUpdateRental = async (id: string, updates: { start_date?: string; monthly_rate?: number }) => {
    const updated = await localRentalsApi.update(id, updates);
    setRentalContracts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated } : c)),
    );
  };

  const handleEndRental = async (vehicleId: string) => {
    try {
      const activeContract = rentalContracts.find(
        (c) => c.vehicle_id === vehicleId && c.status === "ACTIVE",
      );
      if (!activeContract) return;

      await localRentalsApi.end(activeContract.id);

      await localVehiclesApi.update(vehicleId, {
        status_id: VEHICLE_STATUS_IDS.AVAILABLE,
        current_renter_id: null,
      });

      const availableStatus = vehicleStatuses.find(s => s.id === VEHICLE_STATUS_IDS.AVAILABLE);

      const customerId = activeContract.customer_id;
      const otherActiveContracts = rentalContracts.filter(
        (c) =>
          c.customer_id === customerId &&
          c.status === "ACTIVE" &&
          c.id !== activeContract.id,
      );

      if (otherActiveContracts.length === 0) {
        await localCustomersApi.update(customerId, { active_contract: false });
      }

      setRentalContracts((prev) =>
        prev.map((c) =>
          c.id === activeContract.id
            ? { ...c, status: "ENDED", end_date: new Date().toISOString().split("T")[0] }
            : c,
        ),
      );
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === vehicleId
            ? { ...v, status_id: VEHICLE_STATUS_IDS.AVAILABLE, vehicleStatus: availableStatus, current_renter_id: null }
            : v,
        ),
      );
      if (otherActiveContracts.length === 0) {
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === customerId ? { ...c, active_contract: false } : c,
          ),
        );
      }
    } catch (err) {
      throw err;
    }
  };

  const handleMakeVehicleUnavailable = async (
    vehicleId: string,
    statusType: UnavailableStatusType,
    reason: string,
  ): Promise<UnavailableVehicle> => {
    if (!user) throw new Error('Usuário não autenticado.');

    const record = await localUnavailableVehiclesApi.create({
      vehicle_id: vehicleId,
      status_type: statusType,
      reason,
    });

    // Encontra o status correspondente (Roubada = '5', PT = '6')
    const statusName = statusType === 'STOLEN' ? 'Roubada' : 'PT';
    const targetStatus = vehicleStatuses.find(s => s.name === statusName);
    const targetStatusId = targetStatus?.id ?? '';

    if (targetStatusId) {
      await localVehiclesApi.updateStatus(vehicleId, targetStatusId);
    }

    setUnavailableVehicles((prev) => [record, ...prev]);
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === vehicleId
          ? { ...v, status_id: targetStatusId, vehicleStatus: targetStatus, current_renter_id: null }
          : v,
      ),
    );

    // Se o veículo tinha contrato ativo, encerra
    const activeContract = rentalContracts.find(
      (c) => c.vehicle_id === vehicleId && c.status === 'ACTIVE',
    );
    if (activeContract) {
      await localRentalsApi.end(activeContract.id);
      const customerId = activeContract.customer_id;
      const otherActive = rentalContracts.filter(
        (c) => c.customer_id === customerId && c.status === 'ACTIVE' && c.id !== activeContract.id,
      );
      if (otherActive.length === 0) {
        await localCustomersApi.update(customerId, { active_contract: false });
        setCustomers((prev) => prev.map((c) => c.id === customerId ? { ...c, active_contract: false } : c));
      }
      setRentalContracts((prev) =>
        prev.map((c) =>
          c.id === activeContract.id
            ? { ...c, status: 'ENDED', end_date: new Date().toISOString().split('T')[0] }
            : c,
        ),
      );
    }

    return record;
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        vehicles,
        setVehicles,
        vehicleModels,
        setVehicleModels,
        vehicleStatuses,
        workshops,
        maintenanceRecords,
        setMaintenanceRecords,
        customers,
        setCustomers,
        rentalContracts,
        setRentalContracts,
        handleAddMaintenanceRecord,
        handleFinishMaintenance,
        handleCreateRental,
        handleUpdateRental,
        handleEndRental,
        unavailableVehicles,
        handleMakeVehicleUnavailable,
        loading,
        error,
        refreshData: loadData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
