'use client';
import React, { useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppContext } from "../../../contexts/AppContext";
import { MaintenanceRecord, VEHICLE_STATUS_IDS } from "../../../types";
import { Camera, X } from "lucide-react";
import { ModuleHeader } from "@/components/ModuleHeader";
import { supabaseWorkshopDocumentsApi } from "../../../database/api/supabase/workshopDocuments";

export const OficinaNovePage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { vehicles, workshops, handleAddMaintenanceRecord } = useAppContext();

  const [selectedPlate, setSelectedPlate] = useState(searchParams.get("plate") ?? "");
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | "">("");
  const { user } = useAppContext();
  const [form, setForm] = useState({
    description: "",
    mechanic_name: "",
  });

  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordIdRef = useRef<string>(crypto.randomUUID());

  const handlePhotoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setPhotoFiles((prev) => [...prev, ...files]);
    setPhotoPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  }, []);

  const removePhoto = useCallback((index: number) => {
    setPhotoPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const availableVehicles = vehicles.filter(
    (v) => v.status_id !== VEHICLE_STATUS_IDS.MAINTENANCE,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const vehicle = vehicles.find((v) => v.plate === selectedPlate);
    if (!vehicle) return;

    const now = new Date().toISOString();
    const record: MaintenanceRecord = {
      id: recordIdRef.current,
      user_id: user!.id,
      vehicle_id: vehicle.id,
      workshop_id: selectedWorkshopId || null,
      vehicle_plate: vehicle.plate,
      entry_date: now,
      status: "OPEN",
      cost: 0,
      type: 'Revisão Periódica',
      mechanic_name: form.mechanic_name || '',
      description: form.description || '',
      created_at: now,
      updated_at: now,
      device_id: 'local',
      version: 1,
      is_deleted: 0,
      sync_status: 'pending',
    };

    try {
      await handleAddMaintenanceRecord(record);

      if (photoFiles.length > 0) {
        setUploading(true);
        try {
          await Promise.all(
            photoFiles.map((file) =>
              supabaseWorkshopDocumentsApi.uploadAndCreate(record.id, file)
            )
          );
        } catch {
          // Fotos falham silenciosamente — registro já foi salvo
        } finally {
          setUploading(false);
        }
      }

      router.push("/oficina");
    } catch (err) {
    }
  };

  return (
    <div className="space-y-8">
      <ModuleHeader
        title="Registrar Entrada"
        subtitle="Entrada de veículo para manutenção técnica."
        breadcrumbs={[
          { label: "Oficina", href: "/oficina" },
          { label: "Registrar Entrada" }
        ]}
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-brand-blue p-4">
          <h3 className="font-bold text-white">
            Entrada de Veículo na Oficina
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400   mb-2">
              Moto da Frota
            </label>
            <select
              className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#004AAD]/10 focus:border-blue-500 transition-all border appearance-none"
              value={selectedPlate}
              onChange={(e) => setSelectedPlate(e.target.value)}
              required
            >
              <option value="">Selecione a placa...</option>
              {availableVehicles.map((v) => (
                <option key={v.id} value={v.plate}>
                  {v.plate} - {v.model?.name || 'Modelo desconhecido'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400   mb-2">
              Oficina
            </label>
            <select
              className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#004AAD]/10 focus:border-blue-500 transition-all border appearance-none"
              value={selectedWorkshopId}
              onChange={(e) => setSelectedWorkshopId(e.target.value)}
              required
            >
              <option value="">Selecione a oficina...</option>
              {workshops.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400   mb-2">
              Mecânico Responsável <span className="text-slate-300 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#004AAD]/10 border"
              value={form.mechanic_name}
              onChange={(e) =>
                setForm({ ...form, mechanic_name: e.target.value })
              }
              placeholder="Nome do Mecânico"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400   mb-2">
              Observações Técnicas <span className="text-slate-300 font-normal">(opcional)</span>
            </label>
            <textarea
              className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#004AAD]/10 border resize-none"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Descreva o que será feito..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">
              Fotos <span className="text-slate-300 font-normal">(opcional)</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoSelect}
            />
            <div className="flex flex-wrap gap-3">
              {photoPreviews.map((src, i) => (
                <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <img src={src} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
              >
                <Camera size={20} />
                <span className="text-xs font-medium">Adicionar</span>
              </button>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={() => router.push("/oficina")}
              className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 py-4 bg-[#004AAD] text-white rounded-xl font-bold shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {uploading ? "Enviando fotos..." : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
