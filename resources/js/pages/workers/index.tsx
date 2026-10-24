import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { CheckCircle2, ClipboardList, Edit, Eye, FileText, Phone, Power, Search, Shield, UserPlus, Users, Wrench, X } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

// Tipos
export interface WorkerItem {
    id: number;
    code: string;
    document_number: string | null;
    first_name: string;
    last_name: string;
    full_name: string;
    position: string;
    phone: string | null;
    crew: string | null;
    observations: string | null;
    is_active: boolean;
    maintenance_records_count: number;
    maintenances_completed_count: number;
    created_at: string | null;
}

export interface MaintenimientoTrabajador {
    id: number;
    maintenance_number: string;
    park_name: string;
    park_code: string;
    maintenance_type: string;
    scheduled_date: string | null;
    execution_date: string | null;
    status: string;
    duration_minutes: number | null;
    result: string | null;
}

type WorkerFormData = {
    code: string;
    document_number: string;
    first_name: string;
    last_name: string;
    position: string;
    phone: string;
    crew: string;
    observations: string;
    is_active: boolean;
};

interface Props {
    workers: WorkerItem[];
    nextGeneratedCode: string;
    workerMantenimientos?: MaintenimientoTrabajador[];
    workerSeleccionado?: {
        id: number;
        code: string;
        full_name: string;
        position: string;
        crew: string | null;
    } | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Trabajadores', href: '/trabajadores' },
];

const CARGOS = [
    'Jardinero',
    'Capataz',
    'Técnico Hidráulico',
    'Operador de Maquinaria',
    'Podador',
    'Fumigador',
    'Auxiliar de Mantenimiento',
    'Supervisor de Áreas Verdes',
    'Chofer de Cisterna',
];

const CUADRILLAS = [
    'Cuadrilla 1 - Riego y Cisternas',
    'Cuadrilla 2 - Poda y Deshierbe',
    'Cuadrilla 3 - Limpieza y Mantenimiento',
    'Cuadrilla 4 - Fumigación',
    'Sin cuadrilla asignada',
];

const ESTILOS_ESTADO: Record<string, string> = {
    pendiente: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    en_proceso: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
    finalizado: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    completado: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    ejecutado: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    cancelado: 'bg-slate-200 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300',
    vencido: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
};

