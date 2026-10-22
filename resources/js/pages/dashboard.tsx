import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    CalendarCheck2,
    CalendarClock,
    CalendarDays,
    CheckCircle2,
    CircleCheckBig,
    Clock3,
    DropletOff,
    Droplets,
    FileBarChart,
    Leaf,
    Plus,
    TimerReset,
    Trees,
    UserPlus,
    Wrench,
    XCircle,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

interface Indicators {
    parks_total: number;
    parks_active: number;
    parks_inactive: number;
    parks_with_water: number;
    parks_without_water: number;
    maintenances_scheduled: number;
    maintenances_upcoming: number;
    maintenances_pending_today: number;
    maintenances_overdue: number;
    maintenances_in_progress: number;
    maintenances_completed_month: number;
}

interface AlertCounts {
    al_dia: number;
    proximo: number;
    pendiente: number;
    vencido: number;
    en_proceso: number;
}

interface UpcomingMaintenance {
    id: number;
    maintenance_number: string;
    park_name: string;
    park_code: string;
    green_area_type: string;
    maintenance_type: string;
    is_extraordinary: boolean;
    reason: string | null;
    last_maintenance: string | null;
    next_date: string | null;
    remaining_days: number | null;
    remaining_label: string;
    status: keyof AlertCounts;
    is_in_progress: boolean;
}

interface Props {
    institution: {
        municipality_name: string;
        department_name: string;
        logo_url: string | null;
    };
    indicators: Indicators;
    alertCounts: AlertCounts;
    upcomingMaintenances: UpcomingMaintenance[];
}

const statusMeta: Record<keyof AlertCounts, { label: string; className: string }> = {
    al_dia: {
        label: 'Al día',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
    },
    proximo: {
        label: 'Próximo',
        className: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
    },
    pendiente: {
        label: 'Pendiente hoy',
        className: 'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300',
    },
    vencido: {
        label: 'Vencido',
        className: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300',
    },
    en_proceso: {
        label: 'En mantenimiento',
        className: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300',
    },
};

function MetricCard({ label, value, detail, icon: Icon, tone }: { label: string; value: number; detail: string; icon: typeof Trees; tone: string }) {
    return (
        <article className="bg-card rounded-2xl border p-4 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-muted-foreground text-xs font-medium">{label}</p>
                    <p className="text-foreground mt-2 text-3xl font-bold tabular-nums">{value}</p>
                </div>
                <div className={`shrink-0 rounded-xl p-2.5 ${tone}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <p className="text-muted-foreground mt-3 text-[11px] leading-4">{detail}</p>
        </article>
    );
}

function StatusBadge({ status }: { status: keyof AlertCounts }) {
    const meta = statusMeta[status];

    return (
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${meta.className}`}>
            {meta.label}
        </span>
    );
}

