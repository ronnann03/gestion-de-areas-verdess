import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import {
    Calendar,
    CalendarDays,
    CheckCircle2,
    Download,
    Droplet,
    Droplets,
    Edit3,
    Eye,
    FileText,
    History,
    Info,
    Layers,
    LoaderCircle,
    LocateFixed,
    MapPin,
    Navigation,
    Plus,
    Power,
    Search,
    Sparkles,
    Trees,
    Wrench,
    X,
    Zap,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';

type MapCoordinates = {
    lat: number;
    lng: number;
};

type ReverseGeocodingResult = {
    display_name?: string;
    name?: string;
    address?: {
        road?: string;
        pedestrian?: string;
        footway?: string;
        house_number?: string;
        neighbourhood?: string;
        suburb?: string;
        quarter?: string;
        city_district?: string;
        town?: string;
        city?: string;
        amenity?: string;
        leisure?: string;
    };
};

type ParkFormData = {
    code: string;
    name: string;
    green_area_type: string;
    registration_date: string;
    address: string;
    zone: string;
    reference: string;
    latitude: string;
    longitude: string;
    public_use_area: string;
    green_area: string;
    total_area: string;
    has_water_point: boolean;
    water_supply_type: string;
    water_point_status: string;
    water_point_observations: string;
    conservation_status: 'bueno' | 'regular' | 'malo';
    photo: File | null;
    photo_url: string;
    general_observations: string;
    is_active: boolean;
};

const DEFAULT_MAP_LOCATION: MapCoordinates = { lat: -9.1286, lng: -78.5307 };
const NUEVO_CHIMBOTE_BOUNDS = L.latLngBounds(
    [-9.22, -78.62],
    [-9.05, -78.46],
);
const PARK_MARKER_ICON = L.icon({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

// Tipos de datos
export interface MaintenanceRecord {
    id: number;
    maintenance_type: string;
    is_extraordinary: boolean;
    scheduled_date: string | null;
    execution_date: string | null;
    responsible_worker: string;
    start_time: string | null;
    end_time: string | null;
    duration_minutes: number | null;
    status: string;
    observations: string | null;
    document_name: string | null;
    document_url: string | null;
}

export interface ParkSchedule {
    id: number;
    maintenance_type: string;
    frequency_days: number;
    last_executed_at: string | null;
    next_scheduled_date: string | null;
    is_active: boolean;
}

export interface Park {
    id: number;
    code: string;
    name: string;
    green_area_type: string;
    registration_date: string | null;
    address: string | null;
    zone: string | null;
    reference: string | null;
    latitude: string | number | null;
    longitude: string | number | null;
    public_use_area: string | number | null;
    green_area: string | number | null;
    total_area: string | number | null;
    has_water_point: boolean;
    water_supply_type: string | null;
    water_point_status: string | null;
    water_point_observations: string | null;
    conservation_status: 'bueno' | 'regular' | 'malo';
    photo_url: string | null;
    general_observations: string | null;
    is_active: boolean;
    created_at: string | null;
    next_maintenance: {
        type: string;
        date: string;
        raw_date: string;
    } | null;
    schedules: ParkSchedule[];
    maintenance_records: MaintenanceRecord[];
}

export interface MaintenanceRule {
    id: number;
    green_area_type: string;
    maintenance_type: string;
    frequency_days: number;
    is_active: boolean;
}

interface Props {
    parks: Park[];
    nextGeneratedCode: string;
    maintenanceRules: MaintenanceRule[];
    greenAreaTypes: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Gestión de parques', href: '/parques' },
];

const ESTILOS_CONSERVACION = {
    bueno: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
    regular: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
    malo: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800',
};

export default function ParksIndex({ parks, nextGeneratedCode, maintenanceRules, greenAreaTypes }: Props) {
    // Filtros de búsqueda
    const [busqueda, setBusqueda] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('todos');
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [filtroActivo, setFiltroActivo] = useState('todos');

    // Modales
    const [modalFormularioAbierto, setModalFormularioAbierto] = useState(false);
    const [parqueEnEdicion, setParqueEnEdicion] = useState<Park | null>(null);

    const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
    const [parqueSeleccionado, setParqueSeleccionado] = useState<Park | null>(null);
    const [tabDetalleActiva, setTabDetalleActiva] = useState<'resumen' | 'ubicacion' | 'agua' | 'programaciones' | 'historial' | 'documentos'>('resumen');

    const [modalHistorialAbierto, setModalHistorialAbierto] = useState(false);
    const [modalUbicacionAbierto, setModalUbicacionAbierto] = useState(false);
    const [modalExtraordinarioAbierto, setModalExtraordinarioAbierto] = useState(false);
    const [modalSelectorMapaAbierto, setModalSelectorMapaAbierto] = useState(false);
    const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<MapCoordinates>(DEFAULT_MAP_LOCATION);
    const [cargandoMapa, setCargandoMapa] = useState(false);
    const [buscandoDireccion, setBuscandoDireccion] = useState(false);
    const [errorMapa, setErrorMapa] = useState('');
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const leafletMapRef = useRef<L.Map | null>(null);
    const leafletMarkerRef = useRef<L.Marker | null>(null);
    const initialMapLocationRef = useRef<MapCoordinates>(DEFAULT_MAP_LOCATION);

    // Formulario de Parque (Crear y Editar)
    const formParque = useForm<ParkFormData>({
        code: '',
        name: '',
        green_area_type: greenAreaTypes[0] ?? 'Parque',
        registration_date: new Date().toISOString().split('T')[0],
        address: '',
        zone: '',
        reference: '',
        latitude: '',
        longitude: '',
        public_use_area: '',
        green_area: '',
        total_area: '',
        has_water_point: false,
        water_supply_type: 'Red pública',
        water_point_status: 'Operativo',
        water_point_observations: '',
        conservation_status: 'bueno',
        photo: null as File | null,
        photo_url: '',
        general_observations: '',
        is_active: true,
    });

    // Formulario de Mantenimiento Extraordinario
    const formExtraordinario = useForm({
        maintenance_type: 'Poda de emergencia',
        execution_date: new Date().toISOString().split('T')[0],
        responsible_worker: '',
        start_time: '08:00',
        end_time: '11:00',
        duration_minutes: 180,
        observations: '',
    });

    const tiposAreaDisponibles = useMemo(
        () => Array.from(new Set([...greenAreaTypes, ...parks.map((park) => park.green_area_type)])).sort(),
        [greenAreaTypes, parks],
    );

    // Parques filtrados
    const parquesFiltrados = useMemo(() => {
        return parks.filter((p) => {
            const termino = busqueda.toLowerCase().trim();
            const coincideTexto =
                p.name.toLowerCase().includes(termino) ||
                p.code.toLowerCase().includes(termino) ||
                (p.address ?? '').toLowerCase().includes(termino) ||
                (p.zone ?? '').toLowerCase().includes(termino);

            const coincideTipo = filtroTipo === 'todos' || p.green_area_type === filtroTipo;
            const coincideEstado = filtroEstado === 'todos' || p.conservation_status === filtroEstado;
            const coincideActivo =
                filtroActivo === 'todos' ||
                (filtroActivo === 'activo' && p.is_active) ||
                (filtroActivo === 'inactivo' && !p.is_active);

            return coincideTexto && coincideTipo && coincideEstado && coincideActivo;
        });
    }, [parks, busqueda, filtroTipo, filtroEstado, filtroActivo]);

    // Reglas automáticas aplicables según el tipo seleccionado (Automatización)
    const reglasAplicables = useMemo(() => {
        const tipoActual = formParque.data.green_area_type;
        return maintenanceRules.filter((r) => r.green_area_type === tipoActual);
    }, [maintenanceRules, formParque.data.green_area_type]);

    // Abrir modal de nuevo parque
    const abrirCreacion = () => {
        setParqueEnEdicion(null);
        formParque.reset();
        formParque.setData({
            code: nextGeneratedCode,
            name: '',
            green_area_type: greenAreaTypes[0] ?? 'Parque',
            registration_date: new Date().toISOString().split('T')[0],
            address: '',
            zone: '',
            reference: '',
            latitude: '',
            longitude: '',
            public_use_area: '',
            green_area: '',
            total_area: '',
            has_water_point: true,
            water_supply_type: 'Red pública',
            water_point_status: 'Operativo',
            water_point_observations: '',
            conservation_status: 'bueno',
            photo: null,
            photo_url: '',
            general_observations: '',
            is_active: true,
        });
        formParque.clearErrors();
        setModalFormularioAbierto(true);
    };

    // Abrir modal de edición
    const abrirEdicion = (park: Park) => {
        setParqueEnEdicion(park);
        formParque.clearErrors();
        formParque.setData({
            code: park.code,
            name: park.name,
            green_area_type: park.green_area_type,
            registration_date: park.registration_date ?? new Date().toISOString().split('T')[0],
            address: park.address ?? '',
            zone: park.zone ?? '',
            reference: park.reference ?? '',
            latitude: park.latitude ? String(park.latitude) : '',
            longitude: park.longitude ? String(park.longitude) : '',
            public_use_area: park.public_use_area ? String(park.public_use_area) : '',
            green_area: park.green_area ? String(park.green_area) : '',
            total_area: park.total_area ? String(park.total_area) : '',
            has_water_point: park.has_water_point,
            water_supply_type: park.water_supply_type ?? 'Red pública',
            water_point_status: park.water_point_status ?? 'Operativo',
            water_point_observations: park.water_point_observations ?? '',
            conservation_status: park.conservation_status,
            photo: null,
            photo_url: park.photo_url ?? '',
            general_observations: park.general_observations ?? '',
            is_active: park.is_active,
        });
        setModalFormularioAbierto(true);
    };

    // Guardar o Actualizar Parque
    const guardarParque = (e: FormEvent) => {
        e.preventDefault();
        if (parqueEnEdicion) {
            formParque.put(`/parques/${parqueEnEdicion.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setModalFormularioAbierto(false);
                    setParqueEnEdicion(null);
                },
            });
        } else {
            formParque.post('/parques', {
                preserveScroll: true,
                onSuccess: () => {
                    setModalFormularioAbierto(false);
                },
            });
        }
    };

    // Toggle de activación / desactivación
    const toggleActivo = (park: Park) => {
        const accion = park.is_active ? 'desactivar' : 'activar';
        if (confirm(`¿Estás seguro de ${accion} el parque "${park.name}" (${park.code})?`)) {
            router.patch(`/parques/${park.id}/toggle-status`, {}, { preserveScroll: true });
        }
    };

    // Abrir detalle
    const verDetalle = (park: Park, tab: 'resumen' | 'ubicacion' | 'agua' | 'programaciones' | 'historial' | 'documentos' = 'resumen') => {
        setParqueSeleccionado(park);
        setTabDetalleActiva(tab);
        setModalDetalleAbierto(true);
    };

    // Abrir historial directo
    const verHistorial = (park: Park) => {
        setParqueSeleccionado(park);
        setModalHistorialAbierto(true);
    };

    // Abrir ubicación directa
    const verUbicacion = (park: Park) => {
        setParqueSeleccionado(park);
        setModalUbicacionAbierto(true);
    };

    // Abrir modal mantenimiento extraordinario
    const abrirMantenimientoExtraordinario = (park: Park) => {
        setParqueSeleccionado(park);
        formExtraordinario.reset();
        formExtraordinario.setData({
            maintenance_type: 'Poda de emergencia',
            execution_date: new Date().toISOString().split('T')[0],
            responsible_worker: 'Cuadrilla de Respuesta Rápida',
            start_time: '08:00',
            end_time: '11:00',
            duration_minutes: 180,
            observations: '',
        });
        setModalExtraordinarioAbierto(true);
    };

    // Guardar Mantenimiento Extraordinario
    const guardarMantenimientoExtraordinario = (e: FormEvent) => {
        e.preventDefault();
        if (!parqueSeleccionado) return;

        formExtraordinario.post(`/parques/${parqueSeleccionado.id}/mantenimiento-extraordinario`, {
            preserveScroll: true,
            onSuccess: () => {
                setModalExtraordinarioAbierto(false);
            },
        });
    };

    const abrirSelectorMapa = () => {
        const currentLatitude = Number(formParque.data.latitude);
        const currentLongitude = Number(formParque.data.longitude);
        const hasCurrentLocation =
            Number.isFinite(currentLatitude) &&
            Number.isFinite(currentLongitude) &&
            currentLatitude >= -90 &&
            currentLatitude <= 90 &&
            currentLongitude >= -180 &&
            currentLongitude <= 180 &&
            NUEVO_CHIMBOTE_BOUNDS.contains([currentLatitude, currentLongitude]);

        const initialLocation = hasCurrentLocation
            ? { lat: currentLatitude, lng: currentLongitude }
            : DEFAULT_MAP_LOCATION;
        initialMapLocationRef.current = initialLocation;
        setUbicacionSeleccionada(initialLocation);
        setErrorMapa('');
        setModalSelectorMapaAbierto(true);
    };

    const centrarEnUbicacionActual = () => {
        if (!navigator.geolocation) {
            setErrorMapa('La geolocalización no es compatible con este navegador.');
            return;
        }

        setCargandoMapa(true);
        setErrorMapa('');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coordinates = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                if (!NUEVO_CHIMBOTE_BOUNDS.contains([coordinates.lat, coordinates.lng])) {
                    setErrorMapa('Tu ubicación actual está fuera del área urbana de Nuevo Chimbote.');
                    setCargandoMapa(false);
                    return;
                }
                setUbicacionSeleccionada(coordinates);
                leafletMapRef.current?.setView([coordinates.lat, coordinates.lng], 18);
                leafletMarkerRef.current?.setLatLng([coordinates.lat, coordinates.lng]);
                setCargandoMapa(false);
            },
            (error) => {
                setErrorMapa(`No se pudo obtener la ubicación actual: ${error.message}`);
                setCargandoMapa(false);
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    };

    const confirmarUbicacionMapa = async () => {
        setBuscandoDireccion(true);
        setErrorMapa('');

        try {
            const query = new URLSearchParams({
                format: 'jsonv2',
                lat: String(ubicacionSeleccionada.lat),
                lon: String(ubicacionSeleccionada.lng),
                zoom: '18',
                addressdetails: '1',
                'accept-language': 'es',
            });
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${query.toString()}`, {
                headers: { Accept: 'application/json' },
            });

            if (!response.ok) throw new Error('El servicio de direcciones no respondió correctamente.');

            const result = (await response.json()) as ReverseGeocodingResult;
            const address = result.address ?? {};
            const street = address.road ?? address.pedestrian ?? address.footway ?? '';
            const shortAddress = [street, address.house_number].filter(Boolean).join(' ');
            const zone =
                address.neighbourhood ??
                address.suburb ??
                address.quarter ??
                address.city_district ??
                address.town ??
                address.city ??
                '';
            const reference = address.amenity ?? address.leisure ?? result.name ?? '';

            formParque.setData((previous) => ({
                ...previous,
                latitude: ubicacionSeleccionada.lat.toFixed(6),
                longitude: ubicacionSeleccionada.lng.toFixed(6),
                address: shortAddress || result.display_name || previous.address,
                zone: zone || previous.zone,
                reference: reference || previous.reference,
            }));
            setModalSelectorMapaAbierto(false);
        } catch (error) {
            formParque.setData((previous) => ({
                ...previous,
                latitude: ubicacionSeleccionada.lat.toFixed(6),
                longitude: ubicacionSeleccionada.lng.toFixed(6),
            }));
            setErrorMapa(error instanceof Error ? error.message : 'No se pudo obtener la dirección del punto seleccionado.');
        } finally {
            setBuscandoDireccion(false);
        }
    };

    useEffect(() => {
        if (!modalSelectorMapaAbierto || !mapContainerRef.current) return;

        setCargandoMapa(true);
        const container = mapContainerRef.current;
        const initialLocation = initialMapLocationRef.current;
        const map = L.map(container, {
            center: [initialLocation.lat, initialLocation.lng],
            zoom: 14,
            minZoom: 13,
            maxZoom: 19,
            maxBounds: NUEVO_CHIMBOTE_BOUNDS,
            maxBoundsViscosity: 1,
            zoomControl: true,
            attributionControl: true,
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            minZoom: 13,
            maxZoom: 19,
            bounds: NUEVO_CHIMBOTE_BOUNDS,
            noWrap: true,
            keepBuffer: 1,
            updateWhenIdle: true,
        }).addTo(map);

        const marker = L.marker([initialLocation.lat, initialLocation.lng], {
            draggable: true,
            icon: PARK_MARKER_ICON,
        }).addTo(map);
        const updateCoordinates = (coordinates: MapCoordinates) => {
            if (!NUEVO_CHIMBOTE_BOUNDS.contains([coordinates.lat, coordinates.lng])) return;
            marker.setLatLng([coordinates.lat, coordinates.lng]);
            setUbicacionSeleccionada(coordinates);
            setErrorMapa('');
        };

        map.on('click', (event: L.LeafletMouseEvent) => updateCoordinates(event.latlng));
        marker.on('dragend', () => updateCoordinates(marker.getLatLng()));
        leafletMapRef.current = map;
        leafletMarkerRef.current = marker;

        const resizeTimer = window.setTimeout(() => {
            map.invalidateSize();
            map.setMaxBounds(NUEVO_CHIMBOTE_BOUNDS);
            setCargandoMapa(false);
        }, 100);

        return () => {
            window.clearTimeout(resizeTimer);
            leafletMapRef.current?.remove();
            leafletMapRef.current = null;
            leafletMarkerRef.current = null;
        };
    }, [modalSelectorMapaAbierto]);

    useEffect(() => {
        if (new URLSearchParams(window.location.search).get('accion') === 'registrar') {
            abrirCreacion();
        }
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestión de Parques - Sistema de Áreas Verdes" />

            <div className="flex flex-1 flex-col p-4 md:p-6 bg-slate-50/60 dark:bg-background">
                <div className="mx-auto w-full max-w-7xl flex flex-col gap-6">
                    {/* ENCABEZADO PRINCIPAL */}
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Municipalidad Distrital de Nuevo Chimbote</span>
                            </div>
                            <h1 className="mt-1 flex items-center gap-2.5 text-2xl font-bold tracking-tight md:text-3xl text-foreground">
                                <Trees className="h-8 w-8 text-emerald-600" />
                                Gestión de Parques y Áreas Verdes
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Administración integral, programación automatizada de mantenimientos, control hidráulico e historial de intervenciones.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={abrirCreacion}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 cursor-pointer"
                            >
                                <Plus className="h-4 w-4" />
                                Registrar nuevo parque
                            </button>
                        </div>
                    </div>

                    {/* TARJETAS RESUMEN DE INDICADORES */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border bg-card p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Total de áreas verdes</p>
                                <h3 className="mt-1 text-3xl font-bold text-foreground">{parks.length}</h3>
                                <p className="mt-1 text-xs text-emerald-600 font-medium">
                                    {parks.filter((p) => p.is_active).length} activos en el distrito
                                </p>
                            </div>
                            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600">
                                <Trees className="h-6 w-6" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border bg-card p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Área verde total protegida</p>
                                <h3 className="mt-1 text-3xl font-bold text-foreground">
                                    {parks
                                        .reduce((acc, p) => acc + (Number(p.green_area) || 0), 0)
                                        .toLocaleString('es-PE', { maximumFractionDigits: 1 })}{' '}
                                    <span className="text-base font-normal text-muted-foreground">m²</span>
                                </h3>
                                <p className="mt-1 text-xs text-muted-foreground">Superficie vegetal municipal</p>
                            </div>
                            <div className="rounded-xl bg-green-500/10 p-3 text-green-600">
                                <Layers className="h-6 w-6" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border bg-card p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Puntos de agua operativos</p>
                                <h3 className="mt-1 text-3xl font-bold text-foreground">
                                    {parks.filter((p) => p.has_water_point && p.water_point_status === 'Operativo').length}
                                    <span className="text-base font-normal text-muted-foreground"> / {parks.filter((p) => p.has_water_point).length}</span>
                                </h3>
                                <p className="mt-1 text-xs text-blue-600 font-medium">Abastecimiento verificado</p>
                            </div>
                            <div className="rounded-xl bg-blue-500/10 p-3 text-blue-600">
                                <Droplets className="h-6 w-6" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border bg-card p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Mantenimientos ejecutados</p>
                                <h3 className="mt-1 text-3xl font-bold text-foreground">
                                    {parks.reduce((acc, p) => acc + p.maintenance_records.filter((m) => m.status === 'ejecutado').length, 0)}
                                </h3>
                                <p className="mt-1 text-xs text-amber-600 font-medium">Intervenciones registradas</p>
                            </div>
                            <div className="rounded-xl bg-amber-500/10 p-3 text-amber-600">
                                <Wrench className="h-6 w-6" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* LISTADO DE PARQUES */}
                <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                    {/* FILTROS Y BÚSQUEDA */}
                    {/* FILTROS Y BÚSQUEDA */}
                    <div className="flex flex-col gap-4 border-b p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-1 flex-wrap items-center gap-3">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    placeholder="Buscar código, nombre, ubicación..."
                                    className="w-full rounded-xl border bg-background py-2 pr-3 pl-9 text-xs sm:text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                />
                            </div>

                            {/* Filtro por tipo */}
                            <select
                                value={filtroTipo}
                                onChange={(e) => setFiltroTipo(e.target.value)}
                                className="w-full sm:w-auto rounded-xl border bg-background px-3 py-2 text-xs sm:text-sm outline-none transition focus:border-emerald-500"
                            >
                                <option value="todos">Todos los tipos</option>
                                {tiposAreaDisponibles.map((tipo) => (
                                    <option key={tipo} value={tipo}>{tipo}</option>
                                ))}
                            </select>

                            {/* Filtro por estado conservación */}
                            <select
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value)}
                                className="w-full sm:w-auto rounded-xl border bg-background px-3 py-2 text-xs sm:text-sm outline-none transition focus:border-emerald-500"
                            >
                                <option value="todos">Toda conservación</option>
                                <option value="bueno">Bueno</option>
                                <option value="regular">Regular</option>
                                <option value="malo">Malo</option>
                            </select>

                            {/* Filtro por estado activo */}
                            <select
                                value={filtroActivo}
                                onChange={(e) => setFiltroActivo(e.target.value)}
                                className="w-full sm:w-auto rounded-xl border bg-background px-3 py-2 text-xs sm:text-sm outline-none transition focus:border-emerald-500"
                            >
                                <option value="todos">Todos los registros</option>
                                <option value="activo">Solo Activos</option>
                                <option value="inactivo">Solo Inactivos</option>
                            </select>
                        </div>

                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                            Mostrando <span className="font-semibold text-foreground">{parquesFiltrados.length}</span> de {parks.length} parques
                        </div>
                    </div>

                    {/* TABLA PRINCIPAL */}
                    <div className="w-full overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b">
                                <tr>
                                    <th className="px-3 py-3 text-center w-12 whitespace-nowrap">Ítem</th>
                                    <th className="px-3 py-3 w-24 whitespace-nowrap">Código</th>
                                    <th className="px-3 py-3 min-w-[180px]">Denominación</th>
                                    <th className="px-3 py-3 w-28 whitespace-nowrap">Tipo</th>
                                    <th className="px-3 py-3 min-w-[170px]">Ubicación</th>
                                    <th className="px-3 py-3 text-right w-24 whitespace-nowrap">Área</th>
                                    <th className="px-3 py-3 w-32 whitespace-nowrap">Punto de agua</th>
                                    <th className="px-3 py-3 text-center w-28 whitespace-nowrap">Conservación</th>
                                    <th className="px-3 py-3 text-center w-20 whitespace-nowrap">Estado</th>
                                    <th className="px-3 py-3 min-w-[140px] whitespace-nowrap">Próx. Mantenimiento</th>
                                    <th className="px-3 py-3 text-center w-36 whitespace-nowrap sticky right-0 bg-background/95 dark:bg-card/95 backdrop-blur-xs border-l shadow-xs">Acciones</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-border">
                                {parquesFiltrados.length > 0 ? (
                                    parquesFiltrados.map((park, index) => (
                                        <tr
                                            key={park.id}
                                            className={`transition-colors hover:bg-muted/40 ${!park.is_active ? 'opacity-65 bg-slate-100/40 dark:bg-muted/40' : ''}`}
                                        >
                                            {/* Ítem visual */}
                                            <td className="px-3 py-2.5 text-center font-mono text-xs text-muted-foreground">
                                                {index + 1}
                                            </td>

                                            {/* Código permanente */}
                                            <td className="px-3 py-2.5 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100/70 text-emerald-900 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800">
                                                    {park.code}
                                                </span>
                                            </td>

                                            {/* Denominación */}
                                            <td className="px-3 py-2.5 font-semibold text-foreground">
                                                <div className="flex items-center gap-2">
                                                    <span className="truncate max-w-[180px]" title={park.name}>
                                                        {park.name}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Tipo de área verde */}
                                            <td className="px-3 py-2.5 whitespace-nowrap">
                                                <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-neutral-800 dark:text-neutral-300">
                                                    {park.green_area_type}
                                                </span>
                                            </td>

                                            {/* Ubicación */}
                                            <td className="px-3 py-2.5">
                                                <div className="flex flex-col text-xs max-w-[180px]">
                                                    <span className="flex items-center gap-1 font-medium truncate" title={park.address ?? 'Sin dirección'}>
                                                        <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                                        {park.address || 'Sin dirección'}
                                                    </span>
                                                    {park.zone && (
                                                        <span className="text-muted-foreground truncate pl-4">
                                                            {park.zone}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Área verde en m² */}
                                            <td className="px-3 py-2.5 text-right font-medium whitespace-nowrap">
                                                {park.green_area ? (
                                                    <span>
                                                        {Number(park.green_area).toLocaleString('es-PE')} <span className="text-xs text-muted-foreground">m²</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </td>

                                            {/* Punto de agua */}
                                            <td className="px-3 py-2.5 whitespace-nowrap">
                                                {park.has_water_point ? (
                                                    <div className="flex flex-col text-xs">
                                                        <span className="inline-flex items-center gap-1 font-medium text-blue-700 dark:text-blue-300">
                                                            <Droplets className="h-3 w-3 text-blue-500" />
                                                            Sí ({park.water_supply_type ?? 'Red'})
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {park.water_point_status ?? 'Operativo'}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Droplet className="h-3 w-3 text-slate-400" /> No tiene
                                                    </span>
                                                )}
                                            </td>

                                            {/* Estado de conservación */}
                                            <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize border ${ESTILOS_CONSERVACION[park.conservation_status]}`}
                                                >
                                                    {park.conservation_status}
                                                </span>
                                            </td>

                                            {/* Estado del registro (Activo / Inactivo) */}
                                            <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                        park.is_active
                                                             ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                                    }`}
                                                >
                                                    <span className={`h-1.5 w-1.5 rounded-full ${park.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                    {park.is_active ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>

                                            {/* Próximo mantenimiento */}
                                            <td className="px-3 py-2.5 whitespace-nowrap">
                                                {park.next_maintenance ? (
                                                    <div className="flex flex-col text-xs">
                                                        <span className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {park.next_maintenance.type}
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            {park.next_maintenance.date}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">Sin programar</span>
                                                )}
                                            </td>

                                            {/* ACCIONES DISPONIBLES (STICKY A LA DERECHA) */}
                                            <td className="px-3 py-2.5 text-center sticky right-0 bg-background/95 dark:bg-card/95 backdrop-blur-xs border-l border-border/60 shadow-xs">
                                                <div className="flex items-center justify-center gap-1">
                                                    {/* Ver detalle */}
                                                    <button
                                                        type="button"
                                                        onClick={() => verDetalle(park)}
                                                        title="Ver detalle del parque"
                                                        className="rounded-lg p-1.5 text-slate-600 transition hover:bg-emerald-100 hover:text-emerald-800 dark:text-neutral-300 dark:hover:bg-neutral-800 cursor-pointer"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>

                                                    {/* Editar */}
                                                    <button
                                                        type="button"
                                                        onClick={() => abrirEdicion(park)}
                                                        title="Editar datos del parque"
                                                        className="rounded-lg p-1.5 text-slate-600 transition hover:bg-amber-100 hover:text-amber-800 dark:text-neutral-300 dark:hover:bg-neutral-800 cursor-pointer"
                                                    >
                                                        <Edit3 className="h-4 w-4" />
                                                    </button>

                                                    {/* Ver historial */}
                                                    <button
                                                        type="button"
                                                        onClick={() => verHistorial(park)}
                                                        title="Ver historial de mantenimientos"
                                                        className="rounded-lg p-1.5 text-slate-600 transition hover:bg-blue-100 hover:text-blue-800 dark:text-neutral-300 dark:hover:bg-neutral-800 cursor-pointer"
                                                    >
                                                        <History className="h-4 w-4" />
                                                    </button>

                                                    {/* Ver ubicación */}
                                                    <button
                                                        type="button"
                                                        onClick={() => verUbicacion(park)}
                                                        title="Ver ubicación geográfica"
                                                        className="rounded-lg p-1.5 text-slate-600 transition hover:bg-purple-100 hover:text-purple-800 dark:text-neutral-300 dark:hover:bg-neutral-800 cursor-pointer"
                                                    >
                                                        <Navigation className="h-4 w-4" />
                                                    </button>

                                                    {/* Registrar mantenimiento extraordinario */}
                                                    <button
                                                        type="button"
                                                        onClick={() => abrirMantenimientoExtraordinario(park)}
                                                        title="Registrar mantenimiento extraordinario"
                                                        className="rounded-lg p-1.5 text-amber-600 transition hover:bg-amber-100 hover:text-amber-800 dark:hover:bg-amber-950 cursor-pointer"
                                                    >
                                                        <Zap className="h-4 w-4" />
                                                    </button>

                                                    {/* Activar o desactivar */}
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleActivo(park)}
                                                        title={park.is_active ? 'Desactivar registro' : 'Activar registro'}
                                                        className={`rounded-lg p-1.5 transition cursor-pointer ${
                                                            park.is_active
                                                                ? 'text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950'
                                                                : 'text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950'
                                                        }`}
                                                    >
                                                        <Power className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={11} className="py-16 text-center">
                                            <Trees className="mx-auto mb-3 h-10 w-10 text-emerald-500 opacity-60" />
                                            <p className="font-semibold text-foreground">No se encontraron parques</p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {busqueda || filtroTipo !== 'todos' || filtroEstado !== 'todos' || filtroActivo !== 'todos'
                                                    ? 'Prueba ajustando los filtros de búsqueda.'
                                                    : 'Aún no se han registrado áreas verdes en el sistema municipal.'}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={abrirCreacion}
                                                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Registrar el primer parque
                                            </button>
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
            {/* MODAL DE REGISTRO / EDICIÓN DE PARQUE                                     */}
            {/* ========================================================================= */}
            {modalFormularioAbierto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-background shadow-2xl border">
                        {/* Cabecera */}
                        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/20">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                                    <Trees className="h-5 w-5 text-emerald-600" />
                                    {parqueEnEdicion ? `Editar Parque: ${parqueEnEdicion.name}` : 'Registro de Nuevo Parque'}
                                </h2>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Complete los datos de identificación, ubicación, superficie y equipamiento hidráulico.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalFormularioAbierto(false)}
                                className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Cuerpo del Formulario */}
                        <form onSubmit={guardarParque} className="flex min-h-0 flex-1 flex-col">
                            <div className="space-y-6 overflow-y-auto px-6 py-5">
                                {/* SECCIÓN 1: IDENTIFICACIÓN */}
                                <div className="rounded-xl border p-4 bg-slate-50/50 dark:bg-muted/60">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                                        <Sparkles className="h-4 w-4" /> Identificación del Área Verde
                                    </h3>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        {/* Código generado automáticamente */}
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                                                Código del parque (Automático)
                                            </label>
                                            <input
                                                type="text"
                                                readOnly
                                                value={formParque.data.code}
                                                className="w-full rounded-lg border bg-muted/60 px-3 py-2 font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400 cursor-not-allowed outline-none"
                                            />
                                            <p className="mt-1 text-[11px] text-muted-foreground">Identificador permanente único</p>
                                        </div>

                                        {/* Denominación */}
                                        <div className="sm:col-span-2">
                                            <label className="mb-1 block text-xs font-semibold">
                                                Denominación del parque / área verde *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formParque.data.name}
                                                onChange={(e) => formParque.setData('name', e.target.value)}
                                                placeholder="Ej. Parque Central de las Américas"
                                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500"
                                            />
                                            {formParque.errors.name && <p className="text-xs text-rose-500 mt-1">{formParque.errors.name}</p>}
                                        </div>

                                        {/* Tipo de área verde */}
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold">
                                                Tipo de área verde *
                                            </label>
                                            <select
                                                value={formParque.data.green_area_type}
                                                onChange={(e) => formParque.setData('green_area_type', e.target.value)}
                                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500"
                                            >
                                                {tiposAreaDisponibles.map((tipo) => (
                                                    <option key={tipo} value={tipo}>{tipo}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Fecha de registro */}
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold">
                                                Fecha de registro
                                            </label>
                                            <input
                                                type="date"
                                                value={formParque.data.registration_date}
                                                onChange={(e) => formParque.setData('registration_date', e.target.value)}
                                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500"
                                            />
                                        </div>

                                        {/* Estado del registro (Activo / Inactivo) */}
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold">
                                                Estado del registro
                                            </label>
                                            <select
                                                value={formParque.data.is_active ? '1' : '0'}
                                                onChange={(e) => formParque.setData('is_active', e.target.value === '1')}
                                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500"
                                            >
                                                <option value="1">Activo (En servicio)</option>
                                                <option value="0">Inactivo</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* AUTOMATIZACIÓN INFORMATIVA AL REGISTRAR */}
                                    <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50/70 p-3.5 dark:border-emerald-800 dark:bg-emerald-950/40">
                                        <div className="flex items-start gap-2.5">
                                            <Sparkles className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                                                    Automatización al guardar el parque:
                                                </h4>
                                                <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                                                    Al guardar, el sistema vinculará automáticamente las reglas activas para el tipo{' '}
                                                    <span className="font-bold underline">{formParque.data.green_area_type}</span>:
                                                </p>

                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {reglasAplicables.length > 0 ? (
                                                        reglasAplicables.map((regla) => (
                                                            <span
                                                                key={regla.id}
                                                                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-900 shadow-xs dark:border-emerald-700 dark:bg-muted dark:text-emerald-200"
                                                            >
                                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                                                {regla.maintenance_type}: Cada {regla.frequency_days} días
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">
                                                            No hay reglas específicas configuradas. Se aplicarán frecuencias estándar.
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SECCIÓN 2: UBICACIÓN */}
                                <div className="rounded-xl border p-4 bg-slate-50/50 dark:bg-muted/60">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-2">
                                            <MapPin className="h-4 w-4" /> Ubicación Geográfica
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={abrirSelectorMapa}
                                            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800"
                                        >
                                            <LocateFixed className="h-3.5 w-3.5" />
                                            Seleccionar ubicación en el mapa
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <div className="sm:col-span-2">
                                            <label className="mb-1 block text-xs font-semibold">Dirección</label>
                                            <input
                                                type="text"
                                                value={formParque.data.address}
                                                onChange={(e) => formParque.setData('address', e.target.value)}
                                                placeholder="Ej. Av. Pacífico Mz. B Lote 12"
                                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-semibold">Urbanización, sector o zona</label>
                                            <input
                                                type="text"
                                                value={formParque.data.zone}
                                                onChange={(e) => formParque.setData('zone', e.target.value)}
                                                placeholder="Ej. Urb. Buenos Aires"
                                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500"
                                            />
                                        </div>

                                        <div className="sm:col-span-3">
                                            <label className="mb-1 block text-xs font-semibold">Referencia</label>
                                            <input
                                                type="text"
                                                value={formParque.data.reference}
                                                onChange={(e) => formParque.setData('reference', e.target.value)}
                                                placeholder="Ej. Frente al Colegio República de Yugoslavia"
                                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-semibold">Latitud</label>
                                            <input
                                                type="number"
                                                step="any"
                                                value={formParque.data.latitude}
                                                onChange={(e) => formParque.setData('latitude', e.target.value)}
                                                placeholder="Ej. -9.124500"
                                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-semibold">Longitud</label>
                                            <input
                                                type="number"
                                                step="any"
                                                value={formParque.data.longitude}
                                                onChange={(e) => formParque.setData('longitude', e.target.value)}
                                                placeholder="Ej. -78.528400"
                                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500"
                                            />
                                        </div>

                                        <div className="flex items-end">
                                            {formParque.data.latitude && formParque.data.longitude && (
                                                <a
                                                    href={`https://www.google.com/maps?q=${formParque.data.latitude},${formParque.data.longitude}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                                                >
                                                    <Navigation className="h-3.5 w-3.5 text-blue-500" />
                                                    Previsualizar en Google Maps
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* SECCIÓN 3: SUPERFICIE */}
                                <div className="rounded-xl border p-4 bg-slate-50/50 dark:bg-muted/60">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
                                        <Layers className="h-4 w-4" /> Superficie y Dimensiones (m²)
                                    </h3>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold">Área verde en m² *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                required
                                                value={formParque.data.green_area}
                                                onChange={(e) => formParque.setData('green_area', e.target.value)}
                                                placeholder="Ej. 1250.00"
                                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-semibold">Área de uso público en m²</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formParque.data.public_use_area}
                                                onChange={(e) => formParque.setData('public_use_area', e.target.value)}
                                                placeholder="Ej. 450.00"
                                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-semibold">Área total en m² (si aplica)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formParque.data.total_area}
                                                onChange={(e) => formParque.setData('total_area', e.target.value)}
                                                placeholder="Ej. 1700.00"
                                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* SECCIÓN 4: PUNTO DE AGUA */}
                                <div className="rounded-xl border p-4 bg-slate-50/50 dark:bg-muted/60">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2">
                                        <Droplets className="h-4 w-4" /> Punto de Agua y Abastecimiento
                                    </h3>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold">¿Tiene punto de agua?</label>
                                            <select
                                                value={formParque.data.has_water_point ? '1' : '0'}
                                                onChange={(e) => formParque.setData('has_water_point', e.target.value === '1')}
                                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500"
                                            >
                                                <option value="1">Sí tiene punto de agua</option>
                                                <option value="0">No tiene punto de agua</option>
                                            </select>
                                        </div>

                                        {formParque.data.has_water_point && (
                                            <>
                                                <div>
                                                    <label className="mb-1 block text-xs font-semibold">Tipo de abastecimiento</label>
                                                    <select
                                                        value={formParque.data.water_supply_type}
                                                        onChange={(e) => formParque.setData('water_supply_type', e.target.value)}
                                                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500"
                                                    >
                                                        <option value="Red pública">Red pública (Sedachimbote)</option>
                                                        <option value="Cisterna">Camión cisterna municipal</option>
                                                        <option value="Pozo">Pozo subterráneo</option>
                                                        <option value="Canal de regadío">Canal de regadío</option>
                                                        <option value="Otro">Otro abastecimiento</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="mb-1 block text-xs font-semibold">Estado del punto de agua</label>
                                                    <select
                                                        value={formParque.data.water_point_status}
                                                        onChange={(e) => formParque.setData('water_point_status', e.target.value)}
                                                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500"
                                                    >
                                                        <option value="Operativo">Operativo</option>
                                                        <option value="Inoperativo">Inoperativo</option>
                                                        <option value="En mantenimiento">En mantenimiento</option>
                                                    </select>
                                                </div>

                                                <div className="sm:col-span-3">
                                                    <label className="mb-1 block text-xs font-semibold">Observaciones del punto de agua</label>
                                                    <input
                                                        type="text"
                                                        value={formParque.data.water_point_observations}
                                                        onChange={(e) => formParque.setData('water_point_observations', e.target.value)}
                                                        placeholder="Ej. Grifo perimétrico operativo con llave de paso protegida en caja de concreto."
                                                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500"
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* SECCIÓN 5: INFORMACIÓN ADICIONAL */}
                                <div className="rounded-xl border p-4 bg-slate-50/50 dark:bg-muted/60">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 mb-3 flex items-center gap-2">
                                        <Info className="h-4 w-4" /> Información Adicional y Fotografía
                                    </h3>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold">Estado de conservación *</label>
                                            <select
                                                value={formParque.data.conservation_status}
                                                onChange={(e) =>
                                                    formParque.setData(
                                                        'conservation_status',
                                                        e.target.value as ParkFormData['conservation_status'],
                                                    )
                                                }
                                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500"
                                            >
                                                <option value="bueno">Bueno</option>
                                                <option value="regular">Regular</option>
                                                <option value="malo">Malo</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-semibold">Fotografía principal (Opcional)</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        formParque.setData('photo', e.target.files[0]);
                                                    }
                                                }}
                                                className="w-full rounded-lg border bg-background px-3 py-1.5 text-xs outline-none focus:border-emerald-500"
                                            />
                                            {formParque.data.photo_url && (
                                                <p className="mt-1 text-xs text-muted-foreground truncate">Foto actual: {formParque.data.photo_url}</p>
                                            )}
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="mb-1 block text-xs font-semibold">Observaciones generales</label>
                                            <textarea
                                                rows={2}
                                                value={formParque.data.general_observations}
                                                onChange={(e) => formParque.setData('general_observations', e.target.value)}
                                                placeholder="Detalles sobre vegetación predominante, mobiliario urbano, cerco perimétrico..."
                                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Botones de acción */}
                            <div className="flex items-center justify-end gap-3 border-t px-6 py-4 bg-muted/20">
                                <button
                                    type="button"
                                    onClick={() => setModalFormularioAbierto(false)}
                                    className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={formParque.processing}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    {formParque.processing ? (
                                        <>
                                            <LoaderCircle className="h-4 w-4 animate-spin" /> Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-4 w-4" />
                                            {parqueEnEdicion ? 'Actualizar parque' : 'Guardar y generar programaciones'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Selector de ubicación para el registro o edición del parque */}
            {modalSelectorMapaAbierto && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-black/70 p-2 backdrop-blur-sm sm:p-4">
                    <div className="flex h-[calc(100dvh-1rem)] max-h-[760px] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl sm:h-[calc(100dvh-2rem)]">
                        <div className="shrink-0 flex items-start justify-between border-b bg-muted/20 px-4 py-3 sm:px-5 sm:py-4">
                            <div>
                                <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                                    <MapPin className="h-5 w-5 text-blue-600" />
                                    Seleccionar ubicación del parque
                                </h2>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Vista limitada a Nuevo Chimbote. Haz clic en el mapa o arrastra el marcador para elegir el parque.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalSelectorMapaAbierto(false)}
                                className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                aria-label="Cerrar selector de mapa"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="relative isolate min-h-[260px] flex-1 overflow-hidden bg-slate-200 dark:bg-muted">
                            <div ref={mapContainerRef} className="park-location-map absolute inset-0 h-full w-full" />
                            {cargandoMapa && (
                                <div className="absolute inset-0 z-[500] flex items-center justify-center bg-background/80">
                                    <div className="flex items-center gap-2 rounded-xl border bg-background px-4 py-3 text-sm font-medium shadow-lg">
                                        <LoaderCircle className="h-4 w-4 animate-spin text-blue-600" />
                                        Cargando mapa...
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="shrink-0 border-t bg-background px-4 py-3 sm:px-5 sm:py-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground">Punto seleccionado</p>
                                    <p className="font-mono text-sm font-bold text-foreground">
                                        {ubicacionSeleccionada.lat.toFixed(6)}, {ubicacionSeleccionada.lng.toFixed(6)}
                                    </p>
                                    {errorMapa && <p className="mt-1 text-xs font-medium text-rose-600">{errorMapa}</p>}
                                </div>

                                <div className="flex flex-wrap justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={centrarEnUbicacionActual}
                                        disabled={cargandoMapa || buscandoDireccion}
                                        className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition hover:bg-muted disabled:opacity-50"
                                    >
                                        <LocateFixed className="h-4 w-4 text-blue-600" />
                                        Usar mi ubicación actual
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setModalSelectorMapaAbierto(false)}
                                        className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={confirmarUbicacionMapa}
                                        disabled={cargandoMapa || buscandoDireccion}
                                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {buscandoDireccion ? (
                                            <>
                                                <LoaderCircle className="h-4 w-4 animate-spin" />
                                                Obteniendo dirección...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="h-4 w-4" />
                                                Usar esta ubicación
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL DETALLE DEL PARQUE                                                 */}
            {/* ========================================================================= */}
            {modalDetalleAbierto && parqueSeleccionado && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-background shadow-2xl border">
                        {/* Cabecera del Parque */}
                        <div className="flex items-start justify-between border-b p-6 bg-slate-50 dark:bg-muted/60">
                            <div className="flex items-start gap-4">
                                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                    <Trees className="h-8 w-8" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200">
                                            {parqueSeleccionado.code}
                                        </span>
                                        <span className="rounded-md bg-slate-200/70 px-2.5 py-0.5 text-xs font-semibold text-slate-800 dark:bg-neutral-800 dark:text-neutral-200">
                                            {parqueSeleccionado.green_area_type}
                                        </span>
                                        <span className={`rounded-md px-2 py-0.5 text-xs font-semibold border ${ESTILOS_CONSERVACION[parqueSeleccionado.conservation_status]}`}>
                                            Conservación: {parqueSeleccionado.conservation_status}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-bold mt-1 text-foreground">{parqueSeleccionado.name}</h2>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                        <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                                        {parqueSeleccionado.address || 'Sin dirección registrada'}
                                        {parqueSeleccionado.zone && ` • ${parqueSeleccionado.zone}`}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setModalDetalleAbierto(false)}
                                className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Pestañas de Navegación */}
                        <div className="flex border-b overflow-x-auto bg-muted/10 px-6">
                            <button
                                type="button"
                                onClick={() => setTabDetalleActiva('resumen')}
                                className={`px-4 py-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
                                    tabDetalleActiva === 'resumen'
                                        ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Info className="h-4 w-4" /> Información general
                            </button>
                            <button
                                type="button"
                                onClick={() => setTabDetalleActiva('ubicacion')}
                                className={`px-4 py-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
                                    tabDetalleActiva === 'ubicacion'
                                        ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <MapPin className="h-4 w-4" /> Ubicación y Superficie
                            </button>
                            <button
                                type="button"
                                onClick={() => setTabDetalleActiva('agua')}
                                className={`px-4 py-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
                                    tabDetalleActiva === 'agua'
                                        ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Droplets className="h-4 w-4" /> Punto de agua
                            </button>
                            <button
                                type="button"
                                onClick={() => setTabDetalleActiva('programaciones')}
                                className={`px-4 py-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
                                    tabDetalleActiva === 'programaciones'
                                        ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <CalendarDays className="h-4 w-4" /> Programaciones ({parqueSeleccionado.schedules.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setTabDetalleActiva('historial')}
                                className={`px-4 py-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
                                    tabDetalleActiva === 'historial'
                                        ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <History className="h-4 w-4" /> Historial ({parqueSeleccionado.maintenance_records.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setTabDetalleActiva('documentos')}
                                className={`px-4 py-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
                                    tabDetalleActiva === 'documentos'
                                        ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <FileText className="h-4 w-4" /> Documentos generados
                            </button>
                        </div>

                        {/* Contenido de la Pestaña */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* TAB: RESUMEN */}
                            {tabDetalleActiva === 'resumen' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="rounded-xl border p-4 bg-card">
                                            <span className="text-xs text-muted-foreground">Estado del Registro</span>
                                            <p className="mt-1 text-base font-bold flex items-center gap-2">
                                                <span className={`h-2.5 w-2.5 rounded-full ${parqueSeleccionado.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                {parqueSeleccionado.is_active ? 'Activo (En servicio)' : 'Inactivo'}
                                            </p>
                                        </div>
                                        <div className="rounded-xl border p-4 bg-card">
                                            <span className="text-xs text-muted-foreground">Fecha de Registro</span>
                                            <p className="mt-1 text-base font-bold text-foreground">
                                                {parqueSeleccionado.registration_date ?? 'Por definir'}
                                            </p>
                                        </div>
                                        <div className="rounded-xl border p-4 bg-card">
                                            <span className="text-xs text-muted-foreground">Próximo mantenimiento</span>
                                            <p className="mt-1 text-base font-bold text-emerald-600">
                                                {parqueSeleccionado.next_maintenance ? `${parqueSeleccionado.next_maintenance.type} (${parqueSeleccionado.next_maintenance.date})` : 'Sin programar'}
                                            </p>
                                        </div>
                                    </div>

                                    {parqueSeleccionado.photo_url ? (
                                        <div className="rounded-2xl overflow-hidden border">
                                            <img
                                                src={parqueSeleccionado.photo_url}
                                                alt={parqueSeleccionado.name}
                                                className="w-full h-64 object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl border-2 border-dashed p-8 text-center text-muted-foreground">
                                            <Trees className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                                            <p className="text-sm font-medium">Fotografía no disponible</p>
                                            <p className="text-xs">Puede adjuntar una imagen editando este parque.</p>
                                        </div>
                                    )}

                                    {parqueSeleccionado.general_observations && (
                                        <div className="rounded-xl border p-4 bg-muted/20">
                                            <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1">Observaciones Generales</h4>
                                            <p className="text-sm text-foreground">{parqueSeleccionado.general_observations}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB: UBICACIÓN Y SUPERFICIE */}
                            {tabDetalleActiva === 'ubicacion' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="rounded-xl border p-4 bg-card">
                                            <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3">Datos de Ubicación</h4>
                                            <div className="space-y-2 text-sm">
                                                <div><span className="font-semibold">Dirección:</span> {parqueSeleccionado.address || 'No especificada'}</div>
                                                <div><span className="font-semibold">Urbanización/Sector:</span> {parqueSeleccionado.zone || 'No especificada'}</div>
                                                <div><span className="font-semibold">Referencia:</span> {parqueSeleccionado.reference || 'Sin referencia'}</div>
                                                <div><span className="font-semibold">Coordenadas:</span> {parqueSeleccionado.latitude ?? '—'}, {parqueSeleccionado.longitude ?? '—'}</div>
                                            </div>

                                            {parqueSeleccionado.latitude && parqueSeleccionado.longitude && (
                                                <a
                                                    href={`https://www.google.com/maps?q=${parqueSeleccionado.latitude},${parqueSeleccionado.longitude}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                                                >
                                                    <Navigation className="h-3.5 w-3.5" /> Abrir en Google Maps
                                                </a>
                                            )}
                                        </div>

                                        <div className="rounded-xl border p-4 bg-card">
                                            <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3">Superficies</h4>
                                            <div className="space-y-3">
                                                <div className="flex justify-between border-b pb-2">
                                                    <span className="text-sm font-medium">Área Verde:</span>
                                                    <span className="text-sm font-bold text-emerald-600">
                                                        {parqueSeleccionado.green_area ? `${Number(parqueSeleccionado.green_area).toLocaleString('es-PE')} m²` : '—'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between border-b pb-2">
                                                    <span className="text-sm font-medium">Área de Uso Público:</span>
                                                    <span className="text-sm font-bold">
                                                        {parqueSeleccionado.public_use_area ? `${Number(parqueSeleccionado.public_use_area).toLocaleString('es-PE')} m²` : '—'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium">Área Total:</span>
                                                    <span className="text-sm font-bold">
                                                        {parqueSeleccionado.total_area ? `${Number(parqueSeleccionado.total_area).toLocaleString('es-PE')} m²` : '—'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: PUNTO DE AGUA */}
                            {tabDetalleActiva === 'agua' && (
                                <div className="space-y-4">
                                    <div className="rounded-xl border p-5 bg-card">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="rounded-xl bg-blue-100 p-2 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                                <Droplets className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h4 className="text-base font-bold text-foreground">Estado del Punto de Agua</h4>
                                                <p className="text-xs text-muted-foreground">Sistema de riego y abastecimiento hídrico</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="p-3 rounded-lg bg-muted/40">
                                                <span className="text-xs text-muted-foreground">¿Cuenta con punto de agua?</span>
                                                <p className="text-sm font-bold mt-1 text-foreground">
                                                    {parqueSeleccionado.has_water_point ? 'Sí tiene punto de agua' : 'No cuenta con punto'}
                                                </p>
                                            </div>
                                            <div className="p-3 rounded-lg bg-muted/40">
                                                <span className="text-xs text-muted-foreground">Tipo de abastecimiento</span>
                                                <p className="text-sm font-bold mt-1 text-foreground">
                                                    {parqueSeleccionado.water_supply_type ?? 'No aplica'}
                                                </p>
                                            </div>
                                            <div className="p-3 rounded-lg bg-muted/40">
                                                <span className="text-xs text-muted-foreground">Estado operativo</span>
                                                <p className="text-sm font-bold mt-1 text-blue-600">
                                                    {parqueSeleccionado.water_point_status ?? 'No aplica'}
                                                </p>
                                            </div>
                                        </div>

                                        {parqueSeleccionado.water_point_observations && (
                                            <div className="mt-4 p-3 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 text-xs">
                                                <span className="font-semibold text-blue-900 dark:text-blue-200">Observaciones técnicas del punto:</span>
                                                <p className="mt-1 text-blue-800 dark:text-blue-300">{parqueSeleccionado.water_point_observations}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB: PROGRAMACIONES ACTIVAS */}
                            {tabDetalleActiva === 'programaciones' && (
                                <div className="space-y-4">
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                                        <p className="text-xs text-emerald-900 dark:text-emerald-300">
                                            Programaciones activas generadas automáticamente según el tipo de área verde ({parqueSeleccionado.green_area_type}).
                                        </p>
                                    </div>

                                    <table className="w-full text-left text-sm border rounded-xl overflow-hidden">
                                        <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
                                            <tr>
                                                <th className="px-4 py-3">Tipo de Mantenimiento</th>
                                                <th className="px-4 py-3">Frecuencia</th>
                                                <th className="px-4 py-3">Última Ejecución</th>
                                                <th className="px-4 py-3">Próxima Fecha Programada</th>
                                                <th className="px-4 py-3 text-center">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {parqueSeleccionado.schedules.length > 0 ? (
                                                parqueSeleccionado.schedules.map((sch) => (
                                                    <tr key={sch.id} className="hover:bg-muted/30">
                                                        <td className="px-4 py-3 font-semibold text-foreground">{sch.maintenance_type}</td>
                                                        <td className="px-4 py-3">Cada {sch.frequency_days} días</td>
                                                        <td className="px-4 py-3 text-muted-foreground">{sch.last_executed_at ?? 'Sin registrar'}</td>
                                                        <td className="px-4 py-3 font-semibold text-emerald-700 dark:text-emerald-300">{sch.next_scheduled_date ?? 'Por definir'}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                                Activo
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="py-6 text-center text-muted-foreground text-xs">
                                                        No hay programaciones activas configuradas.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* TAB: HISTORIAL DE MANTENIMIENTOS */}
                            {tabDetalleActiva === 'historial' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-muted-foreground">
                                            Historial automático de mantenimientos ordinarios y extraordinarios ejecutados.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => abrirMantenimientoExtraordinario(parqueSeleccionado)}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                                        >
                                            <Zap className="h-3.5 w-3.5" /> Registrar extraordinario
                                        </button>
                                    </div>

                                    <table className="w-full text-left text-sm border rounded-xl overflow-hidden">
                                        <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
                                            <tr>
                                                <th className="px-4 py-3">Fecha</th>
                                                <th className="px-4 py-3">Mantenimiento</th>
                                                <th className="px-4 py-3">Responsable</th>
                                                <th className="px-4 py-3 text-center">Horario / Duración</th>
                                                <th className="px-4 py-3 text-center">Estado</th>
                                                <th className="px-4 py-3">Documento</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {parqueSeleccionado.maintenance_records.length > 0 ? (
                                                parqueSeleccionado.maintenance_records.map((rec) => (
                                                    <tr key={rec.id} className="hover:bg-muted/30">
                                                        <td className="px-4 py-3 font-mono text-xs">
                                                            {rec.execution_date ?? rec.scheduled_date ?? '—'}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-medium text-foreground">{rec.maintenance_type}</span>
                                                                {rec.is_extraordinary && (
                                                                    <span className="rounded-md bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                                                        EXTRAORDINARIO
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {rec.observations && (
                                                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{rec.observations}</p>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-xs">{rec.responsible_worker}</td>
                                                        <td className="px-4 py-3 text-center text-xs">
                                                            {rec.start_time && rec.end_time ? `${rec.start_time} - ${rec.end_time}` : '—'}
                                                            {rec.duration_minutes && (
                                                                <span className="block text-[11px] text-muted-foreground font-semibold">
                                                                    ({rec.duration_minutes} min)
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 capitalize">
                                                                {rec.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs font-mono">
                                                            {rec.document_name ? (
                                                                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold cursor-pointer hover:underline">
                                                                    <FileText className="h-3.5 w-3.5" />
                                                                    {rec.document_name}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground">—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className="py-8 text-center text-muted-foreground text-xs">
                                                        No hay registros de mantenimiento históricos aún.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* TAB: DOCUMENTOS GENERADOS */}
                            {tabDetalleActiva === 'documentos' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {parqueSeleccionado.maintenance_records.filter((m) => m.document_name).map((m) => (
                                            <div key={m.id} className="rounded-xl border p-4 bg-card flex items-start justify-between">
                                                <div className="flex items-start gap-3">
                                                    <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                                        <FileText className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <h5 className="font-mono text-xs font-bold text-foreground">{m.document_name}</h5>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            Acta de mantenimiento: {m.maintenance_type}
                                                        </p>
                                                        <p className="text-[11px] text-muted-foreground">Fecha: {m.execution_date}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => alert(`Visualizando documento municipal: ${m.document_name}`)}
                                                    className="p-1.5 rounded-lg border hover:bg-muted text-muted-foreground hover:text-foreground"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}

                                        {parqueSeleccionado.maintenance_records.filter((m) => m.document_name).length === 0 && (
                                            <div className="sm:col-span-2 py-8 text-center text-muted-foreground text-xs">
                                                No se han generado actas técnicas para este parque todavía.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Pie del modal */}
                        <div className="border-t px-6 py-3.5 flex justify-end bg-muted/20">
                            <button
                                type="button"
                                onClick={() => setModalDetalleAbierto(false)}
                                className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted"
                            >
                                Cerrar ventana
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL DE HISTORIAL DIRECTO DEL PARQUE                                    */}
            {/* ========================================================================= */}
            {modalHistorialAbierto && parqueSeleccionado && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-background shadow-2xl border">
                        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/20">
                            <div>
                                <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                                    <History className="h-5 w-5 text-emerald-600" />
                                    Historial de Mantenimientos — {parqueSeleccionado.name} ({parqueSeleccionado.code})
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Construido automáticamente a partir de los mantenimientos registrados.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalHistorialAbierto(false)}
                                className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div className="overflow-x-auto rounded-xl border">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase">
                                        <tr>
                                            <th className="px-4 py-3">Fecha Mantenimiento</th>
                                            <th className="px-4 py-3">Tipo</th>
                                            <th className="px-4 py-3">Trabajador responsable</th>
                                            <th className="px-4 py-3 text-center">Horas</th>
                                            <th className="px-4 py-3 text-center">Duración</th>
                                            <th className="px-4 py-3 text-center">Estado</th>
                                            <th className="px-4 py-3">Documento generado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {parqueSeleccionado.maintenance_records.length > 0 ? (
                                            parqueSeleccionado.maintenance_records.map((m) => (
                                                <tr key={m.id} className="hover:bg-muted/30">
                                                    <td className="px-4 py-3 font-mono text-xs font-semibold">
                                                        {m.execution_date ?? m.scheduled_date ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium">
                                                        <div className="flex items-center gap-1.5">
                                                            {m.maintenance_type}
                                                            {m.is_extraordinary && (
                                                                <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                                                    Extraordinario
                                                                </span>
                                                            )}
                                                        </div>
                                                        {m.observations && (
                                                            <p className="text-xs text-muted-foreground mt-0.5">{m.observations}</p>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs">{m.responsible_worker}</td>
                                                    <td className="px-4 py-3 text-center font-mono text-xs">
                                                        {m.start_time && m.end_time ? `${m.start_time} - ${m.end_time}` : '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-xs font-medium">
                                                        {m.duration_minutes ? `${m.duration_minutes} min` : '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 capitalize">
                                                            {m.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-xs">
                                                        {m.document_name ? (
                                                            <span className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer flex items-center gap-1">
                                                                <FileText className="h-3.5 w-3.5" />
                                                                {m.document_name}
                                                            </span>
                                                        ) : (
                                                            '—'
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="py-8 text-center text-muted-foreground text-xs">
                                                    No se registran intervenciones históricas.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="border-t px-6 py-3.5 flex justify-end bg-muted/20">
                            <button
                                type="button"
                                onClick={() => setModalHistorialAbierto(false)}
                                className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted"
                            >
                                Cerrar historial
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL VER UBICACIÓN GEOGRÁFICA                                            */}
            {/* ========================================================================= */}
            {modalUbicacionAbierto && parqueSeleccionado && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-background shadow-2xl border">
                        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/20">
                            <div>
                                <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                                    <MapPin className="h-5 w-5 text-emerald-600" />
                                    Ubicación: {parqueSeleccionado.name}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    {parqueSeleccionado.address || 'Sin dirección'} {parqueSeleccionado.zone && ` • ${parqueSeleccionado.zone}`}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalUbicacionAbierto(false)}
                                className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="p-3 rounded-xl bg-muted/40 border">
                                    <span className="text-muted-foreground">Latitud:</span>
                                    <p className="font-mono font-bold text-sm mt-0.5">{parqueSeleccionado.latitude ?? 'No registrada'}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-muted/40 border">
                                    <span className="text-muted-foreground">Longitud:</span>
                                    <p className="font-mono font-bold text-sm mt-0.5">{parqueSeleccionado.longitude ?? 'No registrada'}</p>
                                </div>
                            </div>

                            {/* Vista de Mapa interactivo OpenStreetMap / Leaflet preview */}
                            <div className="rounded-xl overflow-hidden border h-72 bg-slate-100 dark:bg-muted relative flex items-center justify-center">
                                {parqueSeleccionado.latitude && parqueSeleccionado.longitude ? (
                                    <iframe
                                        title="Mapa del Parque"
                                        className="w-full h-full border-0"
                                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(parqueSeleccionado.longitude) - 0.005},${Number(parqueSeleccionado.latitude) - 0.005},${Number(parqueSeleccionado.longitude) + 0.005},${Number(parqueSeleccionado.latitude) + 0.005}&layer=mapnik&marker=${parqueSeleccionado.latitude},${parqueSeleccionado.longitude}`}
                                    />
                                ) : (
                                    <div className="text-center p-6">
                                        <MapPin className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                                        <p className="text-sm font-semibold">Coordenadas no registradas</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Edite el parque para asignar latitud y longitud.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {parqueSeleccionado.latitude && parqueSeleccionado.longitude && (
                                <div className="flex justify-end gap-3">
                                    <a
                                        href={`https://www.google.com/maps?q=${parqueSeleccionado.latitude},${parqueSeleccionado.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                                    >
                                        <Navigation className="h-4 w-4" /> Abrir en Google Maps
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL REGISTRAR MANTENIMIENTO EXTRAORDINARIO                             */}
            {/* ========================================================================= */}
            {modalExtraordinarioAbierto && parqueSeleccionado && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-background shadow-2xl border">
                        <div className="flex items-center justify-between border-b px-6 py-4 bg-amber-500/10">
                            <div>
                                <h3 className="text-lg font-bold flex items-center gap-2 text-amber-900 dark:text-amber-200">
                                    <Zap className="h-5 w-5 text-amber-600" />
                                    Registrar Mantenimiento Extraordinario
                                </h3>
                                <p className="text-xs text-amber-800 dark:text-amber-300">
                                    Parque: <span className="font-bold">{parqueSeleccionado.name}</span> ({parqueSeleccionado.code})
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalExtraordinarioAbierto(false)}
                                className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={guardarMantenimientoExtraordinario} className="flex min-h-0 flex-1 flex-col">
                            <div className="space-y-4 overflow-y-auto p-6">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold">Tipo de mantenimiento extraordinario *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formExtraordinario.data.maintenance_type}
                                        onChange={(e) => formExtraordinario.setData('maintenance_type', e.target.value)}
                                        placeholder="Ej. Poda de emergencia por caída de ramas"
                                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-amber-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold">Fecha de ejecución *</label>
                                        <input
                                            type="date"
                                            required
                                            value={formExtraordinario.data.execution_date}
                                            onChange={(e) => formExtraordinario.setData('execution_date', e.target.value)}
                                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold">Trabajador / Responsable *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formExtraordinario.data.responsible_worker}
                                            onChange={(e) => formExtraordinario.setData('responsible_worker', e.target.value)}
                                            placeholder="Ej. Ing. Juan Pérez"
                                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-amber-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold">Hora de inicio</label>
                                        <input
                                            type="time"
                                            value={formExtraordinario.data.start_time}
                                            onChange={(e) => formExtraordinario.setData('start_time', e.target.value)}
                                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold">Hora de finalización</label>
                                        <input
                                            type="time"
                                            value={formExtraordinario.data.end_time}
                                            onChange={(e) => formExtraordinario.setData('end_time', e.target.value)}
                                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold">Duración (minutos)</label>
                                        <input
                                            type="number"
                                            value={formExtraordinario.data.duration_minutes}
                                            onChange={(e) => formExtraordinario.setData('duration_minutes', Number(e.target.value))}
                                            placeholder="Ej. 120"
                                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-amber-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold">Observaciones y acciones realizadas</label>
                                    <textarea
                                        rows={3}
                                        value={formExtraordinario.data.observations}
                                        onChange={(e) => formExtraordinario.setData('observations', e.target.value)}
                                        placeholder="Describa el motivo extraordinario, personal desplegado y materiales utilizados..."
                                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-amber-500 resize-none"
                                    />
                                </div>

                                <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                                    <span className="font-bold">Generación de documento técnico:</span> Al registrar, se emitirá automáticamente un acta oficial de mantenimiento extraordinario y se incorporará al historial permanente del parque.
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 border-t px-6 py-4 bg-muted/20">
                                <button
                                    type="button"
                                    onClick={() => setModalExtraordinarioAbierto(false)}
                                    className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={formExtraordinario.processing}
                                    className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
                                >
                                    {formExtraordinario.processing ? (
                                        <>
                                            <LoaderCircle className="h-4 w-4 animate-spin" /> Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="h-4 w-4" /> Registrar y emitir acta
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
