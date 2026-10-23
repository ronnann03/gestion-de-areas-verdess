
import { Link } from '@inertiajs/react';
import { Trees, Leaf, Droplets, CalendarCheck2, ShieldCheck, Sparkles, MapPin } from 'lucide-react';

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
        <div className="relative min-h-screen w-full overflow-x-hidden bg-slate-950 text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
            {/* Imagen de fondo del parque urbano */}
            <div 
                className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 scale-[1.02]"
                style={{ backgroundImage: "url('/images/fondo-parque.jpg')" }}
            />
            
            {/* Capa de oscurecimiento y gradiente esmeralda para contraste y legibilidad óptima */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-emerald-950/90 backdrop-blur-[2px]" />

            {/* Luces y ambientación ecológica de fondo */}
            <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/25 blur-[128px]" />
            <div className="pointer-events-none absolute top-1/2 -right-40 h-96 w-96 rounded-full bg-green-500/20 blur-[140px]" />
            <div className="pointer-events-none absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-emerald-600/20 blur-[128px]" />

            {/* Contenedor principal con grid responsivo */}
            <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
                    
                    {/* PANEL IZQUIERDO: Portada Temática e Institucional */}
                    <div className="flex flex-col items-center text-center lg:col-span-7 lg:items-start lg:text-left">
                        
                        {/* Escudo Municipal con resplandor */}
                        <div className="relative mb-6">
                            <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-xl" />
                            <Link href={route('home')} aria-label="Ir al inicio" className="relative block">
                                <img
                                    src="/images/escudo-nuevo-chimbote.png"
                                    alt="Escudo de la Municipalidad Distrital de Nuevo Chimbote"
                                    className="h-28 w-auto object-contain transition duration-300 hover:scale-105 sm:h-32"
                                />
                            </Link>
                        </div>

                        {/* Badges ecológicos */}
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 backdrop-blur-md">
                            <Leaf className="h-3.5 w-3.5 text-emerald-400" />
                            <span>MUNICIPALIDAD DISTRITAL DE NUEVO CHIMBOTE</span>
                            <span className="hidden sm:inline text-emerald-500">·</span>
                            <span className="hidden sm:inline text-emerald-400 font-bold">DISTRITO ECOLÓGICO</span>
                        </div>

                        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-white">
                            Gestión Inteligente de{' '}
                            <span className="bg-gradient-to-r from-emerald-400 via-green-300 to-teal-300 bg-clip-text text-transparent">
                                Áreas Verdes
                            </span>
                        </h1>

                        <p className="mt-4 max-w-xl text-sm sm:text-base text-emerald-100/80 leading-relaxed">
                            Plataforma integral para el inventario georreferenciado de parques, programación preventiva de riego y mantenimiento, y supervisión de cuadrillas de campo.
                        </p>

                        {/* Pilares Temáticos del Sistema (Ocultos en móviles muy pequeños, visibles desde sm) */}
                        <div className="mt-8 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="group rounded-2xl border border-emerald-500/20 bg-emerald-950/40 p-3.5 backdrop-blur-sm transition hover:border-emerald-500/40 hover:bg-emerald-900/30">
                                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                                    <Trees className="h-5 w-5" />
                                </div>
                                <h3 className="text-xs font-bold text-white">Catastro de Parques</h3>
                                <p className="mt-1 text-[11px] text-emerald-200/70">Mapeo y estado de conservación de cada espacio.</p>
                            </div>

                            <div className="group rounded-2xl border border-emerald-500/20 bg-emerald-950/40 p-3.5 backdrop-blur-sm transition hover:border-emerald-500/40 hover:bg-emerald-900/30">
                                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
                                    <Droplets className="h-5 w-5" />
                                </div>
                                <h3 className="text-xs font-bold text-white">Riego y Puntos de Agua</h3>
                                <p className="mt-1 text-[11px] text-emerald-200/70">Control de abastecimiento cisterna y red hídrica.</p>
                            </div>

                            <div className="group rounded-2xl border border-emerald-500/20 bg-emerald-950/40 p-3.5 backdrop-blur-sm transition hover:border-emerald-500/40 hover:bg-emerald-900/30">
                                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                                    <CalendarCheck2 className="h-5 w-5" />
                                </div>
                                <h3 className="text-xs font-bold text-white">Mantenimiento Activo</h3>
                                <p className="mt-1 text-[11px] text-emerald-200/70">Poda, corte y limpieza con semáforo preventivo.</p>
                            </div>
                        </div>

                        {/* Mensaje ecológico */}
                        <div className="mt-6 hidden lg:flex items-center gap-2 text-xs text-emerald-300/70">
                            <Sparkles className="h-4 w-4 text-emerald-400" />
                            <span>Preservando el patrimonio verde y la calidad de vida de nuestra comunidad.</span>
                        </div>
                    </div>

                    {/* PANEL DERECHO: Tarjeta de Acceso Seguro */}
                    <div className="w-full lg:col-span-5">
                        <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-emerald-500/30 bg-slate-900/85 p-6 sm:p-8 shadow-2xl shadow-emerald-950/80 backdrop-blur-xl">
                            
                            {/* Resplandor interno de la tarjeta */}
                            <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />
                            
                            <div className="relative z-10">
                                <div className="mb-6 text-center">
                                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-400 shadow-inner">
                                        <ShieldCheck className="h-6 w-6" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white sm:text-2xl">
                                        {title}
                                    </h2>
                                    <p className="mt-1 text-xs sm:text-sm text-slate-300">
                                        {description}
                                    </p>
                                </div>

                                {children}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Footer Institucional */}
            <footer className="relative z-10 border-t border-emerald-900/50 bg-slate-950/80 py-4 text-center text-xs text-emerald-200/60 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 sm:flex-row">
                    <p>© 2026 Municipalidad Distrital de Nuevo Chimbote · Gerencia de Gestión Ambiental</p>
                    <div className="flex items-center gap-3 text-[11px] text-emerald-400/80">
                        <span className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            Sistema Operativo
                        </span>
                        <span>·</span>
                        <span>Áreas Verdes v2.0 (Python FastAPI)</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
