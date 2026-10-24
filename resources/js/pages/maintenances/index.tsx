import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    Calendar,
    CheckCircle2,
    Clock,
    Droplets,
    Eye,
    FileText,
    Layers,
    Play,
    Printer,
    RefreshCw,
    Search,
    Sparkles,
    Trash2,
    Trees,
    UserCheck,
    Wrench,
    X,
    Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

// Tipos de datos
export interface MaintenanceItem {
    id: number;
    maintenance_number: string;
    park_id: number;
    park_name: string;
    park_code: string;
    green_area_type: string;
    park_zone: string;
    park_address: string;
    maintenance_type: string;
    is_extraordinary: boolean;
    reason: string | null;
    frequency_days: number | null;
    scheduled_date: string | null;
    scheduled_date_formatted: string;
    alert_date: string | null;
    alert_date_formatted: string | null;
    advance_days: number;
    is_alert_active: boolean;
    execution_date: string | null;
    execution_date_formatted: string | null;
    worker_id: number | null;
    responsible_worker: string;
    start_time: string | null;
    end_time: string | null;
    duration_minutes: number | null;
    status: string;
    computed_status: string;
    initial_observation: string | null;
    work_description: string | null;
    result: string | null;
    photo_before_url: string | null;
    photo_after_url: string | null;
    observations: string | null;
    document_name: string | null;
    document_url: string | null;
}

export interface ParkOption {
    id: number;
    code: string;
    name: string;
    green_area_type: string;
    address: string;
    zone: string;
    schedules?: Array<{
        id: number;
        maintenance_type: string;
        frequency_days: number;
        next_scheduled_date: string;
    }>;
}

export interface RuleOption {
    id: number;
    green_area_type: string;
    maintenance_type: string;
    frequency_days: number;
}

export interface WorkerOption {
    id: number;
    full_name: string;
    position: string;
    crew: string | null;
}

