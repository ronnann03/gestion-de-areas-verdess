import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    BarChart3,
    BellRing,
    CalendarDays,
    CheckCircle2,
    Clock,
    Download,
    Droplets,
    FileSpreadsheet,
    FileText,
    History,
    MapPin,
    PlayCircle,
    Printer,
    RotateCcw,
    Search,
    Trees,
    Users,
    Wrench,
} from 'lucide-react';
import { useMemo, useState, type FormEvent, type ReactNode } from 'react';

type ReportTab = 'general' | 'maintenances' | 'history' | 'workers' | 'alerts' | 'water';

type Filters = {
    date_from: string;
    date_to: string;
    park_id: string;
    maintenance_type: string;
    worker_id: string;
    status: string;
};

interface ParkOption {
    id: number;
    code: string | null;
    name: string;
}

interface WorkerOption {
    id: number;
    full_name: string;
}

interface ParkReportItem {
    id: number;
    code: string;
    name: string;
    green_area_type: string;
    location: string;
    public_use_area: number | null;
    green_area: number | null;
    has_water_point: boolean;
    water_point_status: string | null;
    conservation_status: string;
    is_active: boolean;
}

interface MaintenanceReportItem {
    id: number;
    maintenance_number: string;
    scheduled_date: string | null;
    execution_date: string | null;
    park_name: string;
    park_code: string;
    maintenance_type: string;
    worker_name: string;
    duration_minutes: number | null;
    duration_label: string;
    status: string;
    status_label: string;
}

interface HistoryRecord {
    id: number;
    maintenance_number: string;
    maintenance_type: string;
    scheduled_date: string | null;
    execution_date: string | null;
    worker_name: string;
    schedule: string;
    observations: string;
    document_name: string | null;
    document_url: string | null;
    status: string;
    status_label: string;
}

interface ParkHistory {
    id: number;
    code: string;
    name: string;
    maintenance_count: number;
    maintenance_types: string[];
    records: HistoryRecord[];
}

interface WorkerReportItem {
    id: number;
    code: string;
    full_name: string;
    position: string;
    is_active: boolean;
    maintenance_count: number;
    parks: string[];
    work_types: string[];
    hours: number;
    completed_count: number;
    cancelled_count: number;
}

interface AlertItem {
    id: number;
    maintenance_number: string;
    park_name: string;
    maintenance_type: string;
    scheduled_date: string | null;
}

interface AlertsReport {
    counts: {
        up_to_date: number;
        upcoming: number;
        due_today: number;
        overdue: number;
        in_progress: number;
    };
    up_to_date_parks: Array<{ id: number; code: string | null; name: string }>;
    upcoming: AlertItem[];
    due_today: AlertItem[];
    overdue: AlertItem[];
    in_progress: AlertItem[];
}

interface WaterParkItem {
    id: number;
    code: string;
    name: string;
    has_water_point: boolean;
    water_supply_type: string | null;
    water_point_status: string | null;
    observations: string | null;
}

interface WaterReport {
    counts: {
        with_water: number;
        without_water: number;
        operational: number;
        with_observations: number;
        non_operational: number;
    };
    parks: WaterParkItem[];
}

interface Props {
    institutionName: string;
    filters: Filters;
    filterOptions: {
        parks: ParkOption[];
        workers: WorkerOption[];
        maintenanceTypes: string[];
    };
    parksReport: ParkReportItem[];
    maintenanceReport: MaintenanceReportItem[];
    parkHistories: ParkHistory[];
    workerReport: WorkerReportItem[];
    alertsReport: AlertsReport;
    waterReport: WaterReport;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Reportes', href: '/reportes' },
];

const tabs: Array<{ id: ReportTab; label: string; shortLabel: string; icon: typeof Trees }> = [
    { id: 'general', label: 'Reporte general de parques', shortLabel: 'Parques', icon: Trees },
    { id: 'maintenances', label: 'Mantenimientos por periodo', shortLabel: 'Mantenimientos', icon: Wrench },
    { id: 'history', label: 'Historial por parque', shortLabel: 'Historial', icon: History },
    { id: 'workers', label: 'Reporte por trabajador', shortLabel: 'Trabajadores', icon: Users },
    { id: 'alerts', label: 'Reporte de alertas', shortLabel: 'Alertas', icon: BellRing },
    { id: 'water', label: 'Reporte de puntos de agua', shortLabel: 'Puntos de agua', icon: Droplets },
];

