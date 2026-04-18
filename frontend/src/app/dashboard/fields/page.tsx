"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, MapPin, Loader2, AlertCircle, Lock, X, Navigation, TrendingUp } from "lucide-react";
import { useVenue } from "@/context/VenueContext";

import { venues, fields as fieldsApi, users } from "@/lib/api";
import ConfirmModal from "@/components/ui/ConfirmModal";
import FieldMiniMap from "@/components/fields/FieldMiniMap";
import CustomSelect from "@/components/ui/CustomSelect";
import UpgradeModal from "@/components/ui/UpgradeModal";

export default function FieldsPage() {
    const [fields, setFields] = useState<any[]>([]);
    
    // Global Venue Context
    const { selectedVenueId, selectedVenue: myVenue, venues: myVenues, isLoadingVenues, refreshVenues } = useVenue();


    const [plan, setPlan] = useState<string>("basic");
    const [featureOverrides, setFeatureOverrides] = useState<any>({});
    const [planPermissions, setPlanPermissions] = useState<any>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal states
    const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
    const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
    const [fieldToEdit, setFieldToEdit] = useState<any>(null);
    const [fieldToDelete, setFieldToDelete] = useState<any>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [upgradeMessage, setUpgradeMessage] = useState("");

    // Form data
    const [venueForm, setVenueForm] = useState({ name: "", address: "" });
    const [fieldForm, setFieldForm] = useState({ name: "", type: "Fútbol 5", surface: "Sintético", pricePerHour: 0 });

    useEffect(() => {
        if (selectedVenueId) loadFields();
    }, [selectedVenueId]);

    const loadFields = async () => {
        setIsLoading(true);
        try {
            const fieldsRes = await fieldsApi.getAll(selectedVenueId!);
            setFields(fieldsRes.data);
        } catch (error) {
            console.error("Error loading fields", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadBasicInfo();
    }, []);

    const loadBasicInfo = async () => {
        try {
            const userStr = localStorage.getItem('fieldiq_user');
            if (userStr) {
                const user = JSON.parse(userStr);
                const uRes = await users.getMe().catch(() => ({ data: {} }));
                
                const userPlan = uRes.data?.plan || user.plan || 'basic';
                setPlan(String(userPlan).toLowerCase());
                setFeatureOverrides(uRes.data?.featureOverrides || user.featureOverrides || {});
                setPlanPermissions(uRes.data?.planPermissions || user.planPermissions || {});
            }
        } catch (error) {
            console.error("Error loading basic info", error);
        }
    };


    const handleCreateVenue = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const userStr = localStorage.getItem('fieldiq_user');
            if (userStr) {
                const user = JSON.parse(userStr);
                await venues.create({
                    ...venueForm,
                    ownerId: user.id
                });
                await refreshVenues();
                setIsVenueModalOpen(false);
                setVenueForm({ name: "", address: "" });


            }
        } catch (error) {
            console.error("Error creating venue", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveField = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaveError(null);
        setIsSubmitting(true);
        try {
            const data = { ...fieldForm, pricePerHour: Number(fieldForm.pricePerHour) };
            if (fieldToEdit) {
                await fieldsApi.update(fieldToEdit.id, data);
                setFields(prev => prev.map(f => f.id === fieldToEdit.id ? { ...f, ...data } : f));
            } else {
                if (!selectedVenueId) throw new Error("No hay sede seleccionada");
                const res = await fieldsApi.create({ ...data, venueId: selectedVenueId });
                setFields(prev => [...prev, res.data]);
            }

            setIsFieldModalOpen(false);
            setFieldToEdit(null);
            setSaveError(null);
            setFieldForm({ name: "", type: "Fútbol 5", surface: "Sintético", pricePerHour: 0 });
        } catch (error: any) {
            console.error("Error saving field", error);
            const msg = error?.response?.data?.message || error?.message || "Error al guardar. Reintenta.";
            setSaveError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteField = async () => {
        if (!fieldToDelete) return;
        try {
            await fieldsApi.delete(fieldToDelete.id);
            setFields(prev => prev.filter(f => f.id !== fieldToDelete.id));
            setFieldToDelete(null);
        } catch (error) {
            console.error("Error deleting field", error);
        }
    };

    const openCreateFieldModal = () => {
        setFieldToEdit(null);
        setFieldForm({ name: "", type: "Fútbol 5", surface: "Sintético", pricePerHour: 0 });
        setIsFieldModalOpen(true);
    };

    const openEditFieldModal = (field: any) => {
        setFieldToEdit(field);
        setFieldForm({ name: field.name, type: field.type, surface: field.surface || "Sintético", pricePerHour: field.pricePerHour });
        setIsFieldModalOpen(true);
    };

    if (isLoading || isLoadingVenues) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }


    const maxVenues = (plan === "free_trial" || plan === "basic") ? 1 : (plan === "pro" ? 2 : 10);

    // Field Limits
    let maxFields = 9999;
    if (plan === "free_trial") maxFields = 2;
    if (plan === "basic") maxFields = 5;
    if (plan === "pro") maxFields = 200;


    const canCreateVenue = myVenues.length < maxVenues;
    const canCreateField = fields.length < maxFields;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Recintos y Canchas</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Administra tus sedes deportivas y tarifas.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">


                    <button
                        onClick={() => {
                            if (!canCreateVenue) {
                                setUpgradeMessage(`solo permite un máximo de ${maxVenues} sede(s). ¡Mejora tu plan para añadir más sedes!`);
                                setIsUpgradeModalOpen(true);
                                return;
                            }
                            setVenueForm({ name: "", address: "" });
                            setIsVenueModalOpen(true);
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors shadow-sm dark:shadow-none ${canCreateVenue ? "bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-transparent" : "bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-white/30 cursor-not-allowed border border-slate-200 dark:border-white/5"}`}
                    >
                        {canCreateVenue ? <Plus className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        Nueva Sede
                    </button>

                    {myVenue && (
                        <button
                            onClick={() => {
                                if (!canCreateField) {
                                    setUpgradeMessage(`solo permite un máximo de ${maxFields} canchas por sede. ¡Cámbiate a PRO para canchas ilimitadas!`);
                                    setIsUpgradeModalOpen(true);
                                    return;
                                }
                                openCreateFieldModal();
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors shadow-sm dark:shadow-none ${canCreateField ? "bg-accent hover:bg-accent/90 text-slate-950" : "bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-white/30 cursor-not-allowed border border-slate-200 dark:border-white/5"}`}
                        >
                            {canCreateField ? <Plus className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            Nueva Cancha
                        </button>
                    )}
                </div>
            </div>

            {!myVenue && !isVenueModalOpen && (
                <div className="bg-white dark:bg-slate-950/50 backdrop-blur-xl rounded-2xl p-8 text-center border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-4">
                    <div className="w-16 h-16 bg-accent/10 dark:bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-8 h-8 text-accent" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Primero crea tu Recinto/Sede</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                        Para poder agregar canchas, necesitas configurar los datos principales de tu complejo deportivo.
                    </p>
                    <button
                        onClick={() => setIsVenueModalOpen(true)}
                        className="bg-accent text-slate-950 px-6 py-2.5 rounded-xl font-medium hover:bg-accent/90 transition-colors inline-block mt-4"
                    >
                        Comenzar
                    </button>
                </div>
            )}

            {myVenue && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                    {fields.length === 0 ? (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                            <p className="text-slate-500 dark:text-slate-400">Aún no hay canchas creadas.</p>
                        </div>
                    ) : (
                        fields.map(field => (
                            <div key={field.id} className="bg-white dark:bg-slate-950/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none flex flex-col hover:border-accent/50 dark:hover:border-accent/30 transition-colors group relative overflow-hidden">
                                {/* Decoración de fondo */}
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/5 rounded-full blur-[50px] group-hover:bg-accent/10 transition-colors pointer-events-none" />

                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{field.name.toUpperCase()}</h3>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-accent/10 dark:bg-accent/20 text-accent uppercase tracking-wider">
                                                {field.type}
                                            </span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-transparent">
                                                {field.surface || 'Sintético'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEditFieldModal(field)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 bg-slate-50 dark:bg-slate-900/50 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors border border-slate-200 dark:border-white/5">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setFieldToDelete(field)} className="text-slate-500 hover:text-red-500 dark:hover:text-red-400 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border border-slate-200 dark:border-white/5">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* MiniMap Visual Embed */}
                                <div className="w-full h-32 my-2 relative z-10 rounded-xl overflow-hidden border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-2 group-hover:border-slate-300 dark:group-hover:border-white/10 transition-colors">
                                    <FieldMiniMap type={field.type} surface={field.surface || 'Sintético'} />
                                </div>

                                <div className="mt-auto pt-4 border-t border-slate-200 dark:border-white/5 flex justify-between items-end relative z-10">
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Precio / hora</p>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white flex items-start gap-1">
                                        <span className="text-sm text-accent mt-1">S/.</span>
                                        {field.pricePerHour}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Venue Creation Premium Modal */}
            {isVenueModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/90 backdrop-blur-md" onClick={() => setIsVenueModalOpen(false)} />
                    <div className="bg-white dark:bg-slate-950 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-[2rem] p-8 w-full max-w-lg relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-300">

                        {myVenues.length > 0 && (
                            <button onClick={() => setIsVenueModalOpen(false)} className="absolute top-6 right-6 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10">
                                <X className="w-5 h-5" />
                            </button>
                        )}

                        <div className="w-16 h-16 bg-accent/10 dark:bg-accent/20 rounded-2xl flex items-center justify-center mb-6 border border-accent/20 shadow-[0_0_30px_rgba(56,189,248,0.15)]">
                            <MapPin className="w-8 h-8 text-accent" />
                        </div>

                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                            {myVenues.length === 0 ? "Crea tu Primera Sede" : "Añadir Nueva Sede"}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                            {myVenues.length === 0
                                ? "Para empezar a operar en PichangaLibre, necesitamos los datos básicos de tu complejo deportivo principal."
                                : "Expande tu negocio registrando una nueva sucursal deportiva en la plataforma."}
                        </p>

                        <form onSubmit={handleCreateVenue} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Nombre del Complejo</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <MapPin className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                                    </div>
                                    <input
                                        required
                                        type="text"
                                        value={venueForm.name}
                                        onChange={e => setVenueForm({ ...venueForm, name: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                                        placeholder="Ej. Complejo Deportivo Doña Luz"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Dirección Física</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Navigation className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                                    </div>
                                    <input
                                        required
                                        type="text"
                                        value={venueForm.address}
                                        onChange={e => setVenueForm({ ...venueForm, address: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                                        placeholder="Av. Principal 123, Ciudad"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-accent text-slate-950 py-4 rounded-xl font-bold text-lg hover:bg-accent/90 transition-all flex items-center justify-center gap-2 mt-8 hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(56,189,248,0.2)]"
                            >
                                {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                                {myVenues.length === 0 ? "Comenzar en PichangaLibre" : "Guardar Sede"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Field Modal Premium Split View */}
            {isFieldModalOpen && (
                <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-0 md:p-4">
                    <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/90 backdrop-blur-md" onClick={() => setIsFieldModalOpen(false)} />

                    <div className="bg-white dark:bg-slate-950 border-0 md:border border-slate-200 dark:border-white/10 rounded-none md:rounded-[2rem] w-full max-w-4xl relative z-10 shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in slide-in-from-bottom-4 md:zoom-in-95 duration-300 max-h-screen md:max-h-[90vh]">
                        {/* Botón de cerrar */}
                        <button onClick={() => setIsFieldModalOpen(false)} className="absolute top-4 right-4 z-20 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10">
                            <X className="w-5 h-5" />
                        </button>

                        {/* Columna Izquierda - Minimapa (solo desktop) */}
                        <div className="hidden md:flex w-full md:w-1/2 bg-slate-50 dark:bg-slate-950/50 p-8 border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/5 flex-col justify-center">
                            <div className="mb-6 flex justify-between items-end">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{fieldForm.name || "Cancha Preview"}</h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs font-bold px-2 py-1 rounded bg-accent/10 dark:bg-accent/20 text-accent uppercase tracking-wider">{fieldForm.type}</span>
                                        <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-transparent">{fieldForm.surface}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none">Precio</p>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white leading-none mt-1">S/ {fieldForm.pricePerHour}</p>
                                </div>
                            </div>

                            <div className="w-full flex-1 min-h-[250px] flex items-center justify-center transition-all duration-500">
                                <FieldMiniMap type={fieldForm.type} surface={fieldForm.surface} />
                            </div>

                            <p className="text-center text-xs text-slate-500 mt-6 hidden md:block">
                                El mapa táctico es referencial y se ajusta automáticamente según el tipo y tamaño seleccionado.
                            </p>
                        </div>

                        {/* Columna Derecha - Formulario */}
                        <div className="w-full md:w-1/2 p-5 md:p-8 flex flex-col justify-center bg-transparent overflow-y-auto max-h-screen md:max-h-[90vh]">
                            <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white tracking-tight">
                                {fieldToEdit ? "Ajustes de la Cancha" : "Configurar Nueva Cancha"}
                            </h2>
                            <form onSubmit={handleSaveField} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Nombre o Número</label>
                                    <input
                                        required
                                        type="text"
                                        value={fieldForm.name}
                                        onChange={e => setFieldForm({ ...fieldForm, name: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                                        placeholder="Ej. Cancha Principal"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="z-20">
                                        <CustomSelect
                                            label="Deporte / Tamaño"
                                            value={fieldForm.type}
                                            options={["Fútbol 5", "Fútbol 7", "Fútbol 11", "Vóley", "Básquet", "Tenis", "Pádel"]}
                                            onChange={val => setFieldForm({ ...fieldForm, type: val })}
                                        />
                                    </div>
                                    <div className="z-20">
                                        <CustomSelect
                                            label="Superficie"
                                            value={fieldForm.surface}
                                            options={["Sintético", "Césped Natural", "Losa / Cemento", "Arena", "Parquet"]}
                                            onChange={val => setFieldForm({ ...fieldForm, surface: val })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tarifa Base (S/ hora)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <span className="text-slate-500 font-bold">S/.</span>
                                        </div>
                                        <input
                                            required
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={fieldForm.pricePerHour}
                                            onChange={e => setFieldForm({ ...fieldForm, pricePerHour: parseFloat(e.target.value) || 0 })}
                                            className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-slate-900 dark:text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all font-mono text-lg"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                {/* Advanced Pricing Hook */}
                                <div className="mt-4 p-4 border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl relative overflow-hidden group">
                                    <div className="flex items-center justify-between mb-2 relative z-10">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-md bg-accent/20 flex items-center justify-center">
                                                <TrendingUp className="w-3.5 h-3.5 text-accent" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">Precios Diferenciados</span>
                                        </div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Add-On</div>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-3 relative z-10">Configura tarifas distintas por hora pico, fines de semana o eventos.</p>
                                    
                                    {(String(plan) === 'pro' || String(plan) === 'enterprise' || featureOverrides?.canSetAdvancedPricing || planPermissions?.canSetAdvancedPricing) ? (
                                        <button type="button" className="text-xs font-bold bg-accent hover:bg-accent/80 text-slate-950 px-3 py-1.5 rounded-lg w-full transition-colors">Configurar Variables</button>
                                    ) : (
                                        <button type="button" disabled className="text-xs font-bold bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-slate-500 px-3 py-1.5 rounded-lg w-full flex justify-center items-center gap-2 cursor-not-allowed transition-all">
                                            <Lock className="w-3 h-3" /> Bloqueado en Plan Actual
                                        </button>
                                    )}
                                </div>

                                {saveError && (
                                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>{saveError}</span>
                                    </div>
                                )}

                                <div className="pt-4 mt-6 border-t border-slate-200 dark:border-white/5">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-accent text-slate-950 py-4 rounded-xl font-bold text-lg hover:bg-accent/90 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(56,189,248,0.2)]"
                                    >
                                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5 flex-shrink-0" />}
                                        {fieldToEdit ? "Actualizar Cancha" : "Registrar Cancha"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={!!fieldToDelete}
                onClose={() => setFieldToDelete(null)}
                onConfirm={handleDeleteField}
                title="¿Eliminar cancha?"
                message={`Estás a punto de eliminar "${fieldToDelete?.name}". Esta acción no se puede deshacer y podría afectar el historial de reservas.`}
                confirmText="Sí, eliminar"
                cancelText="Cancelar"
                type="danger"
            />

            {/* Premium Upgrade Modal */}
            <UpgradeModal
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
                planName={plan}
                description={upgradeMessage}
            />
        </div>
    );
}