interface Props {
    records: MaintenanceItem[];
    counts: {
        todos: number;
        proximos: number;
        pendientes: number;
        vencidos: number;
        en_proceso: number;
        finalizados: number;
        cancelados: number;
    };
    parks: ParkOption[];
    rules: RuleOption[];
    tiposMantenimiento: string[];
    workers: WorkerOption[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Mantenimientos', href: '/mantenimientos' },
];

export default function MaintenanceIndex({ records, counts, parks, tiposMantenimiento, workers }: Props) {
    // Filtros de navegación
    const [pestañaActiva, setPestañaActiva] = useState<string>('todos');
    const [busqueda, setBusqueda] = useState<string>('');
    const [filtroParque, setFiltroParque] = useState<string>('todos');
    const [filtroTipo, setFiltroTipo] = useState<string>('todos');

    // Modales
    const [modalExtraordinarioAbierto, setModalExtraordinarioAbierto] = useState(false);
    const [modalAtenderAbierto, setModalAtenderAbierto] = useState(false);
    const [modalIniciarAbierto, setModalIniciarAbierto] = useState(false);
    const [modalFinalizarAbierto, setModalFinalizarAbierto] = useState(false);
    const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
    const [modalCancelarAbierto, setModalCancelarAbierto] = useState(false);

    // Registro en gestión
    const [mantenimientoSeleccionado, setMantenimientoSeleccionado] = useState<MaintenanceItem | null>(null);

    // Formulario de Mantenimiento Extraordinario
    const formExtraordinario = useForm({
        park_id: parks.length > 0 ? parks[0].id : '',
        maintenance_type: '',
        scheduled_date: new Date().toISOString().split('T')[0],
        advance_days: 1,
        reason: '',
        worker_id: '',
        observations: '',
    });

    // Formulario de Atender Mantenimiento Completo
    const formAtender = useForm({
        worker_id: '',
        execution_date: new Date().toISOString().split('T')[0],
        start_time: '08:00',
        end_time: '10:30',
        work_description: '',
        result: 'Óptimo',
        observations: '',
        status: 'finalizado',
        photo_before: null as File | null,
        photo_after: null as File | null,
    });

    // Formulario de Iniciar Mantenimiento
    const formIniciar = useForm({
        execution_date: new Date().toISOString().split('T')[0],
        start_time: new Date().toTimeString().substring(0, 5),
        worker_id: '',
        initial_observation: '',
        photo_before: null as File | null,
    });

    // Formulario de Finalizar Mantenimiento
    const formFinalizar = useForm({
        execution_date: new Date().toISOString().split('T')[0],
        start_time: '08:00',
        end_time: new Date().toTimeString().substring(0, 5),
        work_description: '',
        result: 'Óptimo',
        observations: '',
        worker_id: '',
        photo_after: null as File | null,
    });

    // Formulario de Cancelar Mantenimiento
    const formCancelar = useForm({
        reason: '',
    });

    // Cálculo de duración en vivo en modal Atender
    const duracionAtenderMinutos = useMemo(() => {
        if (!formAtender.data.start_time || !formAtender.data.end_time) return 0;
        const [h1, m1] = formAtender.data.start_time.split(':').map(Number);
        const [h2, m2] = formAtender.data.end_time.split(':').map(Number);
        const mins = h2 * 60 + m2 - (h1 * 60 + m1);
        return mins > 0 ? mins : 0;
    }, [formAtender.data.start_time, formAtender.data.end_time]);

    // Cálculo de duración en vivo en modal Finalizar
    const duracionFinalizarMinutos = useMemo(() => {
        if (!formFinalizar.data.start_time || !formFinalizar.data.end_time) return 0;
        const [h1, m1] = formFinalizar.data.start_time.split(':').map(Number);
        const [h2, m2] = formFinalizar.data.end_time.split(':').map(Number);
        const mins = h2 * 60 + m2 - (h1 * 60 + m1);
        return mins > 0 ? mins : 0;
    }, [formFinalizar.data.start_time, formFinalizar.data.end_time]);

    // Registros filtrados según pestaña y búsqueda
    const registrosFiltrados = useMemo(() => {
        return records.filter((item) => {
            // Filtro por pestaña de estado
            if (pestañaActiva === 'proximos' && item.computed_status !== 'proximo') return false;
            if (pestañaActiva === 'pendientes' && !['pendiente', 'vencido'].includes(item.computed_status)) return false;
            if (pestañaActiva === 'vencidos' && item.computed_status !== 'vencido') return false;
            if (pestañaActiva === 'en_proceso' && item.computed_status !== 'en_proceso') return false;
            if (pestañaActiva === 'finalizados' && item.computed_status !== 'finalizado') return false;
            if (pestañaActiva === 'cancelados' && item.computed_status !== 'cancelado') return false;

            // Filtro por parque
            if (filtroParque !== 'todos' && String(item.park_id) !== filtroParque) return false;

            // Filtro por tipo de mantenimiento
            if (filtroTipo !== 'todos' && item.maintenance_type !== filtroTipo) return false;

            // Filtro por texto
            if (busqueda.trim() !== '') {
                const query = busqueda.toLowerCase();
                const coincideNum = item.maintenance_number.toLowerCase().includes(query);
                const coincideParque = item.park_name.toLowerCase().includes(query);
                const coincideCod = item.park_code.toLowerCase().includes(query);
                const coincideTipo = item.maintenance_type.toLowerCase().includes(query);
                const coincideTrabajador = item.responsible_worker.toLowerCase().includes(query);

                return coincideNum || coincideParque || coincideCod || coincideTipo || coincideTrabajador;
            }

            return true;
        });
    }, [records, pestañaActiva, filtroParque, filtroTipo, busqueda]);

    // Handlers para abrir modales
    const abrirAtender = (item: MaintenanceItem) => {
        setMantenimientoSeleccionado(item);
        formAtender.setData({
            worker_id: workers.some((worker) => worker.id === item.worker_id) ? String(item.worker_id) : (workers[0]?.id.toString() ?? ''),
            execution_date: new Date().toISOString().split('T')[0],
            start_time: item.start_time || '08:00',
            end_time: item.end_time || '10:30',
            work_description: item.work_description || `Atención de ${item.maintenance_type} en ${item.park_name}.`,
            result: item.result || 'Óptimo',
            observations: item.observations || '',
            status: 'finalizado',
            photo_before: null,
            photo_after: null,
        });
        setModalAtenderAbierto(true);
    };

    const abrirIniciar = (item: MaintenanceItem) => {
        setMantenimientoSeleccionado(item);
        formIniciar.setData({
            execution_date: new Date().toISOString().split('T')[0],
            start_time: new Date().toTimeString().substring(0, 5),
            worker_id: workers.some((worker) => worker.id === item.worker_id) ? String(item.worker_id) : (workers[0]?.id.toString() ?? ''),
            initial_observation: item.initial_observation || '',
            photo_before: null,
        });
        setModalIniciarAbierto(true);
    };

    const abrirFinalizar = (item: MaintenanceItem) => {
        setMantenimientoSeleccionado(item);
        formFinalizar.setData({
            execution_date: item.execution_date || new Date().toISOString().split('T')[0],
            start_time: item.start_time || '08:00',
            end_time: new Date().toTimeString().substring(0, 5),
            work_description: item.work_description || `Trabajo de ${item.maintenance_type} completado de forma integral.`,
            result: item.result || 'Óptimo',
            observations: item.observations || '',
            worker_id: workers.some((worker) => worker.id === item.worker_id) ? String(item.worker_id) : (workers[0]?.id.toString() ?? ''),
            photo_after: null,
        });
        setModalFinalizarAbierto(true);
    };

    const abrirDetalle = (item: MaintenanceItem) => {
        setMantenimientoSeleccionado(item);
        setModalDetalleAbierto(true);
    };

    const abrirCancelar = (item: MaintenanceItem) => {
        setMantenimientoSeleccionado(item);
        formCancelar.setData({ reason: '' });
        setModalCancelarAbierto(true);
    };

    // Submits
    const submitExtraordinario = (e: FormEvent) => {
        e.preventDefault();
        formExtraordinario.post('/mantenimientos/extraordinario', {
            onSuccess: () => {
                setModalExtraordinarioAbierto(false);
                formExtraordinario.reset();
            },
        });
    };

    const submitAtender = (e: FormEvent) => {
        e.preventDefault();
        if (!mantenimientoSeleccionado) return;

        formAtender.post(`/mantenimientos/${mantenimientoSeleccionado.id}/atender`, {
            forceFormData: true,
            onSuccess: () => {
                setModalAtenderAbierto(false);
            },
        });
    };

    const submitIniciar = (e: FormEvent) => {
        e.preventDefault();
        if (!mantenimientoSeleccionado) return;

        formIniciar.post(`/mantenimientos/${mantenimientoSeleccionado.id}/iniciar`, {
            forceFormData: true,
            onSuccess: () => {
                setModalIniciarAbierto(false);
            },
        });
    };

    const submitFinalizar = (e: FormEvent) => {
        e.preventDefault();
        if (!mantenimientoSeleccionado) return;

        formFinalizar.post(`/mantenimientos/${mantenimientoSeleccionado.id}/finalizar`, {
            forceFormData: true,
            onSuccess: () => {
                setModalFinalizarAbierto(false);
            },
        });
    };

    const submitCancelar = (e: FormEvent) => {
        e.preventDefault();
        if (!mantenimientoSeleccionado) return;

        formCancelar.patch(`/mantenimientos/${mantenimientoSeleccionado.id}/cancelar`, {
            onSuccess: () => {
                setModalCancelarAbierto(false);
            },
        });
    };

    useEffect(() => {
        const parameters = new URLSearchParams(window.location.search);
        const state = parameters.get('estado');

        if (state && ['todos', 'proximos', 'pendientes', 'vencidos', 'en_proceso', 'finalizados', 'cancelados'].includes(state)) {
            setPestañaActiva(state);
        }

        if (parameters.get('accion') === 'extraordinario') {
            setModalExtraordinarioAbierto(true);
        }

        const attendId = Number(parameters.get('atender'));
        const finishId = Number(parameters.get('finalizar'));

        if (attendId) {
            const maintenance = records.find((item) => item.id === attendId);
            if (maintenance) abrirAtender(maintenance);
        } else if (finishId) {
            const maintenance = records.find((item) => item.id === finishId);
            if (maintenance) abrirFinalizar(maintenance);
        }
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestión de Mantenimientos - Sistema de Áreas Verdes" />

            <div className="flex flex-1 flex-col p-4 md:p-6 bg-slate-50/60 dark:bg-background min-w-0 max-w-full overflow-x-hidden">
                <div className="mx-auto w-full max-w-7xl flex flex-col gap-6 min-w-0">
                    {/* ENCABEZADO PRINCIPAL */}
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-xs">Municipalidad Distrital de Nuevo Chimbote</span>
                            </div>
                            <h1 className="text-foreground mt-1 flex items-center gap-2.5 text-2xl font-bold tracking-tight md:text-3xl">
                                <Wrench className="h-8 w-8 text-emerald-600" />
                                Gestión de Mantenimientos
                            </h1>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Control operativo, atención de órdenes por frecuencia, intervenciones extraordinarias y emisión de partes oficiales.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setModalExtraordinarioAbierto(true)}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-amber-700 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                            >
                                <Zap className="h-4 w-4" />
                                Programar mantenimiento extraordinario
                            </button>
                        </div>
                    </div>

                    {/* TARJETAS RESUMEN DE INDICADORES */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    <div className="bg-card rounded-2xl border p-4 shadow-xs">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-xs font-medium">Total de órdenes</p>
                                <h3 className="text-foreground mt-1 text-2xl font-bold">{counts.todos}</h3>
                                <p className="text-muted-foreground mt-0.5 text-xs">Historial acumulado</p>
                            </div>
                            <div className="rounded-xl bg-slate-500/10 p-3 text-slate-600 dark:text-neutral-300">
                                <Layers className="h-6 w-6" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-2xl border p-4 shadow-xs">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-xs font-medium">Pendientes</p>
                                <h3 className="mt-1 text-2xl font-bold text-amber-600">{counts.pendientes}</h3>
                                <p className="mt-0.5 text-xs font-medium text-amber-600">Por atender</p>
                            </div>
                            <div className="rounded-xl bg-amber-500/10 p-3 text-amber-600">
                                <Clock className="h-6 w-6" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-2xl border p-4 shadow-xs">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-xs font-medium">En mantenimiento</p>
                                <h3 className="mt-1 text-2xl font-bold text-blue-600">{counts.en_proceso}</h3>
                                <p className="mt-0.5 text-xs font-medium text-blue-600">Cuadrillas operando</p>
                            </div>
                            <div className="rounded-xl bg-blue-500/10 p-3 text-blue-600">
                                <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-2xl border p-4 shadow-xs">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-xs font-medium">Finalizados</p>
                                <h3 className="mt-1 text-2xl font-bold text-emerald-600">{counts.finalizados}</h3>
                                <p className="mt-0.5 text-xs font-medium text-emerald-600">Labores concluidas</p>
                            </div>
                            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-2xl border p-4 shadow-xs">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-xs font-medium">Vencidos</p>
                                <h3 className="mt-1 text-2xl font-bold text-red-600">{counts.vencidos}</h3>
                                <p className="mt-0.5 text-xs font-medium text-red-600">Requieren prioridad</p>
                            </div>
                            <div className="rounded-xl bg-red-500/10 p-3 text-red-600">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* BANDEJA DE MANTENIMIENTOS */}
                <section className="bg-card overflow-hidden rounded-2xl border shadow-xs">
                    {/* PESTAÑAS POR ESTADO */}
                    <div className="bg-muted/20 flex overflow-x-auto border-b px-4">
                        <button
                            type="button"
                            onClick={() => setPestañaActiva('todos')}
                            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition ${
                                pestañaActiva === 'todos'
                                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                                    : 'text-muted-foreground hover:text-foreground border-transparent'
                            }`}
                        >
                            Todos
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-800 dark:bg-neutral-800 dark:text-neutral-200">
                                {counts.todos}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setPestañaActiva('proximos')}
                            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition ${
                                pestañaActiva === 'proximos'
                                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                                    : 'text-muted-foreground hover:text-foreground border-transparent'
                            }`}
                        >
                            Próximos
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                {counts.proximos}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setPestañaActiva('pendientes')}
                            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition ${
                                pestañaActiva === 'pendientes'
                                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                                    : 'text-muted-foreground hover:text-foreground border-transparent'
                            }`}
                        >
                            Pendientes
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                {counts.pendientes}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setPestañaActiva('vencidos')}
                            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition ${
                                pestañaActiva === 'vencidos'
                                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                                    : 'text-muted-foreground hover:text-foreground border-transparent'
                            }`}
                        >
                            Vencidos
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-800 dark:bg-red-950 dark:text-red-300">
                                {counts.vencidos}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setPestañaActiva('en_proceso')}
                            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition ${
                                pestañaActiva === 'en_proceso'
                                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                                    : 'text-muted-foreground hover:text-foreground border-transparent'
                            }`}
                        >
                            En proceso
                            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                                {counts.en_proceso}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setPestañaActiva('finalizados')}
                            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition ${
                                pestañaActiva === 'finalizados'
                                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                                    : 'text-muted-foreground hover:text-foreground border-transparent'
                            }`}
                        >
                            Finalizados
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                {counts.finalizados}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setPestañaActiva('cancelados')}
                            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition ${
                                pestañaActiva === 'cancelados'
                                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                                    : 'text-muted-foreground hover:text-foreground border-transparent'
                            }`}
                        >
                            Cancelados
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-neutral-800 dark:text-neutral-300">
                                {counts.cancelados}
                            </span>
                        </button>
                    </div>

                    {/* FILTROS Y BÚSQUEDA */}
                    <div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="relative flex-1 sm:max-w-xs">
                                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    placeholder="Buscar N° PM, parque o trabajador..."
                                    className="bg-background w-full rounded-xl border py-2 pr-4 pl-9 text-xs shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                />
                            </div>

                            <select
                                value={filtroParque}
                                onChange={(e) => setFiltroParque(e.target.value)}
                                className="bg-background rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            >
                                <option value="todos">Todos los parques</option>
                                {parks.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} ({p.code})
                                    </option>
                                ))}
                            </select>

                            <select
                                value={filtroTipo}
                                onChange={(e) => setFiltroTipo(e.target.value)}
                                className="bg-background rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            >
                                <option value="todos">Todos los tipos de labor</option>
                                {tiposMantenimiento.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="text-muted-foreground text-xs font-medium">
                            Mostrando <span className="text-foreground font-semibold">{registrosFiltrados.length}</span> de {records.length} registros
                        </div>
                    </div>

                    {/* TABLA DE MANTENIMIENTOS */}
                    <div className="w-full overflow-x-auto min-w-0">
                        <table className="w-full text-left text-sm table-auto">
                            <thead className="bg-muted/40 text-muted-foreground border-b text-[11px] font-semibold tracking-wider uppercase">
                                <tr>
                                    <th className="px-4 py-3.5 w-[22%]">Orden y Mantenimiento</th>
                                    <th className="px-4 py-3.5 w-[26%]">Parque e Instalación</th>
                                    <th className="px-4 py-3.5 w-[20%]">Programación y Alerta</th>
                                    <th className="px-4 py-3.5 w-[14%]">Responsable</th>
                                    <th className="px-4 py-3.5 w-[10%] text-center">Estado</th>
                                    <th className="px-3 py-3 text-center w-[8%]">Acciones</th>
                                </tr>
                            </thead>

                            <tbody className="divide-border divide-y">
                                {registrosFiltrados.length > 0 ? (
                                    registrosFiltrados.map((item) => {
                                        return (
                                            <tr key={item.id} className="hover:bg-muted/30 transition">
                                                {/* Orden y Mantenimiento */}
                                                <td className="px-4 py-3.5 align-top">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="inline-flex items-center gap-1 rounded-md border bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-800 dark:bg-neutral-900 dark:text-neutral-200">
                                                                <FileText className="h-3 w-3 text-emerald-600" />
                                                                {item.maintenance_number}
                                                            </span>
                                                            {item.is_extraordinary && (
                                                                <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                                                    Extraordinario
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-foreground flex items-center gap-1.5 text-xs font-semibold mt-0.5">
                                                            {item.maintenance_type.toLowerCase().includes('riego') ? (
                                                                <Droplets className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                                            ) : item.maintenance_type.toLowerCase().includes('poda') ? (
                                                                <Trees className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                                            ) : (
                                                                <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                                            )}
                                                            <span>{item.maintenance_type}</span>
                                                            {item.frequency_days && (
                                                                <span className="text-muted-foreground text-[11px] font-normal">({item.frequency_days}d)</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Parque e Instalación */}
                                                <td className="px-4 py-3.5 align-top">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <Trees className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                                            <p className="font-bold text-foreground text-sm line-clamp-1">{item.park_name}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-wrap text-[11px]">
                                                            <span className="font-mono text-muted-foreground">
                                                                {item.park_code} {item.park_zone ? `• ${item.park_zone}` : ''}
                                                            </span>
                                                            <span className="rounded-md bg-slate-200/70 px-1.5 py-0.2 text-[10px] font-semibold text-slate-800 dark:bg-neutral-800 dark:text-neutral-200">
                                                                {item.green_area_type}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Programación y Alerta */}
                                                <td className="px-4 py-3.5 align-top">
                                                    <div className="flex flex-col gap-1 text-xs">
                                                        <div className="text-foreground flex items-center gap-1.5 font-medium">
                                                            <Calendar className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                                                            <span>Prog: {item.scheduled_date_formatted}</span>
                                                        </div>
                                                        {item.alert_date_formatted && (
                                                            <div>
                                                                {item.is_alert_active ? (
                                                                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                                                        <AlertTriangle className="h-3 w-3 animate-pulse text-amber-600" />
                                                                        Alerta: {item.alert_date_formatted}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-muted-foreground text-[11px]">Alerta: {item.alert_date_formatted}</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Trabajador / Cuadrilla */}
                                                <td className="px-4 py-3.5 align-top text-xs">
                                                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                                                        <UserCheck className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                                                        <span className="line-clamp-2">{item.responsible_worker}</span>
                                                    </div>
                                                </td>

                                                {/* Estado */}
                                                <td className="px-4 py-3.5 align-top text-center">
                                                    {item.computed_status === 'al_dia' && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                            <CheckCircle2 className="h-3 w-3" /> Al día
                                                        </span>
                                                    )}
                                                    {item.computed_status === 'proximo' && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                                            <Clock className="h-3 w-3" /> Próximo
                                                        </span>
                                                    )}
                                                    {item.computed_status === 'pendiente' && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                                            <Clock className="h-3 w-3" /> Pendiente
                                                        </span>
                                                    )}
                                                    {item.computed_status === 'vencido' && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-950 dark:text-red-300">
                                                            <AlertCircle className="h-3 w-3" /> Vencido
                                                        </span>
                                                    )}
                                                    {item.computed_status === 'en_proceso' && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                                                            <RefreshCw className="h-3 w-3 animate-spin text-sky-600" /> En proceso
                                                        </span>
                                                    )}
                                                    {item.computed_status === 'finalizado' && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                            <CheckCircle2 className="h-3 w-3" /> Finalizado
                                                        </span>
                                                    )}
                                                    {item.computed_status === 'cancelado' && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-neutral-800 dark:text-neutral-300">
                                                            <X className="h-3 w-3" /> Cancelado
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Acciones */}
                                                <td className="px-3 py-2.5 text-center sticky right-0 bg-background/95 dark:bg-card/95 backdrop-blur-xs border-l border-border/60 shadow-xs whitespace-nowrap">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        {/* Acciones para pendientes / próximos / vencidos */}
                                                        {['pendiente', 'proximo', 'vencido'].includes(item.computed_status) && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => abrirAtender(item)}
                                                                    title="Atender mantenimiento completo"
                                                                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-emerald-700"
                                                                >
                                                                    <CheckCircle2 className="h-3.5 w-3.5" /> Atender
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => abrirIniciar(item)}
                                                                    title="Iniciar trabajo en terreno"
                                                                    className="rounded-lg p-1.5 text-blue-600 transition hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-950"
                                                                >
                                                                    <Play className="h-4 w-4" />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => abrirCancelar(item)}
                                                                    title="Cancelar orden"
                                                                    className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-950"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </>
                                                        )}

                                                        {/* Acciones para en proceso */}
                                                        {item.computed_status === 'en_proceso' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => abrirFinalizar(item)}
                                                                title="Finalizar mantenimiento"
                                                                className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-sky-700"
                                                            >
                                                                <CheckCircle2 className="h-3.5 w-3.5" /> Finalizar
                                                            </button>
                                                        )}

                                                        {/* Acciones para finalizados */}
                                                        {item.computed_status === 'finalizado' && (
                                                            <>
                                                                <a
                                                                    href={`/mantenimientos/${item.id}/documento`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    title="Ver / Imprimir Parte Oficial"
                                                                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                                                                >
                                                                    <Printer className="h-3.5 w-3.5" /> Parte
                                                                </a>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => abrirDetalle(item)}
                                                                    title="Ver resumen"
                                                                    className="rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </button>
                                                            </>
                                                        )}

                                                        {/* Acciones para cancelados */}
                                                        {item.computed_status === 'cancelado' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => abrirDetalle(item)}
                                                                title="Ver detalle de cancelación"
                                                                className="rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="text-muted-foreground py-12 text-center">
                                            <Wrench className="text-muted-foreground/50 mx-auto mb-2 h-8 w-8" />
                                            <p className="font-medium">No se encontraron mantenimientos para este filtro</p>
                                            <p className="mt-1 text-xs">Pruebe seleccionando otra pestaña o limpiando los campos de búsqueda.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* MODAL ATENDER MANTENIMIENTO (GENERADO POR FRECUENCIA O PROGRAMADO)          */}
            {/* ========================================================================= */}
            {modalAtenderAbierto && mantenimientoSeleccionado && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="bg-background flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border shadow-2xl">
                        <div className="flex items-center justify-between border-b bg-emerald-500/10 px-6 py-4">
                            <div>
                                <h2 className="text-foreground flex items-center gap-2 text-lg font-bold">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                    Atender Mantenimiento — {mantenimientoSeleccionado.maintenance_number}
                                </h2>
                                <p className="text-muted-foreground mt-0.5 text-xs">
                                    Los datos del parque y la programación se autocompletan. Ingrese los detalles de ejecución.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalAtenderAbierto(false)}
                                className="text-muted-foreground hover:bg-muted rounded-lg p-2"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={submitAtender} className="flex-1 space-y-5 overflow-y-auto p-6">
                            {/* Datos autocompletados del parque y la regla */}
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
                                <h4 className="mb-3 text-xs font-bold tracking-wider text-emerald-900 uppercase dark:text-emerald-200">
                                    Datos Autocompletados del Sistema
                                </h4>
                                <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                                    <div>
                                        <span className="text-muted-foreground block">Parque:</span>
                                        <strong className="text-foreground">{mantenimientoSeleccionado.park_name}</strong>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block">Tipo de área verde:</span>
                                        <strong className="text-foreground">{mantenimientoSeleccionado.green_area_type}</strong>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block">Tipo de mantenimiento:</span>
                                        <strong className="text-foreground">{mantenimientoSeleccionado.maintenance_type}</strong>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block">Fecha programada:</span>
                                        <strong className="text-foreground">{mantenimientoSeleccionado.scheduled_date_formatted}</strong>
                                    </div>
                                    {mantenimientoSeleccionado.frequency_days && (
                                        <div>
                                            <span className="text-muted-foreground block">Frecuencia aplicada:</span>
                                            <strong className="text-emerald-700 dark:text-emerald-400">
                                                Cada {mantenimientoSeleccionado.frequency_days} días
                                            </strong>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-muted-foreground block">Estado actual:</span>
                                        <strong className="text-foreground capitalize">{mantenimientoSeleccionado.status}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Campos a completar por el encargado */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold">
                                        Trabajador responsable <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={formAtender.data.worker_id}
                                        onChange={(e) => formAtender.setData('worker_id', e.target.value)}
                                        className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                    >
                                        <option value="">Seleccione un trabajador</option>
                                        {workers.map((worker) => (
                                            <option key={worker.id} value={worker.id}>
                                                {worker.full_name} — {worker.position}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold">
                                        Fecha real de ejecución <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formAtender.data.execution_date}
                                        onChange={(e) => formAtender.setData('execution_date', e.target.value)}
                                        className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold">
                                        Hora de inicio <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={formAtender.data.start_time}
                                        onChange={(e) => formAtender.setData('start_time', e.target.value)}
                                        className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold">
                                        Hora de finalización <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={formAtender.data.end_time}
                                        onChange={(e) => formAtender.setData('end_time', e.target.value)}
                                        className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                    />
                                    {duracionAtenderMinutos > 0 && (
                                        <p className="mt-1 text-[11px] font-semibold text-emerald-600">
                                            Duración calculada: {Math.floor(duracionAtenderMinutos / 60)}h {duracionAtenderMinutos % 60}m (
                                            {duracionAtenderMinutos} min)
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold">
                                    Descripción del trabajo realizado <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={2}
                                    value={formAtender.data.work_description}
                                    onChange={(e) => formAtender.setData('work_description', e.target.value)}
                                    placeholder="Detalle de las labores efectuadas..."
                                    className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold">Resultado / Calificación de labor</label>
                                    <select
                                        value={formAtender.data.result}
                                        onChange={(e) => formAtender.setData('result', e.target.value)}
                                        className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                    >
                                        <option value="Óptimo">Óptimo</option>
                                        <option value="Favorable">Favorable</option>
                                        <option value="Regular">Regular</option>
                                        <option value="Requiere intervención complementaria">Requiere intervención complementaria</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold">Estado final</label>
                                    <select
                                        value={formAtender.data.status}
                                        onChange={(e) => formAtender.setData('status', e.target.value)}
                                        className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                    >
                                        <option value="finalizado">Finalizado (Concluido)</option>
                                        <option value="en_proceso">En proceso (Continúa laborando)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold">Observaciones</label>
                                <textarea
                                    rows={2}
                                    value={formAtender.data.observations}
                                    onChange={(e) => formAtender.setData('observations', e.target.value)}
                                    placeholder="Observaciones de terreno..."
                                    className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold">Fotografía antes del trabajo (opcional)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => formAtender.setData('photo_before', e.target.files ? e.target.files[0] : null)}
                                        className="text-muted-foreground w-full text-xs file:mr-3 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-950 dark:file:text-emerald-300"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold">Fotografía posterior / resultado (opcional)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => formAtender.setData('photo_after', e.target.files ? e.target.files[0] : null)}
                                        className="text-muted-foreground w-full text-xs file:mr-3 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-950 dark:file:text-emerald-300"
                                    />
                                </div>
                            </div>

                            {mantenimientoSeleccionado.frequency_days && formAtender.data.status === 'finalizado' && (
                                <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
                                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                                    <span>
                                        <strong>Próxima fecha automática:</strong> Al finalizar, el sistema calculará la siguiente fecha: fecha real (
                                        {formAtender.data.execution_date}) + frecuencia ({mantenimientoSeleccionado.frequency_days} días) y creará la
                                        siguiente orden en la cadena.
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 border-t pt-3">
                                <button
                                    type="button"
                                    onClick={() => setModalAtenderAbierto(false)}
                                    className="hover:bg-muted rounded-xl border px-4 py-2 text-xs font-semibold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={formAtender.processing}
                                    className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    {formAtender.processing ? 'Guardando...' : 'Guardar Atención de Mantenimiento'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL REGISTRAR MANTENIMIENTO EXTRAORDINARIO                               */}
            {/* ========================================================================= */}
            {modalExtraordinarioAbierto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="bg-background flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border shadow-2xl">
                        <div className="flex items-center justify-between border-b bg-amber-500/10 px-6 py-4">
                            <div>
                                <h2 className="flex items-center gap-2 text-lg font-bold text-amber-900 dark:text-amber-200">
                                    <Zap className="h-5 w-5 text-amber-600" />
                                    Registrar Mantenimiento Extraordinario
                                </h2>
                                <p className="text-xs text-amber-800 dark:text-amber-300">
                                    Para trabajos especiales que no se originan por una regla de frecuencia recurrente.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalExtraordinarioAbierto(false)}
                                className="text-muted-foreground hover:bg-muted rounded-lg p-2"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={submitExtraordinario} className="flex-1 space-y-4 overflow-y-auto p-6">
                            <div>
                                <label className="mb-1 block text-xs font-semibold">
                                    Parque o Área Verde <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formExtraordinario.data.park_id}
                                    onChange={(e) => formExtraordinario.setData('park_id', Number(e.target.value))}
                                    className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                >
                                    {parks.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.code} • {p.green_area_type})
                                        </option>
                                    ))}
                                </select>
                                <InputError message={formExtraordinario.errors.park_id} className="mt-1 text-xs" />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold">
                                        Tipo de labor extraordinaria <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={formExtraordinario.data.maintenance_type}
                                        onChange={(e) => formExtraordinario.setData('maintenance_type', e.target.value)}
                                        className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                    >
                                        <option value="" disabled>
                                            Seleccione un tipo de mantenimiento
                                        </option>
                                        {tiposMantenimiento.map((tipo) => (
                                            <option key={tipo} value={tipo}>
                                                {tipo}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={formExtraordinario.errors.maintenance_type} className="mt-1 text-xs" />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold">
                                        Fecha programada <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formExtraordinario.data.scheduled_date}
                                        onChange={(e) => formExtraordinario.setData('scheduled_date', e.target.value)}
                                        className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                    />
                                    <InputError message={formExtraordinario.errors.scheduled_date} className="mt-1 text-xs" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold">Días de anticipación para alerta</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="15"
                                        value={formExtraordinario.data.advance_days}
                                        onChange={(e) => formExtraordinario.setData('advance_days', Number(e.target.value))}
                                        className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                    />
                                    <p className="text-muted-foreground mt-0.5 text-[11px]">
                                        La alerta se activará {formExtraordinario.data.advance_days} día(s) antes de la fecha programada.
                                    </p>
                                    <InputError message={formExtraordinario.errors.advance_days} className="mt-1 text-xs" />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold">Trabajador responsable</label>
                                    <select
                                        value={formExtraordinario.data.worker_id}
                                        onChange={(e) => formExtraordinario.setData('worker_id', e.target.value)}
                                        className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                    >
                                        <option value="">Por asignar</option>
                                        {workers.map((worker) => (
                                            <option key={worker.id} value={worker.id}>
                                                {worker.full_name} — {worker.position}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={formExtraordinario.errors.worker_id} className="mt-1 text-xs" />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold">
                                    Motivo del trabajo extraordinario <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={2}
                                    value={formExtraordinario.data.reason}
                                    onChange={(e) => formExtraordinario.setData('reason', e.target.value)}
                                    placeholder="Indique la causa o urgencia de la intervención (ej: caída de ramas por vientos fuertes, fuga en válvula)..."
                                    className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                />
                                <InputError message={formExtraordinario.errors.reason} className="mt-1 text-xs" />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold">Observaciones adicionales</label>
                                <textarea
                                    rows={2}
                                    value={formExtraordinario.data.observations}
                                    onChange={(e) => formExtraordinario.setData('observations', e.target.value)}
                                    placeholder="Herramientas necesarias o indicaciones..."
                                    className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                />
                                <InputError message={formExtraordinario.errors.observations} className="mt-1 text-xs" />
                            </div>

                            <div className="flex justify-end gap-3 border-t pt-3">
                                <button
                                    type="button"
                                    onClick={() => setModalExtraordinarioAbierto(false)}
                                    className="hover:bg-muted rounded-xl border px-4 py-2 text-xs font-semibold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={formExtraordinario.processing}
                                    className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 disabled:opacity-50"
                                >
                                    {formExtraordinario.processing ? 'Programando...' : 'Programar Mantenimiento Extraordinario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL INICIO DEL MANTENIMIENTO                                            */}
            {/* ========================================================================= */}
            {modalIniciarAbierto && mantenimientoSeleccionado && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="bg-background flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border shadow-2xl">
                        <div className="flex items-center justify-between border-b bg-blue-500/10 px-6 py-4">
                            <div>
                                <h3 className="flex items-center gap-2 text-lg font-bold text-blue-900 dark:text-blue-200">
                                    <Play className="h-5 w-5 text-blue-600" />
                                    Inicio del Mantenimiento
                                </h3>
                                <p className="text-xs text-blue-800 dark:text-blue-300">
                                    {mantenimientoSeleccionado.maintenance_number} • {mantenimientoSeleccionado.park_name}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalIniciarAbierto(false)}
                                className="text-muted-foreground hover:bg-muted rounded-lg p-2"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={submitIniciar} className="space-y-4 p-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold">Fecha real de inicio</label>
                                    <input
                                        type="date"
                                        required
                                        value={formIniciar.data.execution_date}
                                        onChange={(e) => formIniciar.setData('execution_date', e.target.value)}
                                        className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold">Hora de inicio</label>
                                    <input
                                        type="time"
                                        required
                                        value={formIniciar.data.start_time}
                                        onChange={(e) => formIniciar.setData('start_time', e.target.value)}
                                        className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold">Trabajador responsable</label>
                                <select
                                    required
                                    value={formIniciar.data.worker_id}
                                    onChange={(e) => formIniciar.setData('worker_id', e.target.value)}
                                    className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                >
                                    <option value="">Seleccione un trabajador</option>
                                    {workers.map((worker) => (
                                        <option key={worker.id} value={worker.id}>
                                            {worker.full_name} — {worker.position}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold">Observación inicial</label>
                                <textarea
                                    rows={2}
                                    value={formIniciar.data.initial_observation}
                                    onChange={(e) => formIniciar.setData('initial_observation', e.target.value)}
                                    placeholder="Estado previo del terreno o herramientas..."
                                    className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold">Fotografía antes del trabajo (opcional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => formIniciar.setData('photo_before', e.target.files ? e.target.files[0] : null)}
                                    className="text-muted-foreground w-full text-xs file:mr-3 file:rounded-xl file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                                />
                            </div>

                            <p className="text-muted-foreground text-[11px] italic">
                                Al confirmar, el estado cambiará a <strong>"En mantenimiento"</strong>.
                            </p>

                            <div className="flex justify-end gap-3 border-t pt-3">
                                <button
                                    type="button"
                                    onClick={() => setModalIniciarAbierto(false)}
                                    className="hover:bg-muted rounded-xl border px-4 py-2 text-xs font-semibold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={formIniciar.processing}
                                    className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {formIniciar.processing ? 'Iniciando...' : 'Confirmar Inicio de Labor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL FINALIZACIÓN DEL MANTENIMIENTO                                      */}
            {/* ========================================================================= */}
            {modalFinalizarAbierto && mantenimientoSeleccionado && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="bg-background flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border shadow-2xl">
                        <div className="flex items-center justify-between border-b bg-sky-500/10 px-6 py-4">
                            <div>
                                <h3 className="flex items-center gap-2 text-lg font-bold text-sky-900 dark:text-sky-200">
                                    <CheckCircle2 className="h-5 w-5 text-sky-600" />
                                    Finalización del Mantenimiento
                                </h3>
                                <p className="text-xs text-sky-800 dark:text-sky-300">
                                    {mantenimientoSeleccionado.maintenance_number} • {mantenimientoSeleccionado.park_name}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalFinalizarAbierto(false)}
                                className="text-muted-foreground hover:bg-muted rounded-lg p-2"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={submitFinalizar} className="flex-1 space-y-4 overflow-y-auto p-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold">Hora de inicio</label>
                                    <input
                                        type="time"
                                        required
                                        value={formFinalizar.data.start_time}
                                        onChange={(e) => formFinalizar.setData('start_time', e.target.value)}
                                        className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold">Hora de finalización</label>
                                    <input
                                        type="time"
                                        required
                                        value={formFinalizar.data.end_time}
                                        onChange={(e) => formFinalizar.setData('end_time', e.target.value)}
                                        className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {duracionFinalizarMinutos > 0 && (
                                <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 p-2.5 text-xs font-semibold text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200">
                                    <Clock className="h-4 w-4 text-sky-600" />
                                    Duración calculada: {Math.floor(duracionFinalizarMinutos / 60)}h {duracionFinalizarMinutos % 60}m (
                                    {duracionFinalizarMinutos} minutos)
                                </div>
                            )}

                            <div>
                                <label className="mb-1 block text-xs font-semibold">
                                    Descripción del trabajo realizado <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={2}
                                    value={formFinalizar.data.work_description}
                                    onChange={(e) => formFinalizar.setData('work_description', e.target.value)}
                                    placeholder="Indique las tareas concluidas..."
                                    className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold">Resultado de la labor</label>
                                    <select
                                        value={formFinalizar.data.result}
                                        onChange={(e) => formFinalizar.setData('result', e.target.value)}
                                        className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs"
                                    >
                                        <option value="Óptimo">Óptimo</option>
                                        <option value="Favorable">Favorable</option>
                                        <option value="Regular">Regular</option>
                                        <option value="Requiere intervención complementaria">Requiere intervención complementaria</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold">Trabajador responsable</label>
                                    <select
                                        required
                                        value={formFinalizar.data.worker_id}
                                        onChange={(e) => formFinalizar.setData('worker_id', e.target.value)}
                                        className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs"
                                    >
                                        <option value="">Seleccione un trabajador</option>
                                        {workers.map((worker) => (
                                            <option key={worker.id} value={worker.id}>
                                                {worker.full_name} — {worker.position}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold">Observaciones</label>
                                <textarea
                                    rows={2}
                                    value={formFinalizar.data.observations}
                                    onChange={(e) => formFinalizar.setData('observations', e.target.value)}
                                    placeholder="Observaciones finales..."
                                    className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold">Fotografía posterior / resultado (opcional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => formFinalizar.setData('photo_after', e.target.files ? e.target.files[0] : null)}
                                    className="text-muted-foreground w-full text-xs file:mr-3 file:rounded-xl file:border-0 file:bg-sky-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-sky-700 hover:file:bg-sky-100"
                                />
                            </div>

                            {mantenimientoSeleccionado.frequency_days && (
                                <p className="text-[11px] font-semibold text-emerald-600">
                                    ✓ Al guardar, el sistema calculará la próxima fecha automática sumando {mantenimientoSeleccionado.frequency_days}{' '}
                                    días y generará el Parte Oficial.
                                </p>
                            )}

                            <div className="flex justify-end gap-3 border-t pt-3">
                                <button
                                    type="button"
                                    onClick={() => setModalFinalizarAbierto(false)}
                                    className="hover:bg-muted rounded-xl border px-4 py-2 text-xs font-semibold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={formFinalizar.processing}
                                    className="rounded-xl bg-sky-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-sky-700 disabled:opacity-50"
                                >
                                    {formFinalizar.processing ? 'Finalizando...' : 'Concluir y Generar Parte'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL DETALLE / VISTA DEL PARTE DE MANTENIMIENTO                          */}
            {/* ========================================================================= */}
            {modalDetalleAbierto && mantenimientoSeleccionado && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="bg-background flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border shadow-2xl">
                        <div className="bg-muted/20 flex items-center justify-between border-b px-6 py-4">
                            <div>
                                <h3 className="text-foreground flex items-center gap-2 text-lg font-bold">
                                    <FileText className="h-5 w-5 text-emerald-600" />
                                    Detalle del Mantenimiento — {mantenimientoSeleccionado.maintenance_number}
                                </h3>
                                <p className="text-muted-foreground text-xs">
                                    {mantenimientoSeleccionado.park_name} ({mantenimientoSeleccionado.park_code})
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalDetalleAbierto(false)}
                                className="text-muted-foreground hover:bg-muted rounded-lg p-2"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto p-6 text-xs">
                            <div className="bg-muted/10 grid grid-cols-2 gap-3 rounded-xl border p-4 sm:grid-cols-3">
                                <div>
                                    <span className="text-muted-foreground block">Modalidad:</span>
                                    <strong className="text-foreground">
                                        {mantenimientoSeleccionado.is_extraordinary ? 'Extraordinario' : 'Frecuencia Automática'}
                                    </strong>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Labor:</span>
                                    <strong className="text-foreground">{mantenimientoSeleccionado.maintenance_type}</strong>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Estado:</span>
                                    <strong className="text-emerald-600 capitalize">{mantenimientoSeleccionado.status}</strong>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Fecha programada:</span>
                                    <strong className="text-foreground">{mantenimientoSeleccionado.scheduled_date_formatted}</strong>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Fecha ejecutada:</span>
                                    <strong className="text-foreground">{mantenimientoSeleccionado.execution_date_formatted || '—'}</strong>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Horario y duración:</span>
                                    <strong className="text-foreground">
                                        {mantenimientoSeleccionado.start_time || '—'} a {mantenimientoSeleccionado.end_time || '—'}{' '}
                                        {mantenimientoSeleccionado.duration_minutes && `(${mantenimientoSeleccionado.duration_minutes}m)`}
                                    </strong>
                                </div>
                            </div>

                            {mantenimientoSeleccionado.reason && (
                                <div>
                                    <span className="text-muted-foreground block font-semibold">Motivo extraordinario:</span>
                                    <p className="mt-0.5 rounded-lg border bg-amber-50/50 p-2.5 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                                        {mantenimientoSeleccionado.reason}
                                    </p>
                                </div>
                            )}

                            {mantenimientoSeleccionado.work_description && (
                                <div>
                                    <span className="text-muted-foreground block font-semibold">Descripción del trabajo realizado:</span>
                                    <p className="bg-muted/20 text-foreground mt-0.5 rounded-lg border p-2.5">
                                        {mantenimientoSeleccionado.work_description}
                                    </p>
                                </div>
                            )}

                            {mantenimientoSeleccionado.observations && (
                                <div>
                                    <span className="text-muted-foreground block font-semibold">Observaciones:</span>
                                    <p className="bg-muted/20 text-foreground mt-0.5 rounded-lg border p-2.5">
                                        {mantenimientoSeleccionado.observations}
                                    </p>
                                </div>
                            )}

                            {/* Evidencia fotográfica */}
                            {(mantenimientoSeleccionado.photo_before_url || mantenimientoSeleccionado.photo_after_url) && (
                                <div>
                                    <span className="text-muted-foreground mb-2 block font-semibold">Evidencia Fotográfica:</span>
                                    <div className="grid grid-cols-2 gap-3">
                                        {mantenimientoSeleccionado.photo_before_url && (
                                            <div className="bg-muted/20 overflow-hidden rounded-xl border text-center">
                                                <img
                                                    src={mantenimientoSeleccionado.photo_before_url}
                                                    alt="Antes"
                                                    className="h-36 w-full object-cover"
                                                />
                                                <p className="text-muted-foreground py-1 text-[11px] font-semibold">Antes del trabajo</p>
                                            </div>
                                        )}
                                        {mantenimientoSeleccionado.photo_after_url && (
                                            <div className="bg-muted/20 overflow-hidden rounded-xl border text-center">
                                                <img
                                                    src={mantenimientoSeleccionado.photo_after_url}
                                                    alt="Posterior"
                                                    className="h-36 w-full object-cover"
                                                />
                                                <p className="text-muted-foreground py-1 text-[11px] font-semibold">Resultado posterior</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-muted/10 flex items-center justify-between border-t px-6 py-4">
                            <a
                                href={`/mantenimientos/${mantenimientoSeleccionado.id}/documento`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
                            >
                                <Printer className="h-4 w-4" /> Imprimir Parte Oficial
                            </a>
                            <button
                                type="button"
                                onClick={() => setModalDetalleAbierto(false)}
                                className="hover:bg-muted rounded-xl border px-4 py-2 text-xs font-semibold"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL CANCELAR MANTENIMIENTO                                              */}
            {/* ========================================================================= */}
            {modalCancelarAbierto && mantenimientoSeleccionado && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="bg-background flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border shadow-2xl">
                        <div className="flex items-center justify-between border-b bg-red-500/10 px-6 py-4">
                            <h3 className="flex items-center gap-2 text-base font-bold text-red-900 dark:text-red-200">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                Cancelar Mantenimiento
                            </h3>
                            <button
                                type="button"
                                onClick={() => setModalCancelarAbierto(false)}
                                className="text-muted-foreground hover:bg-muted rounded-lg p-2"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={submitCancelar} className="space-y-4 p-6">
                            <p className="text-muted-foreground text-xs">
                                ¿Está seguro de cancelar el mantenimiento <strong>{mantenimientoSeleccionado.maintenance_number}</strong> para el
                                parque <strong>{mantenimientoSeleccionado.park_name}</strong>?
                            </p>

                            <div>
                                <label className="mb-1 block text-xs font-semibold">
                                    Motivo de la cancelación <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={formCancelar.data.reason}
                                    onChange={(e) => formCancelar.setData('reason', e.target.value)}
                                    placeholder="Indique la justificación de la cancelación..."
                                    className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 border-t pt-3">
                                <button
                                    type="button"
                                    onClick={() => setModalCancelarAbierto(false)}
                                    className="hover:bg-muted rounded-xl border px-4 py-2 text-xs font-semibold"
                                >
                                    Volver
                                </button>
                                <button
                                    type="submit"
                                    disabled={formCancelar.processing}
                                    className="rounded-xl bg-red-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-red-700 disabled:opacity-50"
                                >
                                    {formCancelar.processing ? 'Cancelando...' : 'Confirmar Cancelación'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