export default function WorkersIndex({ workers, nextGeneratedCode, workerMantenimientos, workerSeleccionado }: Props) {
    // Filtros
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<string>('todos');
    const [filtroCuadrilla, setFiltroCuadrilla] = useState<string>('todos');

    // Modales
    const [modalFormularioAbierto, setModalFormularioAbierto] = useState(false);
    const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
    const [modalHistorialAbierto, setModalHistorialAbierto] = useState(!!workerMantenimientos);

    useEffect(() => {
        if (workerMantenimientos && workerSeleccionado) {
            setModalHistorialAbierto(true);
        }
    }, [workerMantenimientos, workerSeleccionado]);

    // Trabajador en edición / consulta
    const [trabajadorEnEdicion, setTrabajadorEnEdicion] = useState<WorkerItem | null>(null);
    const [trabajadorConsulta, setTrabajadorConsulta] = useState<WorkerItem | null>(null);

    // Formulario de registro / edición
    const formTrabajador = useForm<WorkerFormData>({
        code: nextGeneratedCode,
        document_number: '',
        first_name: '',
        last_name: '',
        position: 'Jardinero',
        phone: '',
        crew: 'Cuadrilla 1 - Riego y Cisternas',
        observations: '',
        is_active: true,
    });

    // Trabajadores filtrados
    const trabajadoresFiltrados = useMemo(() => {
        return workers.filter((w) => {
            const texto = busqueda.toLowerCase().trim();
            const coincideTexto =
                w.full_name.toLowerCase().includes(texto) ||
                w.code.toLowerCase().includes(texto) ||
                (w.document_number ?? '').toLowerCase().includes(texto) ||
                w.position.toLowerCase().includes(texto) ||
                (w.crew ?? '').toLowerCase().includes(texto);

            const coincideEstado =
                filtroEstado === 'todos' || (filtroEstado === 'activo' && w.is_active) || (filtroEstado === 'inactivo' && !w.is_active);

            const coincideCuadrilla = filtroCuadrilla === 'todos' || w.crew === filtroCuadrilla;

            return coincideTexto && coincideEstado && coincideCuadrilla;
        });
    }, [workers, busqueda, filtroEstado, filtroCuadrilla]);

    // Estadísticas
    const totalActivos = workers.filter((w) => w.is_active).length;
    const totalInactivos = workers.filter((w) => !w.is_active).length;
    const cuadrillasUnicas = [...new Set(workers.map((w) => w.crew).filter(Boolean))];

    // Abrir nuevo
    const abrirCreacion = () => {
        setTrabajadorEnEdicion(null);
        formTrabajador.reset();
        formTrabajador.setData({
            code: nextGeneratedCode,
            document_number: '',
            first_name: '',
            last_name: '',
            position: 'Jardinero',
            phone: '',
            crew: 'Cuadrilla 1 - Riego y Cisternas',
            observations: '',
            is_active: true,
        });
        setModalFormularioAbierto(true);
    };

    useEffect(() => {
        if (new URLSearchParams(window.location.search).get('accion') === 'registrar') {
            abrirCreacion();
        }
    }, []);

    // Abrir edición
    const abrirEdicion = (worker: WorkerItem) => {
        setTrabajadorEnEdicion(worker);
        formTrabajador.setData({
            code: worker.code,
            document_number: worker.document_number ?? '',
            first_name: worker.first_name,
            last_name: worker.last_name,
            position: worker.position,
            phone: worker.phone ?? '',
            crew: worker.crew ?? '',
            observations: worker.observations ?? '',
            is_active: worker.is_active,
        });
        setModalFormularioAbierto(true);
    };

    // Abrir detalle / consulta
    const abrirConsulta = (worker: WorkerItem) => {
        setTrabajadorConsulta(worker);
        setModalDetalleAbierto(true);
    };

    // Guardar trabajador
    const submitTrabajador = (e: FormEvent) => {
        e.preventDefault();
        if (trabajadorEnEdicion) {
            formTrabajador.put(`/trabajadores/${trabajadorEnEdicion.id}`, {
                onSuccess: () => setModalFormularioAbierto(false),
            });
        } else {
            formTrabajador.post('/trabajadores', {
                onSuccess: () => setModalFormularioAbierto(false),
            });
        }
    };

    // Toggle estado
    const toggleEstado = (worker: WorkerItem) => {
        if (confirm(`¿Desea ${worker.is_active ? 'desactivar' : 'activar'} al trabajador ${worker.full_name}?`)) {
            router.patch(`/trabajadores/${worker.id}/toggle-status`);
        }
    };

    // Consultar mantenimientos
    const consultarMantenimientos = (worker: WorkerItem) => {
        router.get(`/trabajadores/${worker.id}/mantenimientos`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Catálogo de Trabajadores - Sistema de Áreas Verdes" />

            <div className="flex flex-1 flex-col p-4 md:p-6 bg-slate-50/60 dark:bg-background min-w-0 max-w-full overflow-x-hidden">
                <div className="mx-auto w-full max-w-7xl flex flex-col gap-6 min-w-0">
                    {/* ENCABEZADO PRINCIPAL */}
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-xs">Municipalidad Distrital de Nuevo Chimbote</span>
                            </div>
                            <h1 className="text-foreground mt-1 flex items-center gap-2.5 text-2xl font-bold tracking-tight md:text-3xl">
                                <Users className="h-8 w-8 text-emerald-600" />
                                Catálogo de Trabajadores
                            </h1>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Registro del personal de campo para trazabilidad de mantenimientos. Los trabajadores no acceden al sistema.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={abrirCreacion}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                        >
                            <UserPlus className="h-4 w-4" />
                            Registrar trabajador
                        </button>
                    </div>

                    {/* TARJETAS RESUMEN */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="bg-card rounded-2xl border p-5 shadow-xs">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-xs font-medium">Total de trabajadores</p>
                                <h3 className="text-foreground mt-1 text-3xl font-bold">{workers.length}</h3>
                                <p className="mt-1 text-xs font-medium text-emerald-600">{totalActivos} activos</p>
                            </div>
                            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600">
                                <Users className="h-6 w-6" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-2xl border p-5 shadow-xs">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-xs font-medium">Cuadrillas</p>
                                <h3 className="text-foreground mt-1 text-3xl font-bold">{cuadrillasUnicas.length}</h3>
                                <p className="text-muted-foreground mt-1 text-xs">Equipos de trabajo</p>
                            </div>
                            <div className="rounded-xl bg-blue-500/10 p-3 text-blue-600">
                                <Shield className="h-6 w-6" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-2xl border p-5 shadow-xs">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-xs font-medium">Mantenimientos asignados</p>
                                <h3 className="text-foreground mt-1 text-3xl font-bold">
                                    {workers.reduce((acc, w) => acc + w.maintenance_records_count, 0)}
                                </h3>
                                <p className="text-muted-foreground mt-1 text-xs">Labores registradas</p>
                            </div>
                            <div className="rounded-xl bg-amber-500/10 p-3 text-amber-600">
                                <Wrench className="h-6 w-6" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-2xl border p-5 shadow-xs">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-xs font-medium">Inactivos</p>
                                <h3 className="text-foreground mt-1 text-3xl font-bold">{totalInactivos}</h3>
                                <p className="text-muted-foreground mt-1 text-xs">Personal no disponible</p>
                            </div>
                            <div className="rounded-xl bg-slate-500/10 p-3 text-slate-500">
                                <Power className="h-6 w-6" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* LISTADO DE TRABAJADORES */}
                <section className="bg-card overflow-hidden rounded-2xl border shadow-xs">
                    {/* FILTROS Y BÚSQUEDA */}
                    <div className="flex flex-col gap-4 border-b p-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="relative flex-1 sm:max-w-xs">
                                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    placeholder="Buscar por nombre, código, DNI o cargo..."
                                    className="bg-background w-full rounded-xl border py-2 pr-4 pl-9 text-xs shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                />
                            </div>

                            <select
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value)}
                                className="bg-background rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            >
                                <option value="todos">Todos los estados</option>
                                <option value="activo">Activos</option>
                                <option value="inactivo">Inactivos</option>
                            </select>

                            <select
                                value={filtroCuadrilla}
                                onChange={(e) => setFiltroCuadrilla(e.target.value)}
                                className="bg-background rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            >
                                <option value="todos">Todas las cuadrillas</option>
                                {cuadrillasUnicas.map((c) => (
                                    <option key={c} value={c!}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="text-muted-foreground text-xs font-medium">
                            Mostrando <span className="text-foreground font-semibold">{trabajadoresFiltrados.length}</span> de {workers.length}{' '}
                            trabajadores
                        </div>
                    </div>

                    {/* TABLA */}
                    <div className="w-full overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left text-sm">
                            <thead className="bg-muted/40 text-muted-foreground border-b text-xs font-semibold tracking-wider uppercase">
                                <tr>
                                    <th className="w-12 px-4 py-3.5 text-center">Ítem</th>
                                    <th className="px-4 py-3.5">Código</th>
                                    <th className="px-4 py-3.5">Documento de identidad</th>
                                    <th className="px-4 py-3.5">Nombres y apellidos</th>
                                    <th className="px-4 py-3.5">Cargo o función</th>
                                    <th className="px-4 py-3.5">Teléfono</th>
                                    <th className="px-4 py-3.5">Cuadrilla</th>
                                    <th className="px-4 py-3.5 text-center">Estado</th>
                                    <th className="px-4 py-3.5 text-center">Acciones</th>
                                </tr>
                            </thead>

                            <tbody className="divide-border divide-y">
                                {trabajadoresFiltrados.length > 0 ? (
                                    trabajadoresFiltrados.map((worker, index) => (
                                        <tr key={worker.id} className="hover:bg-muted/30 transition">
                                            <td className="text-muted-foreground px-4 py-3.5 text-center font-mono text-xs">{index + 1}</td>

                                            <td className="px-4 py-3.5">
                                                <span className="rounded-md border border-emerald-300 bg-emerald-100 px-2 py-0.5 font-mono text-xs font-bold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                                                    {worker.code}
                                                </span>
                                            </td>

                                            <td className="text-foreground px-4 py-3.5 text-xs font-medium">
                                                {worker.document_number || <span className="text-muted-foreground italic">Sin documento</span>}
                                            </td>

                                            <td className="text-foreground px-4 py-3.5 font-semibold">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                                        {worker.first_name.charAt(0)}
                                                        {worker.last_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm">{worker.full_name}</p>
                                                        {worker.maintenance_records_count > 0 && (
                                                            <span className="text-muted-foreground text-[11px]">
                                                                {worker.maintenances_completed_count}/{worker.maintenance_records_count}{' '}
                                                                mantenimientos
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="text-foreground px-4 py-3.5 text-xs font-medium">{worker.position}</td>

                                            <td className="text-foreground px-4 py-3.5 text-xs">
                                                {worker.phone ? (
                                                    <span className="inline-flex items-center gap-1">
                                                        <Phone className="text-muted-foreground h-3 w-3" />
                                                        {worker.phone}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground italic">—</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3.5 text-xs">
                                                {worker.crew ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-100 px-2 py-0.5 font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                                        <Shield className="h-3 w-3" />
                                                        {worker.crew}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground italic">Sin cuadrilla</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3.5 text-center">
                                                {worker.is_active ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                        <CheckCircle2 className="h-3 w-3" /> Activo
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-neutral-800 dark:text-neutral-300">
                                                        <Power className="h-3 w-3" /> Inactivo
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3.5 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    {/* Consultar */}
                                                    <button
                                                        type="button"
                                                        onClick={() => abrirConsulta(worker)}
                                                        title="Consultar datos del trabajador"
                                                        className="rounded-lg p-1.5 text-slate-600 transition hover:bg-emerald-100 hover:text-emerald-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>

                                                    {/* Editar */}
                                                    <button
                                                        type="button"
                                                        onClick={() => abrirEdicion(worker)}
                                                        title="Editar trabajador"
                                                        className="rounded-lg p-1.5 text-slate-600 transition hover:bg-blue-100 hover:text-blue-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>

                                                    {/* Activar / Desactivar */}
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleEstado(worker)}
                                                        title={worker.is_active ? 'Desactivar trabajador' : 'Activar trabajador'}
                                                        className={`rounded-lg p-1.5 transition ${
                                                            worker.is_active
                                                                ? 'text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-950'
                                                                : 'text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950'
                                                        }`}
                                                    >
                                                        <Power className="h-4 w-4" />
                                                    </button>

                                                    {/* Historial de mantenimientos */}
                                                    <button
                                                        type="button"
                                                        onClick={() => consultarMantenimientos(worker)}
                                                        title="Consultar mantenimientos realizados"
                                                        className="rounded-lg p-1.5 text-slate-600 transition hover:bg-amber-100 hover:text-amber-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                                    >
                                                        <ClipboardList className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="text-muted-foreground py-12 text-center">
                                            <Users className="text-muted-foreground/50 mx-auto mb-2 h-8 w-8" />
                                            <p className="font-medium">No se encontraron trabajadores</p>
                                            <p className="mt-1 text-xs">
                                                {workers.length === 0
                                                    ? 'Comience registrando al personal de campo.'
                                                    : 'Pruebe con otro filtro o término de búsqueda.'}
                                            </p>
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
            {/* MODAL DE REGISTRO / EDICIÓN DE TRABAJADOR                                 */}
            {/* ========================================================================= */}
            {modalFormularioAbierto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="bg-background flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border shadow-2xl">
                        <div className="bg-muted/20 flex items-center justify-between border-b px-6 py-4">
                            <div>
                                <h2 className="text-foreground flex items-center gap-2 text-xl font-bold">
                                    <UserPlus className="h-5 w-5 text-emerald-600" />
                                    {trabajadorEnEdicion ? `Editar: ${trabajadorEnEdicion.full_name}` : 'Registro de Nuevo Trabajador'}
                                </h2>
                                <p className="text-muted-foreground mt-0.5 text-xs">
                                    {trabajadorEnEdicion
                                        ? 'Actualice los datos del trabajador.'
                                        : 'Complete los datos de identificación del personal de campo.'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalFormularioAbierto(false)}
                                className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg p-2 transition"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={submitTrabajador} className="flex-1 space-y-5 overflow-y-auto p-6">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Código automático */}
                                <div>
                                    <label className="mb-1 block text-xs font-semibold">
                                        Código <span className="text-emerald-600">(automático)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formTrabajador.data.code}
                                        className="bg-muted/30 w-full rounded-xl border px-3 py-2 font-mono text-xs font-bold shadow-2xs"
                                        readOnly
                                    />
                                </div>

                                {/* DNI / Documento */}
                                <div>
                                    <label className="mb-1 block text-xs font-semibold">
                                        DNI o documento de identidad <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={20}
                                        value={formTrabajador.data.document_number}
                                        onChange={(e) => formTrabajador.setData('document_number', e.target.value)}
                                        placeholder="Ej: 12345678"
                                        className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                    />
                                    {formTrabajador.errors.document_number && (
                                        <p className="mt-0.5 text-xs text-red-500">{formTrabajador.errors.document_number}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Nombres */}
                                <div>
                                    <label className="mb-1 block text-xs font-semibold">
                                        Nombres <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formTrabajador.data.first_name}
                                        onChange={(e) => formTrabajador.setData('first_name', e.target.value)}
                                        placeholder="Ej: Carlos Eduardo"
                                        className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                    />
                                    {formTrabajador.errors.first_name && (
                                        <p className="mt-0.5 text-xs text-red-500">{formTrabajador.errors.first_name}</p>
                                    )}
                                </div>

                                {/* Apellidos */}
                                <div>
                                    <label className="mb-1 block text-xs font-semibold">
                                        Apellidos <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formTrabajador.data.last_name}
                                        onChange={(e) => formTrabajador.setData('last_name', e.target.value)}
                                        placeholder="Ej: Méndez Torres"
                                        className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                    />
                                    {formTrabajador.errors.last_name && (
                                        <p className="mt-0.5 text-xs text-red-500">{formTrabajador.errors.last_name}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Cargo o función */}
                                <div>
                                    <label className="mb-1 block text-xs font-semibold">
                                        Cargo o función <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        list="lista-cargos"
                                        required
                                        value={formTrabajador.data.position}
                                        onChange={(e) => formTrabajador.setData('position', e.target.value)}
                                        placeholder="Seleccione o ingrese el cargo"
                                        className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                    />
                                    <datalist id="lista-cargos">
                                        {CARGOS.map((c) => (
                                            <option key={c} value={c} />
                                        ))}
                                    </datalist>
                                </div>

                                {/* Teléfono */}
                                <div>
                                    <label className="mb-1 block text-xs font-semibold">Teléfono (opcional)</label>
                                    <input
                                        type="text"
                                        maxLength={30}
                                        value={formTrabajador.data.phone}
                                        onChange={(e) => formTrabajador.setData('phone', e.target.value)}
                                        placeholder="Ej: 943 123 456"
                                        className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Cuadrilla */}
                                <div>
                                    <label className="mb-1 block text-xs font-semibold">Cuadrilla (opcional)</label>
                                    <input
                                        type="text"
                                        list="lista-cuadrillas"
                                        value={formTrabajador.data.crew}
                                        onChange={(e) => formTrabajador.setData('crew', e.target.value)}
                                        placeholder="Seleccione o ingrese cuadrilla"
                                        className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                    />
                                    <datalist id="lista-cuadrillas">
                                        {CUADRILLAS.map((c) => (
                                            <option key={c} value={c} />
                                        ))}
                                    </datalist>
                                </div>

                                {/* Estado */}
                                <div>
                                    <label className="mb-1 block text-xs font-semibold">Estado</label>
                                    <select
                                        value={formTrabajador.data.is_active ? 'activo' : 'inactivo'}
                                        onChange={(e) => formTrabajador.setData('is_active', e.target.value === 'activo')}
                                        className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                    >
                                        <option value="activo">Activo</option>
                                        <option value="inactivo">Inactivo</option>
                                    </select>
                                </div>
                            </div>

                            {/* Observaciones */}
                            <div>
                                <label className="mb-1 block text-xs font-semibold">Observaciones</label>
                                <textarea
                                    rows={2}
                                    value={formTrabajador.data.observations}
                                    onChange={(e) => formTrabajador.setData('observations', e.target.value)}
                                    placeholder="Notas internas sobre el trabajador..."
                                    className="bg-background w-full rounded-xl border px-3 py-2 text-xs shadow-2xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                />
                            </div>

                            {/* Botones */}
                            <div className="flex justify-end gap-3 border-t pt-3">
                                <button
                                    type="button"
                                    onClick={() => setModalFormularioAbierto(false)}
                                    className="hover:bg-muted rounded-xl border px-4 py-2 text-xs font-semibold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={formTrabajador.processing}
                                    className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    {formTrabajador.processing
                                        ? 'Guardando...'
                                        : trabajadorEnEdicion
                                          ? 'Actualizar Trabajador'
                                          : 'Registrar Trabajador'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL DETALLE / CONSULTA DE TRABAJADOR                                    */}
            {/* ========================================================================= */}
            {modalDetalleAbierto && trabajadorConsulta && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="bg-background flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border shadow-2xl">
                        <div className="bg-muted/20 flex items-center justify-between border-b px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-base font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                    {trabajadorConsulta.first_name.charAt(0)}
                                    {trabajadorConsulta.last_name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-foreground text-lg font-bold">{trabajadorConsulta.full_name}</h3>
                                    <p className="text-muted-foreground font-mono text-xs">{trabajadorConsulta.code}</p>
                                </div>
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
                            <div className="bg-muted/10 grid grid-cols-2 gap-4 rounded-xl border p-4">
                                <div>
                                    <span className="text-muted-foreground block">Documento de identidad:</span>
                                    <strong className="text-foreground">{trabajadorConsulta.document_number || 'Sin documento'}</strong>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Cargo o función:</span>
                                    <strong className="text-foreground">{trabajadorConsulta.position}</strong>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Teléfono:</span>
                                    <strong className="text-foreground">{trabajadorConsulta.phone || '—'}</strong>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Cuadrilla:</span>
                                    <strong className="text-foreground">{trabajadorConsulta.crew || 'Sin cuadrilla'}</strong>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Estado:</span>
                                    <strong className={trabajadorConsulta.is_active ? 'text-emerald-600' : 'text-slate-500'}>
                                        {trabajadorConsulta.is_active ? 'Activo' : 'Inactivo'}
                                    </strong>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Fecha de registro:</span>
                                    <strong className="text-foreground">{trabajadorConsulta.created_at}</strong>
                                </div>
                            </div>

                            <div className="bg-muted/10 rounded-xl border p-4">
                                <h4 className="text-muted-foreground mb-2 text-xs font-bold tracking-wider uppercase">Resumen de actividad</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-xl bg-emerald-50 p-3 text-center dark:bg-emerald-950/30">
                                        <p className="text-2xl font-bold text-emerald-600">{trabajadorConsulta.maintenances_completed_count}</p>
                                        <p className="text-muted-foreground text-[11px]">Mantenimientos completados</p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-muted/60">
                                        <p className="text-foreground text-2xl font-bold">{trabajadorConsulta.maintenance_records_count}</p>
                                        <p className="text-muted-foreground text-[11px]">Total de asignaciones</p>
                                    </div>
                                </div>
                            </div>

                            {trabajadorConsulta.observations && (
                                <div>
                                    <span className="text-muted-foreground block font-semibold">Observaciones:</span>
                                    <p className="bg-muted/20 text-foreground mt-0.5 rounded-lg border p-2.5">{trabajadorConsulta.observations}</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-muted/10 flex items-center justify-between border-t px-6 py-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setModalDetalleAbierto(false);
                                    consultarMantenimientos(trabajadorConsulta);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-100 px-4 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-200"
                            >
                                <ClipboardList className="h-4 w-4" /> Ver mantenimientos realizados
                            </button>
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
            {/* MODAL HISTORIAL DE MANTENIMIENTOS DEL TRABAJADOR                          */}
            {/* ========================================================================= */}
            {modalHistorialAbierto && workerMantenimientos && workerSeleccionado && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="bg-background flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border shadow-2xl">
                        <div className="bg-muted/20 flex items-center justify-between border-b px-6 py-4">
                            <div>
                                <h3 className="text-foreground flex items-center gap-2 text-lg font-bold">
                                    <ClipboardList className="h-5 w-5 text-amber-600" />
                                    Mantenimientos realizados — {workerSeleccionado.full_name}
                                </h3>
                                <p className="text-muted-foreground text-xs">
                                    {workerSeleccionado.code} • {workerSeleccionado.position}
                                    {workerSeleccionado.crew && ` • ${workerSeleccionado.crew}`}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalHistorialAbierto(false)}
                                className="text-muted-foreground hover:bg-muted rounded-lg p-2"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {workerMantenimientos.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-muted/40 text-muted-foreground border-b text-[11px] font-semibold tracking-wider uppercase">
                                            <tr>
                                                <th className="px-3 py-2">N° PM</th>
                                                <th className="px-3 py-2">Parque</th>
                                                <th className="px-3 py-2">Tipo</th>
                                                <th className="px-3 py-2">Programada</th>
                                                <th className="px-3 py-2">Ejecutada</th>
                                                <th className="px-3 py-2 text-center">Estado</th>
                                                <th className="px-3 py-2 text-center">Duración</th>
                                                <th className="px-3 py-2">Resultado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-border divide-y">
                                            {workerMantenimientos.map((m) => (
                                                <tr key={m.id} className="hover:bg-muted/20">
                                                    <td className="px-3 py-2 font-mono font-bold">
                                                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 dark:bg-muted/60">
                                                            <FileText className="h-3 w-3 text-emerald-600" />
                                                            {m.maintenance_number}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 font-medium">
                                                        {m.park_name}
                                                        <span className="text-muted-foreground block">{m.park_code}</span>
                                                    </td>
                                                    <td className="px-3 py-2">{m.maintenance_type}</td>
                                                    <td className="px-3 py-2">{m.scheduled_date ?? '—'}</td>
                                                    <td className="px-3 py-2 font-medium">{m.execution_date ?? '—'}</td>
                                                    <td className="px-3 py-2 text-center">
                                                        <span
                                                            className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${ESTILOS_ESTADO[m.status] ?? 'bg-slate-100 text-slate-700'}`}
                                                        >
                                                            {m.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 text-center font-medium">
                                                        {m.duration_minutes ? `${m.duration_minutes}m` : '—'}
                                                    </td>
                                                    <td className="px-3 py-2">{m.result ?? '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-muted-foreground py-10 text-center">
                                    <ClipboardList className="text-muted-foreground/50 mx-auto mb-2 h-8 w-8" />
                                    <p className="font-medium">Sin mantenimientos registrados</p>
                                    <p className="mt-1 text-xs">Este trabajador aún no tiene labores asignadas en el sistema.</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-muted/20 flex justify-end border-t px-6 py-3.5">
                            <button
                                type="button"
                                onClick={() => setModalHistorialAbierto(false)}
                                className="hover:bg-muted rounded-xl border px-4 py-2 text-xs font-semibold"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
