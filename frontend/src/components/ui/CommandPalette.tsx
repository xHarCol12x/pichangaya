import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { Search, Monitor, Building2, Ticket, Users, Calendar, Settings, LogOut, FileText, Activity } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function CommandPalette() {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        // Read user role on mount
        const userStr = localStorage.getItem('fieldiq_user');
        if (userStr) {
            try {
                setUserRole(JSON.parse(userStr).role);
            } catch (e) { }
        }

        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        const openHandler = () => setOpen(true);

        document.addEventListener('keydown', down);
        document.addEventListener('open-cmdk', openHandler);

        return () => {
            document.removeEventListener('keydown', down);
            document.removeEventListener('open-cmdk', openHandler);
        };
    }, []);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    const handleLogout = () => {
        localStorage.removeItem("fieldiq_token");
        localStorage.removeItem("fieldiq_user");
        router.push("/login");
    };

    return (
        <Command.Dialog
            open={open}
            onOpenChange={setOpen}
            label="Global Command Menu"
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4 animate-in fade-in duration-200"
        >
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

            <Command
                className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-white/10 shadow-[0_0_60px_-15px_rgba(56,189,248,0.3)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col"
            >
                <div className="flex items-center px-4 border-b border-slate-100 dark:border-white/5">
                    <Search className="w-5 h-5 text-slate-400 shrink-0" />
                    <Command.Input
                        autoFocus
                        placeholder="Escribe un comando o busca algo..."
                        className="flex-1 px-4 py-5 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-400 text-lg w-full"
                    />
                    <kbd className="hidden sm:inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider shrink-0">
                        ESC
                    </kbd>
                </div>

                <Command.List className="max-h-[350px] overflow-y-auto p-2 scroll-smooth">
                    <Command.Empty className="py-12 text-center text-sm text-slate-500">
                        No se encontraron resultados para tu búsqueda.
                    </Command.Empty>

                    {userRole === 'SUPER_ADMIN' && (
                        <Command.Group heading="Super Admin" className="text-xs font-semibold text-slate-400 px-2 py-3 mb-1">
                            <Command.Item
                                onSelect={() => runCommand(() => router.push('/dashboard/super-admin?tab=DIRECTORY'))}
                                className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer text-sm text-slate-700 dark:text-slate-300 aria-selected:bg-accent/10 aria-selected:text-accent transition-colors"
                            >
                                <Building2 className="w-4 h-4" /> Directorio de Tenants
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => router.push('/dashboard/super-admin?tab=PLANS'))}
                                className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer text-sm text-slate-700 dark:text-slate-300 aria-selected:bg-accent/10 aria-selected:text-accent transition-colors"
                            >
                                <Ticket className="w-4 h-4" /> Gestión de Planes
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => router.push('/dashboard/super-admin?tab=AUDIT'))}
                                className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer text-sm text-slate-700 dark:text-slate-300 aria-selected:bg-accent/10 aria-selected:text-accent transition-colors"
                            >
                                <Activity className="w-4 h-4" /> Registro de Auditoría
                            </Command.Item>
                        </Command.Group>
                    )}

                    {userRole === 'ADMIN' && (
                        <Command.Group heading="Mi Negocio" className="text-xs font-semibold text-slate-400 px-2 py-3 mb-1">
                            <Command.Item
                                onSelect={() => runCommand(() => router.push('/dashboard/bookings'))}
                                className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer text-sm text-slate-700 dark:text-slate-300 aria-selected:bg-accent/10 aria-selected:text-accent transition-colors"
                            >
                                <Calendar className="w-4 h-4" /> Ver Reservas
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => router.push('/dashboard/fields'))}
                                className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer text-sm text-slate-700 dark:text-slate-300 aria-selected:bg-accent/10 aria-selected:text-accent transition-colors"
                            >
                                <Activity className="w-4 h-4" /> Mis Canchas
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => router.push('/dashboard/users'))}
                                className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer text-sm text-slate-700 dark:text-slate-300 aria-selected:bg-accent/10 aria-selected:text-accent transition-colors"
                            >
                                <Users className="w-4 h-4" /> Mis Clientes
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => router.push('/dashboard/settings'))}
                                className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer text-sm text-slate-700 dark:text-slate-300 aria-selected:bg-accent/10 aria-selected:text-accent transition-colors"
                            >
                                <Settings className="w-4 h-4" /> Configuración General
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => router.push('/dashboard/billing'))}
                                className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer text-sm text-slate-700 dark:text-slate-300 aria-selected:bg-accent/10 aria-selected:text-accent transition-colors"
                            >
                                <FileText className="w-4 h-4" /> Facturación y Plan
                            </Command.Item>
                        </Command.Group>
                    )}

                    <Command.Group heading="Sistema" className="text-xs font-semibold text-slate-400 px-2 py-3 mb-1">
                        <Command.Item
                            onSelect={() => runCommand(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}
                            className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer text-sm text-slate-700 dark:text-slate-300 aria-selected:bg-accent/10 aria-selected:text-accent transition-colors"
                        >
                            <Monitor className="w-4 h-4" /> Cambiar Tema
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => handleLogout())}
                            className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer text-sm text-red-500 aria-selected:bg-red-500/10 aria-selected:text-red-400 transition-colors"
                        >
                            <LogOut className="w-4 h-4" /> Cerrar Sesión
                        </Command.Item>
                    </Command.Group>
                </Command.List>
            </Command>
        </Command.Dialog>
    );
}
