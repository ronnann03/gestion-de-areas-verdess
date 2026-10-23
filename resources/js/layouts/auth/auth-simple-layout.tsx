import { Link } from '@inertiajs/react';
import { Trees, Leaf, Droplets, CalendarCheck2, ShieldCheck, Sparkles } from 'lucide-react';

interface AuthLayoutProps {
    children: React.ReactNode;
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative min-h-screen w-full overflow-x-hidden flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
            {/* Imagen de fondo del parque urbano: 100% NÍTIDA, SIN DIFUMINAR Y CLARA */}
            <div 
                className="pointer-events-none fixed inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/images/fondo-parque.jpg')" }}
            />
            
            {/* Filtro sutil muy ligero para realzar la luz natural sin oscurecer */}
            <div className="pointer-events-none fixed inset-0 bg-white/10" />

            {/* Contenedor principal con grid responsivo */}
            <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
                    
                    {/* PANEL IZQUIERDO: Tarjeta Institucional Luminosa */}
                    <div className="rounded-3xl border border-white/70 bg-white/90 p-6 sm:p-8 shadow-2xl shadow-emerald-950/15 backdrop-blur-md text-slate-800 lg:col-span-7">
                        
                        {/* Escudo Municipal y Título Institucional */}
                        <div className="mb-6 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                            <Link href={route('home')} aria-label="Ir al inicio" className="block shrink-0">
                                <img
                                    src="/images/escudo-nuevo-chimbote.png"
                                    alt="Escudo de la Municipalidad Distrital de Nuevo Chimbote"
                                    className="h-24 w-auto object-contain transition duration-300 hover:scale-105 sm:h-28"
                                />
                            </Link>
                            <div>
                                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-300 px-3.5 py-1 text-xs font-bold text-emerald-800">
                                    <Leaf className="h-3.5 w-3.5 text-emerald-600" />
                                    MUNICIPALIDAD DISTRITAL DE NUEVO CHIMBOTE
                                </div>
                                <p className="mt-1.5 text-xs font-semibold tracking-wider text-emerald-700 uppercase">
                                    Distrito Ecológico y Sostenible
                                </p>
                            </div>
                        </div>

                        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl text-slate-900 leading-tight">
                            Gestión Inteligente de{' '}
                            <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                                Áreas Verdes
                            </span>
                        </h1>

                        <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                            Plataforma integral para el inventario georreferenciado de parques, programación preventiva de riego y mantenimiento, y supervisión de cuadrillas de campo.
                        </p>

                        {/* Pilares Temáticos del Sistema */}
                        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/90 p-3.5 transition hover:bg-emerald-100/80 shadow-xs">
                                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                                    <Trees className="h-5 w-5" />
                                </div>
                                <h3 className="text-xs font-bold text-slate-900">Catastro de Parques</h3>
                                <p className="mt-1 text-[11px] text-slate-600">Mapeo y estado de conservación de cada espacio.</p>
                            </div>

                            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/90 p-3.5 transition hover:bg-emerald-100/80 shadow-xs">
                                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-xs">
                                    <Droplets className="h-5 w-5" />
                                </div>
                                <h3 className="text-xs font-bold text-slate-900">Riego y Puntos de Agua</h3>
                                <p className="mt-1 text-[11px] text-slate-600">Control de abastecimiento cisterna y red hídrica.</p>
                            </div>

                            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/90 p-3.5 transition hover:bg-emerald-100/80 shadow-xs">
                                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600 text-white shadow-xs">
                                    <CalendarCheck2 className="h-5 w-5" />
                                </div>
                                <h3 className="text-xs font-bold text-slate-900">Mantenimiento Activo</h3>
                                <p className="mt-1 text-[11px] text-slate-600">Poda, corte y limpieza con semáforo preventivo.</p>
                            </div>
                        </div>

                        {/* Mensaje de pie de tarjeta */}
                        <div className="mt-5 hidden sm:flex items-center gap-2 text-xs text-emerald-800 font-medium">
                            <Sparkles className="h-4 w-4 text-emerald-600" />
                            <span>Preservando el patrimonio verde y la calidad de vida de nuestra comunidad.</span>
                        </div>
                    </div>

                    {/* PANEL DERECHO: Tarjeta de Acceso Seguro Nítida */}
                    <div className="w-full lg:col-span-5">
                        <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-white/80 bg-white/95 p-6 sm:p-8 shadow-2xl shadow-emerald-950/20 backdrop-blur-md text-slate-900">
                            
                            <div className="relative z-10">
                                <div className="mb-6 text-center">
                                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-600/30">
                                        <ShieldCheck className="h-6 w-6" />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                                        {title}
                                    </h2>
                                    <p className="mt-1 text-xs sm:text-sm text-slate-500">
                                        {description}
                                    </p>
                                </div>

                                {children}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Footer Institucional Claro */}
            <footer className="relative z-10 border-t border-white/40 bg-white/85 py-3 text-center text-xs text-slate-600 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 sm:flex-row">
                    <p className="font-medium">© 2026 Municipalidad Distrital de Nuevo Chimbote · Gerencia de Gestión Ambiental</p>
                    <div className="flex items-center gap-3 text-[11px] text-emerald-700 font-semibold">
                        <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            Sistema Operativo
                        </span>
                        <span>·</span>
                        <span>Áreas Verdes v2.0</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
