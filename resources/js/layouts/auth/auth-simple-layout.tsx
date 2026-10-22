
import { Link } from '@inertiajs/react';

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
        <div className="flex min-h-svh items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-green-100 px-4 py-4 dark:bg-background dark:bg-none">
            <div className="w-full max-w-md">

                {/* ESCUDO DE LA MUNICIPALIDAD */}
                <div className="mb-8 flex flex-col items-center text-center">
                    <Link
                        href={route('home')}
                        aria-label="Ir al inicio"
                    >
                        <img
                            src="/images/escudo-nuevo-chimbote.png"
                            alt="Escudo de la Municipalidad Distrital de Nuevo Chimbote"
                            className="mb-4 h-28 w-auto max-w-full object-contain"
                        />
                    </Link>

                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        Municipalidad Distrital de Nuevo Chimbote
                    </p>

                    <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
                        Sistema de Gestión de Áreas Verdes
                    </h1>

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Gestión y monitoreo de parques municipales
                    </p>
                </div>

                {/* FORMULARIO DE INICIO DE SESIÓN */}
                <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-950/10 sm:p-8 dark:border-border dark:bg-card">
                    <div className="mb-7 space-y-2 text-center">
                        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
                            {title}
                        </h2>

                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {description}
                        </p>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