export default function Dashboard({ institution, indicators, alertCounts, upcomingMaintenances }: Props) {
    const currentDate = new Intl.DateTimeFormat('es-PE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date());

    const parkMetrics = [
        {
            label: 'Parques registrados',
            value: indicators.parks_total,
            detail: 'Total del catálogo municipal',
            icon: Trees,
            tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
        },
        {
            label: 'Parques activos',
            value: indicators.parks_active,
            detail: 'Disponibles para programación',
            icon: CircleCheckBig,
            tone: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
        },
        {
            label: 'Parques inactivos',
            value: indicators.parks_inactive,
            detail: 'Registros fuera de operación',
            icon: XCircle,
            tone: 'bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300',
        },
        {
            label: 'Con punto de agua',
            value: indicators.parks_with_water,
            detail: 'Áreas con abastecimiento registrado',
            icon: Droplets,
            tone: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
        },
        {
            label: 'Sin punto de agua',
            value: indicators.parks_without_water,
            detail: 'Áreas que requieren abastecimiento',
            icon: DropletOff,
            tone: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
        },
    ];

    const maintenanceMetrics = [
        {
            label: 'Programados',
            value: indicators.maintenances_scheduled,
            detail: 'Actividades aún por ejecutar',
            icon: CalendarDays,
            tone: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
        },
        {
            label: 'Próximos',
            value: indicators.maintenances_upcoming,
            detail: 'Dentro del rango de anticipación',
            icon: CalendarClock,
            tone: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
        },
        {
            label: 'Pendientes hoy',
            value: indicators.maintenances_pending_today,
            detail: 'Programados para la fecha actual',
            icon: AlertCircle,
            tone: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
        },
        {
            label: 'Vencidos',
            value: indicators.maintenances_overdue,
            detail: 'Fecha superada sin finalización',
            icon: AlertTriangle,
            tone: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
        },
        {
            label: 'En mantenimiento',
            value: indicators.maintenances_in_progress,
            detail: 'Trabajos iniciados en campo',
            icon: Wrench,
            tone: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
        },
        {
            label: 'Finalizados este mes',
            value: indicators.maintenances_completed_month,
            detail: 'Trabajos concluidos en el periodo',
            icon: CheckCircle2,
            tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
        },
    ];

    const alerts = [
        {
            key: 'al_dia' as const,
            title: 'Al día',
            description: 'Fuera del rango de alerta.',
            icon: CheckCircle2,
            accent: 'text-emerald-600',
            background: 'bg-emerald-50 dark:bg-emerald-950/50',
        },
        {
            key: 'proximo' as const,
            title: 'Próximo',
            description: 'Dentro de los días de anticipación.',
            icon: CalendarClock,
            accent: 'text-amber-600',
            background: 'bg-amber-50 dark:bg-amber-950/50',
        },
        {
            key: 'pendiente' as const,
            title: 'Pendiente para hoy',
            description: 'Su fecha programada es hoy.',
            icon: Clock3,
            accent: 'text-orange-600',
            background: 'bg-orange-50 dark:bg-orange-950/50',
        },
        {
            key: 'vencido' as const,
            title: 'Vencido',
            description: 'La fecha pasó y sigue pendiente.',
            icon: AlertTriangle,
            accent: 'text-rose-600',
            background: 'bg-rose-50 dark:bg-rose-950/50',
        },
        {
            key: 'en_proceso' as const,
            title: 'En mantenimiento',
            description: 'Trabajo iniciado sin finalización.',
            icon: Wrench,
            accent: 'text-sky-600',
            background: 'bg-sky-50 dark:bg-sky-950/50',
        },
    ];

    const quickActions = [
        {
            title: 'Registrar parque',
            detail: 'Agregar un área verde',
            href: '/parques?accion=registrar',
            icon: Plus,
            className: 'bg-emerald-600 hover:bg-emerald-700',
        },
        {
            title: 'Registrar trabajador',
            detail: 'Agregar personal al catálogo',
            href: '/trabajadores?accion=registrar',
            icon: UserPlus,
            className: 'bg-blue-600 hover:bg-blue-700',
        },
        {
            title: 'Mantenimiento extraordinario',
            detail: 'Programar una actividad puntual',
            href: '/mantenimientos?accion=extraordinario',
            icon: CalendarCheck2,
            className: 'bg-amber-600 hover:bg-amber-700',
        },
        {
            title: 'Ver mantenimientos vencidos',
            detail: `${indicators.maintenances_overdue} requieren atención`,
            href: '/mantenimientos?estado=vencidos',
            icon: AlertTriangle,
            className: 'bg-rose-600 hover:bg-rose-700',
        },
        {
            title: 'Generar reporte',
            detail: 'Consultar y exportar información',
            href: '/reportes',
            icon: FileBarChart,
            className: 'bg-slate-700 hover:bg-slate-800 dark:bg-neutral-700 dark:hover:bg-neutral-600',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard | Gestión de Áreas Verdes" />

            <div className="flex min-h-full flex-1 flex-col gap-6 bg-slate-50/70 p-4 md:p-6 dark:bg-background">
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-800 to-green-600 p-6 text-white shadow-lg md:p-8">
                    <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/15">
                                {institution.logo_url ? (
                                    <img src={institution.logo_url} alt="Logotipo institucional" className="h-full w-full object-contain p-1" />
                                ) : (
                                    <Leaf className="h-7 w-7" />
                                )}
                            </div>
                            <div>
                                <p className="text-xs font-semibold tracking-[0.18em] text-emerald-100 uppercase">Resumen operativo</p>
                                <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Dashboard de áreas verdes</h1>
                                <p className="mt-2 text-sm text-emerald-50">
                                    {institution.municipality_name} · {institution.department_name}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                            <CalendarDays className="h-5 w-5 text-emerald-100" />
                            <div>
                                <p className="text-[11px] text-emerald-100">Fecha de evaluación</p>
                                <p className="text-sm font-semibold capitalize">{currentDate}</p>
                            </div>
                        </div>
                    </div>
                    <Trees className="absolute -right-10 -bottom-16 h-64 w-64 text-white/5" />
                </section>

                <section>
                    <div className="mb-4">
                        <h2 className="text-foreground text-lg font-bold">Estado de los parques</h2>
                        <p className="text-muted-foreground text-sm">Cobertura y disponibilidad del catálogo municipal.</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        {parkMetrics.map((metric) => (
                            <MetricCard key={metric.label} {...metric} />
                        ))}
                    </div>
                </section>

                <section>
                    <div className="mb-4">
                        <h2 className="text-foreground text-lg font-bold">Estado de los mantenimientos</h2>
                        <p className="text-muted-foreground text-sm">Seguimiento de actividades programadas y ejecutadas.</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                        {maintenanceMetrics.map((metric) => (
                            <MetricCard key={metric.label} {...metric} />
                        ))}
                    </div>
                </section>

                <section className="bg-card rounded-2xl border p-5 shadow-xs">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="rounded-xl bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                            <TimerReset className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-foreground font-bold">Alertas de mantenimiento</h2>
                            <p className="text-muted-foreground text-xs">
                                Clasificación calculada con la fecha programada y los días de anticipación configurados.
                            </p>
                        </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        {alerts.map(({ key, title, description, icon: Icon, accent, background }) => (
                            <div key={key} className={`rounded-xl border p-4 ${background}`}>
                                <div className="flex items-center justify-between gap-3">
                                    <Icon className={`h-5 w-5 ${accent}`} />
                                    <span className={`text-2xl font-bold tabular-nums ${accent}`}>{alertCounts[key]}</span>
                                </div>
                                <p className="text-foreground mt-3 text-sm font-bold">{title}</p>
                                <p className="text-muted-foreground mt-1 text-[11px] leading-4">{description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_320px]">
                    <section className="bg-card overflow-hidden rounded-2xl border shadow-xs">
                        <div className="flex flex-col justify-between gap-3 border-b p-5 sm:flex-row sm:items-center">
                            <div>
                                <h2 className="text-foreground font-bold">Próximos mantenimientos</h2>
                                <p className="text-muted-foreground mt-1 text-xs">Actividades que requieren seguimiento, ordenadas por prioridad.</p>
                            </div>
                            <Link
                                href="/mantenimientos"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
                            >
                                Ver bandeja completa <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>

                        {upcomingMaintenances.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1040px] text-left text-xs">
                                    <thead className="bg-muted/60 text-muted-foreground text-[10px] tracking-wide uppercase">
                                        <tr>
                                            <th className="px-4 py-3">Parque</th>
                                            <th className="px-4 py-3">Tipo de área verde</th>
                                            <th className="px-4 py-3">Mantenimiento</th>
                                            <th className="px-4 py-3">Último mantenimiento</th>
                                            <th className="px-4 py-3">Próxima fecha</th>
                                            <th className="px-4 py-3">Plazo</th>
                                            <th className="px-4 py-3">Estado</th>
                                            <th className="px-4 py-3 text-right">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {upcomingMaintenances.map((maintenance) => (
                                            <tr key={maintenance.id} className="hover:bg-muted/30 transition">
                                                <td className="px-4 py-3.5">
                                                    <p className="text-foreground font-semibold">{maintenance.park_name}</p>
                                                    <p className="text-muted-foreground mt-0.5 font-mono text-[10px]">
                                                        {maintenance.park_code || maintenance.maintenance_number}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3.5">{maintenance.green_area_type}</td>
                                                <td className="px-4 py-3.5 font-medium">
                                                    <span>{maintenance.maintenance_type}</span>
                                                    {maintenance.is_extraordinary && (
                                                        <span className="mt-1 block w-fit rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                                            Extraordinario
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="text-muted-foreground px-4 py-3.5">
                                                    {maintenance.last_maintenance ?? 'Sin registro previo'}
                                                </td>
                                                <td className="px-4 py-3.5 font-semibold">{maintenance.next_date ?? 'Sin fecha'}</td>
                                                <td
                                                    className={`px-4 py-3.5 font-semibold ${maintenance.remaining_days !== null && maintenance.remaining_days < 0 ? 'text-rose-600' : maintenance.remaining_days === 0 ? 'text-orange-600' : 'text-foreground'}`}
                                                >
                                                    {maintenance.remaining_label}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <StatusBadge status={maintenance.status} />
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    <Link
                                                        href={`/mantenimientos?${maintenance.is_in_progress ? 'finalizar' : 'atender'}=${maintenance.id}`}
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 font-semibold text-white transition hover:bg-emerald-700"
                                                    >
                                                        <Wrench className="h-3.5 w-3.5" /> {maintenance.is_in_progress ? 'Finalizar' : 'Atender'}
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
                                <div className="rounded-full bg-emerald-100 p-4 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                    <CheckCircle2 className="h-7 w-7" />
                                </div>
                                <h3 className="mt-4 text-sm font-bold">No hay mantenimientos por atender</h3>
                                <p className="text-muted-foreground mt-1 max-w-sm text-xs">
                                    Las nuevas programaciones aparecerán aquí cuando se generen desde las reglas de configuración.
                                </p>
                            </div>
                        )}
                    </section>

                    <aside className="bg-card rounded-2xl border p-5 shadow-xs">
                        <h2 className="text-foreground font-bold">Acciones rápidas</h2>
                        <p className="text-muted-foreground mt-1 text-xs">Accede directamente a las operaciones frecuentes.</p>
                        <div className="mt-5 space-y-3">
                            {quickActions.map(({ title, detail, href, icon: Icon, className }) => (
                                <Link
                                    key={title}
                                    href={href}
                                    className="group hover:bg-muted/30 flex items-center gap-3 rounded-xl border p-3 transition hover:border-emerald-300"
                                >
                                    <div className={`rounded-lg p-2.5 text-white transition ${className}`}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-foreground text-xs font-bold">{title}</p>
                                        <p className="text-muted-foreground mt-0.5 truncate text-[10px]">{detail}</p>
                                    </div>
                                    <ArrowRight className="text-muted-foreground h-4 w-4 transition group-hover:translate-x-0.5 group-hover:text-emerald-600" />
                                </Link>
                            ))}
                        </div>
                    </aside>
                </div>

                <footer className="text-muted-foreground flex flex-col justify-between gap-1 border-t pt-4 text-[11px] sm:flex-row">
                    <p>Sistema de Gestión y Monitoreo de Áreas Verdes</p>
                    <p>{institution.municipality_name}</p>
                </footer>
            </div>
        </AppLayout>
    );
}