const exportType: Record<ReportTab, string> = {
    general: 'parks',
    maintenances: 'maintenances',
    history: 'history',
    workers: 'workers',
    alerts: 'alerts',
    water: 'water',
};

const statusStyles: Record<string, string> = {
    proximo: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
    pendiente: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    vencido: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
    en_proceso: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    finalizado: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    cancelado: 'bg-slate-200 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300',
};

function StatusBadge({ status, label }: { status: string; label: string }) {
    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[status] ?? statusStyles.cancelado}`}>
            {label}
        </span>
    );
}

function EmptyState({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
    return (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-3 rounded-2xl bg-slate-100 p-3 text-slate-400 dark:bg-muted">{icon}</div>
            <p className="text-foreground font-semibold">{title}</p>
            <p className="text-muted-foreground mt-1 max-w-sm text-xs">{description}</p>
        </div>
    );
}

function SummaryCard({ label, value, detail, icon, tone }: { label: string; value: number | string; detail: string; icon: ReactNode; tone: string }) {
    return (
        <div className="bg-card rounded-2xl border p-4 shadow-xs">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-muted-foreground text-xs font-medium">{label}</p>
                    <p className="text-foreground mt-1 text-2xl font-bold">{value}</p>
                    <p className="text-muted-foreground mt-0.5 text-[11px]">{detail}</p>
                </div>
                <div className={`rounded-xl p-3 ${tone}`}>{icon}</div>
            </div>
        </div>
    );
}

export default function ReportsIndex({
    institutionName,
    filters,
    filterOptions,
    parksReport,
    maintenanceReport,
    parkHistories,
    workerReport,
    alertsReport,
    waterReport,
}: Props) {
    const [activeTab, setActiveTab] = useState<ReportTab>('general');
    const [filterData, setFilterData] = useState<Filters>(filters);
    const [historyParkId, setHistoryParkId] = useState<string>(parkHistories[0]?.id.toString() ?? '');
    const [alertCategory, setAlertCategory] = useState<'upcoming' | 'due_today' | 'overdue' | 'in_progress' | 'up_to_date'>('overdue');

    const selectedHistory = parkHistories.find((park) => String(park.id) === historyParkId) ?? parkHistories[0];

    const exportQuery = useMemo(() => {
        const parameters = new URLSearchParams({ type: exportType[activeTab] });
        Object.entries(filters).forEach(([key, value]) => value && parameters.set(key, value));
        return parameters.toString();
    }, [activeTab, filters]);

    const applyFilters = (event: FormEvent) => {
        event.preventDefault();
        router.get('/reportes', filterData, { preserveScroll: true, preserveState: true, replace: true });
    };

    const clearFilters = () => {
        const empty: Filters = { date_from: '', date_to: '', park_id: '', maintenance_type: '', worker_id: '', status: '' };
        setFilterData(empty);
        router.get('/reportes', {}, { preserveScroll: true, preserveState: true, replace: true });
    };

    const alertItems = alertCategory === 'up_to_date' ? [] : alertsReport[alertCategory];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reportes - Sistema de Áreas Verdes" />

            <div className="flex flex-1 flex-col p-4 md:p-6 bg-slate-50/60 dark:bg-background">
                <div className="mx-auto w-full max-w-7xl flex flex-col gap-6">
                <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
                    <div>
                        <p className="text-muted-foreground text-xs">{institutionName}</p>
                        <h1 className="text-foreground mt-1 flex items-center gap-2.5 text-2xl font-bold tracking-tight md:text-3xl">
                            <BarChart3 className="h-8 w-8 text-emerald-600" />
                            Centro de Reportes
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Consulta, analiza y exporta la información operativa registrada en el sistema.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <a
                            href={`/reportes/exportar/csv?${exportQuery}`}
                            className="bg-background text-foreground hover:bg-muted inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold shadow-xs transition"
                        >
                            <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Excel (CSV)
                        </a>
                        <a
                            href={`/reportes/imprimir?${exportQuery}`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-background text-foreground hover:bg-muted inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold shadow-xs transition"
                        >
                            <Printer className="h-4 w-4 text-slate-600" /> Imprimir
                        </a>
                        <a
                            href={`/reportes/exportar/pdf?${exportQuery}`}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700"
                        >
                            <Download className="h-4 w-4" /> Exportar PDF
                        </a>
                    </div>
                </div>

                <nav className="bg-card flex gap-1 overflow-x-auto rounded-2xl border p-1.5 shadow-xs" aria-label="Tipos de reporte">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                title={tab.label}
                                className={`inline-flex min-w-max flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                                    active ? 'bg-emerald-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                            >
                                <Icon className="h-4 w-4" /> {tab.shortLabel}
                            </button>
                        );
                    })}
                </nav>

                {activeTab === 'general' && (
                    <section className="bg-card overflow-hidden rounded-2xl border shadow-xs">
                        <div className="flex items-center justify-between border-b p-5">
                            <div>
                                <h2 className="text-foreground font-bold">Inventario general de parques</h2>
                                <p className="text-muted-foreground mt-0.5 text-xs">Información consolidada de las áreas verdes registradas.</p>
                            </div>
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                {parksReport.length} registros
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1100px] text-left text-xs">
                                <thead className="bg-muted/40 text-muted-foreground border-b text-[11px] tracking-wider uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Código</th>
                                        <th className="px-4 py-3">Denominación</th>
                                        <th className="px-4 py-3">Tipo</th>
                                        <th className="px-4 py-3">Ubicación</th>
                                        <th className="px-4 py-3 text-right">Área pública</th>
                                        <th className="px-4 py-3 text-right">Área verde</th>
                                        <th className="px-4 py-3">Punto de agua</th>
                                        <th className="px-4 py-3 text-center">Conservación</th>
                                        <th className="px-4 py-3 text-center">Registro</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-border divide-y">
                                    {parksReport.map((park) => (
                                        <tr key={park.id} className="hover:bg-muted/25">
                                            <td className="px-4 py-3 font-mono font-semibold text-emerald-700 dark:text-emerald-400">{park.code}</td>
                                            <td className="text-foreground px-4 py-3 font-semibold">{park.name}</td>
                                            <td className="px-4 py-3">{park.green_area_type}</td>
                                            <td className="px-4 py-3">
                                                <span className="flex items-center gap-1.5">
                                                    <MapPin className="text-muted-foreground h-3.5 w-3.5" />
                                                    {park.location}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums">
                                                {park.public_use_area !== null ? `${park.public_use_area} m²` : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums">
                                                {park.green_area !== null ? `${park.green_area} m²` : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {park.has_water_point ? `Sí · ${park.water_point_status ?? 'Sin estado'}` : 'No'}
                                            </td>
                                            <td className="px-4 py-3 text-center capitalize">{park.conservation_status}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span
                                                    className={`rounded-full px-2 py-1 font-semibold ${park.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}
                                                >
                                                    {park.is_active ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {activeTab === 'maintenances' && (
                    <div className="space-y-5">
                        <form onSubmit={applyFilters} className="bg-card rounded-2xl border p-5 shadow-xs">
                            <div className="mb-4 flex items-center gap-2">
                                <Search className="h-4 w-4 text-emerald-600" />
                                <div>
                                    <h2 className="text-foreground text-sm font-bold">Filtros del periodo</h2>
                                    <p className="text-muted-foreground text-[11px]">
                                        La fecha realizada tiene prioridad; si no existe, se usa la fecha programada.
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
                                <label className="text-xs font-semibold">
                                    Fecha inicial
                                    <input
                                        type="date"
                                        value={filterData.date_from}
                                        onChange={(e) => setFilterData({ ...filterData, date_from: e.target.value })}
                                        className="bg-background mt-1 w-full rounded-xl border px-3 py-2 font-normal"
                                    />
                                </label>
                                <label className="text-xs font-semibold">
                                    Fecha final
                                    <input
                                        type="date"
                                        value={filterData.date_to}
                                        onChange={(e) => setFilterData({ ...filterData, date_to: e.target.value })}
                                        className="bg-background mt-1 w-full rounded-xl border px-3 py-2 font-normal"
                                    />
                                </label>
                                <label className="text-xs font-semibold">
                                    Parque
                                    <select
                                        value={filterData.park_id}
                                        onChange={(e) => setFilterData({ ...filterData, park_id: e.target.value })}
                                        className="bg-background mt-1 w-full rounded-xl border px-3 py-2 font-normal"
                                    >
                                        <option value="">Todos</option>
                                        {filterOptions.parks.map((park) => (
                                            <option key={park.id} value={park.id}>
                                                {park.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="text-xs font-semibold">
                                    Tipo
                                    <select
                                        value={filterData.maintenance_type}
                                        onChange={(e) => setFilterData({ ...filterData, maintenance_type: e.target.value })}
                                        className="bg-background mt-1 w-full rounded-xl border px-3 py-2 font-normal"
                                    >
                                        <option value="">Todos</option>
                                        {filterOptions.maintenanceTypes.map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="text-xs font-semibold">
                                    Trabajador
                                    <select
                                        value={filterData.worker_id}
                                        onChange={(e) => setFilterData({ ...filterData, worker_id: e.target.value })}
                                        className="bg-background mt-1 w-full rounded-xl border px-3 py-2 font-normal"
                                    >
                                        <option value="">Todos</option>
                                        {filterOptions.workers.map((worker) => (
                                            <option key={worker.id} value={worker.id}>
                                                {worker.full_name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="text-xs font-semibold">
                                    Estado
                                    <select
                                        value={filterData.status}
                                        onChange={(e) => setFilterData({ ...filterData, status: e.target.value })}
                                        className="bg-background mt-1 w-full rounded-xl border px-3 py-2 font-normal"
                                    >
                                        <option value="">Todos</option>
                                        <option value="proximo">Próximo</option>
                                        <option value="pendiente">Pendiente hoy</option>
                                        <option value="vencido">Vencido</option>
                                        <option value="en_proceso">En proceso</option>
                                        <option value="finalizado">Finalizado</option>
                                        <option value="cancelado">Cancelado</option>
                                    </select>
                                </label>
                            </div>
                            <div className="mt-4 flex justify-end gap-2 border-t pt-4">
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="hover:bg-muted inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" /> Limpiar
                                </button>
                                <button
                                    type="submit"
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                                >
                                    <Search className="h-3.5 w-3.5" /> Consultar
                                </button>
                            </div>
                        </form>

                        <section className="bg-card overflow-hidden rounded-2xl border shadow-xs">
                            <div className="flex items-center justify-between border-b p-5">
                                <div>
                                    <h2 className="text-foreground font-bold">Resultados de mantenimientos</h2>
                                    <p className="text-muted-foreground text-xs">Órdenes que coinciden con los criterios aplicados.</p>
                                </div>
                                <span className="text-muted-foreground text-xs font-semibold">{maintenanceReport.length} resultados</span>
                            </div>
                            {maintenanceReport.length ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[950px] text-left text-xs">
                                        <thead className="bg-muted/40 text-muted-foreground border-b text-[11px] tracking-wider uppercase">
                                            <tr>
                                                <th className="px-4 py-3">Programada</th>
                                                <th className="px-4 py-3">Realizada</th>
                                                <th className="px-4 py-3">Parque</th>
                                                <th className="px-4 py-3">Tipo</th>
                                                <th className="px-4 py-3">Trabajador</th>
                                                <th className="px-4 py-3">Duración</th>
                                                <th className="px-4 py-3 text-center">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-border divide-y">
                                            {maintenanceReport.map((item) => (
                                                <tr key={item.id} className="hover:bg-muted/25">
                                                    <td className="px-4 py-3">{item.scheduled_date ?? '—'}</td>
                                                    <td className="px-4 py-3 font-medium">{item.execution_date ?? '—'}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-foreground font-semibold">{item.park_name}</span>
                                                        <span className="text-muted-foreground block font-mono text-[10px]">{item.park_code}</span>
                                                    </td>
                                                    <td className="px-4 py-3">{item.maintenance_type}</td>
                                                    <td className="px-4 py-3">{item.worker_name}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-flex items-center gap-1">
                                                            <Clock className="text-muted-foreground h-3.5 w-3.5" />
                                                            {item.duration_label}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <StatusBadge status={item.status} label={item.status_label} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <EmptyState
                                    icon={<Search className="h-6 w-6" />}
                                    title="Sin resultados"
                                    description="Modifique los filtros para consultar otro periodo o criterio."
                                />
                            )}
                        </section>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-5">
                        <section className="bg-card rounded-2xl border p-5 shadow-xs">
                            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                                <div>
                                    <h2 className="text-foreground font-bold">Historial por parque</h2>
                                    <p className="text-muted-foreground mt-1 text-xs">
                                        Consulta la trazabilidad completa de las labores realizadas y programadas.
                                    </p>
                                </div>
                                <label className="w-full text-xs font-semibold sm:max-w-sm">
                                    Seleccionar parque
                                    <select
                                        value={historyParkId}
                                        onChange={(e) => setHistoryParkId(e.target.value)}
                                        className="bg-background mt-1 w-full rounded-xl border px-3 py-2 font-normal"
                                    >
                                        {parkHistories.map((park) => (
                                            <option key={park.id} value={park.id}>
                                                {park.code} · {park.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                        </section>
                        {selectedHistory ? (
                            <section className="bg-card overflow-hidden rounded-2xl border shadow-xs">
                                <div className="border-b p-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="font-mono text-xs font-semibold text-emerald-600">{selectedHistory.code}</p>
                                            <h2 className="text-foreground text-lg font-bold">{selectedHistory.name}</h2>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-foreground text-2xl font-bold">{selectedHistory.maintenance_count}</p>
                                            <p className="text-muted-foreground text-[11px]">mantenimientos registrados</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        {selectedHistory.maintenance_types.map((type) => (
                                            <span
                                                key={type}
                                                className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                            >
                                                {type}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                {selectedHistory.records.length ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1050px] text-left text-xs">
                                            <thead className="bg-muted/40 text-muted-foreground border-b text-[11px] tracking-wider uppercase">
                                                <tr>
                                                    <th className="px-4 py-3">Tipo</th>
                                                    <th className="px-4 py-3">Fechas</th>
                                                    <th className="px-4 py-3">Trabajador</th>
                                                    <th className="px-4 py-3">Horario</th>
                                                    <th className="px-4 py-3">Observaciones</th>
                                                    <th className="px-4 py-3">Documento</th>
                                                    <th className="px-4 py-3 text-center">Estado</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-border divide-y">
                                                {selectedHistory.records.map((record) => (
                                                    <tr key={record.id} className="hover:bg-muted/25">
                                                        <td className="px-4 py-3 font-semibold">{record.maintenance_type}</td>
                                                        <td className="px-4 py-3">
                                                            <span className="block">Programada: {record.scheduled_date ?? '—'}</span>
                                                            <span className="text-muted-foreground block">
                                                                Realizada: {record.execution_date ?? '—'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">{record.worker_name}</td>
                                                        <td className="px-4 py-3">{record.schedule}</td>
                                                        <td className="max-w-xs px-4 py-3">{record.observations}</td>
                                                        <td className="px-4 py-3">
                                                            {record.document_url ? (
                                                                <a
                                                                    href={record.document_url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline"
                                                                >
                                                                    <FileText className="h-3.5 w-3.5" />
                                                                    {record.document_name ?? 'Abrir'}
                                                                </a>
                                                            ) : (
                                                                <span className="text-muted-foreground">Sin documento</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <StatusBadge status={record.status} label={record.status_label} />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <EmptyState
                                        icon={<History className="h-6 w-6" />}
                                        title="Sin historial"
                                        description="Este parque todavía no tiene mantenimientos registrados."
                                    />
                                )}
                            </section>
                        ) : (
                            <EmptyState
                                icon={<Trees className="h-6 w-6" />}
                                title="Sin parques"
                                description="Registre un parque para consultar su historial."
                            />
                        )}
                    </div>
                )}

                {activeTab === 'workers' && (
                    <section className="bg-card overflow-hidden rounded-2xl border shadow-xs">
                        <div className="border-b p-5">
                            <h2 className="text-foreground font-bold">Actividad por trabajador</h2>
                            <p className="text-muted-foreground mt-1 text-xs">
                                Resumen referencial de labores. Esta información no constituye control de asistencia, planilla ni cálculo de pagos.
                            </p>
                        </div>
                        {workerReport.length ? (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1050px] text-left text-xs">
                                    <thead className="bg-muted/40 text-muted-foreground border-b text-[11px] tracking-wider uppercase">
                                        <tr>
                                            <th className="px-4 py-3">Trabajador</th>
                                            <th className="px-4 py-3 text-center">Mantenimientos</th>
                                            <th className="px-4 py-3">Parques atendidos</th>
                                            <th className="px-4 py-3">Tipos de trabajo</th>
                                            <th className="px-4 py-3 text-center">Horas registradas</th>
                                            <th className="px-4 py-3 text-center">Finalizados</th>
                                            <th className="px-4 py-3 text-center">Cancelados</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-border divide-y">
                                        {workerReport.map((worker) => (
                                            <tr key={worker.id} className="hover:bg-muted/25">
                                                <td className="px-4 py-3">
                                                    <span className="text-foreground font-semibold">{worker.full_name}</span>
                                                    <span className="text-muted-foreground block text-[11px]">
                                                        {worker.code} · {worker.position}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center text-base font-bold">{worker.maintenance_count}</td>
                                                <td className="max-w-xs px-4 py-3">{worker.parks.length ? worker.parks.join(', ') : '—'}</td>
                                                <td className="max-w-xs px-4 py-3">
                                                    {worker.work_types.length ? worker.work_types.join(', ') : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-center font-semibold">{worker.hours} h</td>
                                                <td className="px-4 py-3 text-center text-emerald-700">{worker.completed_count}</td>
                                                <td className="px-4 py-3 text-center text-slate-600">{worker.cancelled_count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <EmptyState
                                icon={<Users className="h-6 w-6" />}
                                title="Sin trabajadores"
                                description="Registre trabajadores para generar este reporte."
                            />
                        )}
                    </section>
                )}

                {activeTab === 'alerts' && (
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                            <button type="button" onClick={() => setAlertCategory('up_to_date')}>
                                <SummaryCard
                                    label="Parques al día"
                                    value={alertsReport.counts.up_to_date}
                                    detail="Sin atención vencida"
                                    icon={<CheckCircle2 className="h-5 w-5" />}
                                    tone="bg-emerald-100 text-emerald-700"
                                />
                            </button>
                            <button type="button" onClick={() => setAlertCategory('upcoming')}>
                                <SummaryCard
                                    label="Próximos"
                                    value={alertsReport.counts.upcoming}
                                    detail="Programados a futuro"
                                    icon={<CalendarDays className="h-5 w-5" />}
                                    tone="bg-violet-100 text-violet-700"
                                />
                            </button>
                            <button type="button" onClick={() => setAlertCategory('due_today')}>
                                <SummaryCard
                                    label="Pendientes hoy"
                                    value={alertsReport.counts.due_today}
                                    detail="Requieren atención"
                                    icon={<Clock className="h-5 w-5" />}
                                    tone="bg-amber-100 text-amber-700"
                                />
                            </button>
                            <button type="button" onClick={() => setAlertCategory('overdue')}>
                                <SummaryCard
                                    label="Vencidos"
                                    value={alertsReport.counts.overdue}
                                    detail="Fuera de fecha"
                                    icon={<AlertTriangle className="h-5 w-5" />}
                                    tone="bg-red-100 text-red-700"
                                />
                            </button>
                            <button type="button" onClick={() => setAlertCategory('in_progress')}>
                                <SummaryCard
                                    label="En proceso"
                                    value={alertsReport.counts.in_progress}
                                    detail="Labores en curso"
                                    icon={<PlayCircle className="h-5 w-5" />}
                                    tone="bg-blue-100 text-blue-700"
                                />
                            </button>
                        </div>
                        <section className="bg-card overflow-hidden rounded-2xl border shadow-xs">
                            <div className="border-b p-5">
                                <h2 className="text-foreground font-bold capitalize">
                                    Detalle:{' '}
                                    {alertCategory === 'up_to_date'
                                        ? 'parques al día'
                                        : alertCategory === 'due_today'
                                          ? 'pendientes hoy'
                                          : alertCategory === 'in_progress'
                                            ? 'en proceso'
                                            : alertCategory === 'upcoming'
                                              ? 'próximos'
                                              : 'vencidos'}
                                </h2>
                                <p className="text-muted-foreground text-xs">Seleccione una tarjeta para consultar su detalle.</p>
                            </div>
                            {alertCategory === 'up_to_date' ? (
                                alertsReport.up_to_date_parks.length ? (
                                    <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
                                        {alertsReport.up_to_date_parks.map((park) => (
                                            <div key={park.id} className="rounded-xl border bg-emerald-50/50 p-3 dark:bg-emerald-950/20">
                                                <p className="text-foreground font-semibold">{park.name}</p>
                                                <p className="font-mono text-[11px] text-emerald-700">{park.code}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState
                                        icon={<CheckCircle2 className="h-6 w-6" />}
                                        title="Sin parques al día"
                                        description="Todos los parques registrados tienen alguna atención pendiente."
                                    />
                                )
                            ) : alertItems.length ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[720px] text-left text-xs">
                                        <thead className="bg-muted/40 text-muted-foreground border-b text-[11px] tracking-wider uppercase">
                                            <tr>
                                                <th className="px-4 py-3">Orden</th>
                                                <th className="px-4 py-3">Parque</th>
                                                <th className="px-4 py-3">Tipo</th>
                                                <th className="px-4 py-3">Fecha programada</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-border divide-y">
                                            {alertItems.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="px-4 py-3 font-mono font-semibold">{item.maintenance_number}</td>
                                                    <td className="px-4 py-3 font-semibold">{item.park_name}</td>
                                                    <td className="px-4 py-3">{item.maintenance_type}</td>
                                                    <td className="px-4 py-3">{item.scheduled_date ?? '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <EmptyState
                                    icon={<BellRing className="h-6 w-6" />}
                                    title="Sin alertas en esta categoría"
                                    description="No existen mantenimientos que requieran mostrarse aquí."
                                />
                            )}
                        </section>
                    </div>
                )}

                {activeTab === 'water' && (
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                            <SummaryCard
                                label="Con punto de agua"
                                value={waterReport.counts.with_water}
                                detail="Parques abastecidos"
                                icon={<Droplets className="h-5 w-5" />}
                                tone="bg-blue-100 text-blue-700"
                            />
                            <SummaryCard
                                label="Sin punto de agua"
                                value={waterReport.counts.without_water}
                                detail="Requieren alternativa"
                                icon={<Droplets className="h-5 w-5" />}
                                tone="bg-slate-100 text-slate-600"
                            />
                            <SummaryCard
                                label="Operativos"
                                value={waterReport.counts.operational}
                                detail="Puntos funcionales"
                                icon={<CheckCircle2 className="h-5 w-5" />}
                                tone="bg-emerald-100 text-emerald-700"
                            />
                            <SummaryCard
                                label="Con observaciones"
                                value={waterReport.counts.with_observations}
                                detail="Requieren revisión"
                                icon={<FileText className="h-5 w-5" />}
                                tone="bg-amber-100 text-amber-700"
                            />
                            <SummaryCard
                                label="No operativos"
                                value={waterReport.counts.non_operational}
                                detail="Requieren atención"
                                icon={<AlertTriangle className="h-5 w-5" />}
                                tone="bg-red-100 text-red-700"
                            />
                        </div>
                        <section className="bg-card overflow-hidden rounded-2xl border shadow-xs">
                            <div className="border-b p-5">
                                <h2 className="text-foreground font-bold">Estado de los puntos de agua</h2>
                                <p className="text-muted-foreground text-xs">Disponibilidad y condición del abastecimiento registrado por parque.</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[850px] text-left text-xs">
                                    <thead className="bg-muted/40 text-muted-foreground border-b text-[11px] tracking-wider uppercase">
                                        <tr>
                                            <th className="px-4 py-3">Código</th>
                                            <th className="px-4 py-3">Parque</th>
                                            <th className="px-4 py-3 text-center">Punto de agua</th>
                                            <th className="px-4 py-3">Abastecimiento</th>
                                            <th className="px-4 py-3">Estado</th>
                                            <th className="px-4 py-3">Observaciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-border divide-y">
                                        {waterReport.parks.map((park) => (
                                            <tr key={park.id} className="hover:bg-muted/25">
                                                <td className="px-4 py-3 font-mono font-semibold text-emerald-700">{park.code}</td>
                                                <td className="px-4 py-3 font-semibold">{park.name}</td>
                                                <td className="px-4 py-3 text-center">{park.has_water_point ? 'Sí' : 'No'}</td>
                                                <td className="px-4 py-3">{park.water_supply_type ?? '—'}</td>
                                                <td className="px-4 py-3 capitalize">{park.water_point_status ?? '—'}</td>
                                                <td className="max-w-sm px-4 py-3">{park.observations ?? '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                )}
                </div>
            </div>
        </AppLayout>
    );
}
