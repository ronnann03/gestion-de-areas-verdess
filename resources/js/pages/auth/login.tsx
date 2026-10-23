import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, LogIn, KeyRound, Mail, Sparkles, UserCheck } from 'lucide-react';
import { type FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

interface LoginForm {
    email: string;
    password: string;
    remember: boolean;
}

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    const fillDemoAdmin = () => {
        setData({
            email: 'admin@nuevochimbote.gob.pe',
            password: 'admin123',
            remember: true,
        });
    };

    return (
        <AuthLayout title="Acceso Administrativo" description="Ingrese sus credenciales oficiales para continuar">
            <Head title="Iniciar sesión | Gestión de Áreas Verdes" />

            <form className="flex flex-col gap-5" onSubmit={submit}>
                <div className="grid gap-5">
                    {/* CORREO ELECTRÓNICO */}
                    <div className="grid gap-2">
                        <Label htmlFor="email" className="text-xs font-semibold text-emerald-100 flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-emerald-400" />
                            Correo electrónico
                        </Label>

                        <Input
                            id="email"
                            type="email"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="admin@nuevochimbote.gob.pe"
                            className="border-emerald-500/30 bg-slate-950/60 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-xl"
                        />

                        <InputError message={errors.email} />
                    </div>

                    {/* CONTRASEÑA */}
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-xs font-semibold text-emerald-100 flex items-center gap-1.5">
                                <KeyRound className="h-3.5 w-3.5 text-emerald-400" />
                                Contraseña
                            </Label>

                            {canResetPassword && (
                                <TextLink href={route('password.request')} className="text-xs text-emerald-400 hover:text-emerald-300 transition" tabIndex={5}>
                                    ¿Olvidó su contraseña?
                                </TextLink>
                            )}
                        </div>

                        <Input
                            id="password"
                            type="password"
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="••••••••••••"
                            className="border-emerald-500/30 bg-slate-950/60 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-xl"
                        />

                        <InputError message={errors.password} />
                    </div>

                    {/* RECORDAR SESIÓN */}
                    <div className="flex items-center space-x-2.5">
                        <Checkbox
                            id="remember"
                            name="remember"
                            tabIndex={3}
                            checked={data.remember}
                            onCheckedChange={(checked) => setData('remember', checked === true)}
                            className="border-emerald-500/40 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                        />

                        <Label htmlFor="remember" className="text-xs text-slate-300 cursor-pointer">
                            Mantener sesión activa en este equipo
                        </Label>
                    </div>

                    {/* BOTÓN DE INICIO DE SESIÓN */}
                    <Button
                        type="submit"
                        className="mt-2 w-full rounded-xl bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 py-2.5 font-bold text-white shadow-lg shadow-emerald-700/30 transition duration-200 hover:from-emerald-500 hover:to-green-500 hover:shadow-emerald-600/40 active:scale-[0.99] cursor-pointer"
                        tabIndex={4}
                        disabled={processing}
                    >
                        {processing ? (
                            <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <LogIn className="h-4 w-4 mr-2" />
                        )}
                        Iniciar sesión
                    </Button>
                </div>
            </form>

            {/* ACCESO RÁPIDO PARA PRUEBAS */}
            <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-950/30 p-3.5 text-center">
                <div className="flex items-center justify-between gap-2">
                    <div className="text-left">
                        <p className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                            <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                            Cuenta Demo
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">admin@nuevochimbote.gob.pe</p>
                    </div>
                    <button
                        type="button"
                        onClick={fillDemoAdmin}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 transition hover:bg-emerald-500/30 active:scale-95 cursor-pointer"
                    >
                        <Sparkles className="h-3 w-3 text-emerald-400" />
                        Auto-llenar
                    </button>
                </div>
            </div>

            {/* MENSAJES DEL SISTEMA */}
            {status && (
                <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-900/30 p-3 text-center text-xs font-medium text-emerald-300">
                    {status}
                </div>
            )}
        </AuthLayout>
    );
}
