"use client";

import React, { useState } from "react";
import { Plus, Edit2, Trash2, MapPin, Loader2, Navigation, Map as MapIcon, X, AlertCircle } from "lucide-react";
import { useVenue } from "@/context/VenueContext";
import { venues as venuesApi, users, bookings as bookingsApi, clients as clientsApi, fields as fieldsApi } from "@/lib/api";
import ConfirmModal from "@/components/ui/ConfirmModal";
import UpgradeModal from "@/components/ui/UpgradeModal";


export default function VenuesPage() {
    const { venues, refreshVenues, isLoadingVenues } = useVenue();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [venueToEdit, setVenueToEdit] = useState<any>(null);
    const [venueToDelete, setVenueToDelete] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    
    // Plan and Stats states
    const [plan, setPlan] = useState<string>("basic");
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [upgradeMessage, setUpgradeMessage] = useState("");
    const [venueStats, setVenueStats] = useState<Record<string, any>>({});
    const [loadingStats, setLoadingStats] = useState(false);

    React.useEffect(() => {
        loadPlan();
    }, []);

    React.useEffect(() => {
        if (venues.length > 0) {
            loadAllStats();
        }
    }, [venues]);

    const loadPlan = async () => {
        try {
            const uRes = await users.getMe();
            setPlan(String(uRes.data?.plan || "basic").toLowerCase());
        } catch (e) {
            console.error(e);
        }
    };

    const loadAllStats = async () => {
        setLoadingStats(true);
        try {
            // In a real scenario, this should be one endpoint "venues/stats"
            // For now, we'll fetch them individually or use what the backend provides
            const stats: Record<string, any> = {};
            
            // We'll try to get counts for each venue
            await Promise.all(venues.map(async (v) => {
                try {
                    const [fRes, cRes, bRes] = await Promise.all([
                        fieldsApi.getAll(v.id),
                        clientsApi.getAll(v.id),
                        bookingsApi.getAll().catch(() => ({ data: [] })) // Bookings need filtering
                    ]);
                    
                    const venueFields = fRes.data || [];
                    const fieldIds = venueFields.map((f: any) => f.id);
                    const venueBookings = (bRes.data || []).filter((b: any) => fieldIds.includes(b.fieldId));

                    stats[v.id] = {
                        fields: venueFields.length,
                        clients: (cRes.data || []).length,
                        bookings: venueBookings.length
                    };
                } catch (err) {
                    console.error(`Error loading stats for venue ${v.id}`, err);
                }
            }));
            setVenueStats(stats);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingStats(false);
        }
    };


    const [form, setForm] = useState({
        name: "",
        address: "",
        description: ""
    });

    const openModal = (venue?: any) => {
        if (!venue) {
            // Check limits
            const maxVenues = (plan === "free_trial" || plan === "basic") ? 1 : (plan === "pro" ? 2 : 10);
            if (venues.length >= maxVenues) {
                setUpgradeMessage(`tu plan actual (${plan.toUpperCase()}) solo permite un máximo de ${maxVenues} sede(s).`);
                setIsUpgradeModalOpen(true);
                return;
            }
        }

        if (venue) {
            setVenueToEdit(venue);
            setForm({
                name: venue.name,
                address: venue.address,
                description: venue.description || ""
            });
        } else {
            setVenueToEdit(null);
            setForm({ name: "", address: "", description: "" });
        }
        setIsModalOpen(true);
        setFormError(null);
    };


    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormError(null);
        try {
            const userStr = localStorage.getItem("fieldiq_user");
            const user = userStr ? JSON.parse(userStr) : null;
            
            if (venueToEdit) {
                await venuesApi.update(venueToEdit.id, form);
            } else {
                await venuesApi.create({ ...form, ownerId: user?.id });
            }
            await refreshVenues();
            setIsModalOpen(false);
        } catch (error: any) {
            setFormError(error.response?.data?.message || "Error al guardar la sede.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!venueToDelete) return;
        setIsSubmitting(true);
        try {
            // Assuming delete method exists or using axios
            // await venuesApi.delete(venueToDelete.id);
            await refreshVenues();
            setVenueToDelete(null);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Gestión de Sedes</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Administra tus locales y su información de contacto.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-accent text-slate-950 rounded-xl font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
                >
                    <Plus className="w-5 h-5" />
                    Nueva Sede
                </button>
            </div>

            {isLoadingVenues ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-accent" />
                </div>
            ) : venues.length === 0 ? (
                <div className="bg-white dark:bg-slate-950/50 backdrop-blur-xl rounded-2xl p-8 text-center border border-slate-200 dark:border-white/5 shadow-sm space-y-4">
                    <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapIcon className="w-8 h-8 text-accent" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">No tienes sedes registradas</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                        Crea tu primera sede para empezar a gestionar canchas y reservas.
                    </p>
                    <button
                        onClick={() => openModal()}
                        className="bg-accent text-slate-950 px-6 py-2.5 rounded-xl font-medium hover:bg-accent/90 transition-colors inline-block mt-4"
                    >
                        Crear Sede
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {venues.map(v => (
                        <div key={v.id} className="bg-white dark:bg-slate-950/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 dark:border-white/5 shadow-sm hover:border-accent/40 transition-all group relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/5 rounded-full blur-[50px] group-hover:bg-accent/10 transition-colors pointer-events-none" />
                            
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20">
                                    <MapPin className="w-6 h-6 text-accent" />
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Abierto</span>
                                    </div>
                                </div>

                            </div>

                            <div className="relative z-10">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{v.name}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-4">
                                    <Navigation className="w-3.5 h-3.5" />
                                    {v.address}
                                </p>
                                
                                 <div className="pt-4 border-t border-slate-200 dark:border-white/5 grid grid-cols-3 gap-2 mb-4">
                                    <div className="text-center">
                                        <p className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Canchas</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                                            {venueStats[v.id]?.fields ?? '...'}
                                        </p>
                                    </div>
                                    <div className="text-center border-x border-slate-200 dark:border-white/5">
                                        <p className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Reservas</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                                            {venueStats[v.id]?.bookings ?? '...'}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Clientes</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                                            {venueStats[v.id]?.clients ?? '...'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => {
                                            localStorage.setItem("fieldiq_selected_venue_id", v.id);
                                            window.location.href = "/dashboard/calendar";
                                        }}
                                        className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-950 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                                    >
                                        <MapIcon className="w-3 h-3" /> Ver Sede
                                    </button>
                                    <button 
                                        onClick={() => openModal(v)}
                                        className="p-2 bg-slate-100 dark:bg-white/5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 transition-colors"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>


                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-[2rem] p-8 w-full max-w-lg relative z-10 shadow-2xl animate-in fade-in zoom-in-95">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                        
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                            {venueToEdit ? "Editar Sede" : "Registrar Nueva Sede"}
                        </h2>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Nombre de la Sede</label>
                                <input
                                    required
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none"
                                    placeholder="Ej. Sede Norte"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Dirección Física</label>
                                <input
                                    required
                                    type="text"
                                    value={form.address}
                                    onChange={e => setForm({ ...form, address: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent outline-none"
                                    placeholder="Av. Principal 123"
                                />
                            </div>
                            
                            {formError && (
                                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    {formError}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-accent text-slate-950 py-4 rounded-xl font-bold text-lg hover:bg-accent/90 transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                                {venueToEdit ? "Guardar Cambios" : "Crear Sede"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={!!venueToDelete}
                onClose={() => setVenueToDelete(null)}
                onConfirm={handleDelete}
                title="¿Eliminar Sede?"
                message="Esta acción eliminará permanentemente la sede y todas sus canchas asociadas. Las reservas históricas se mantendrán pero no se podrán gestionar más por este local."
                confirmText="Eliminar Sede"
                cancelText="Cancelar"
                type="danger"
            />

            <UpgradeModal
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
                planName={plan}
                description={upgradeMessage}
            />


        </div>
    );
}
