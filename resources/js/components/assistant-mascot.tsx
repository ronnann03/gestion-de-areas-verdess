import React, { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import {
    Trees,
    Leaf,
    Droplets,
    CalendarCheck2,
    CalendarClock,
    AlertTriangle,
    UserPlus,
    FileBarChart,
    Sparkles,
    X,
    Send,
    Bot,
    Zap,
    ChevronRight,
    RotateCcw,
    Wrench,
    Smile,
    HelpCircle,
    CheckCircle2,
} from 'lucide-react';

interface Message {
    id: string;
    sender: 'bot' | 'user';
    text: string;
    action?: {
        label: string;
        url: string;
        icon?: React.ComponentType<{ className?: string }>;
    };
    chips?: string[];
}

export function AssistantMascot() {
    const [isOpen, setIsOpen] = useState(false);
    const [bubbleVisible, setBubbleVisible] = useState(true);
    const [bubbleMessage, setBubbleMessage] = useState('¡Hola! Soy Verdín 🌿 ¿Te ayudo con tareas rápidas?');
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const initialMessages: Message[] = [
        {
            id: '1',
            sender: 'bot',
            text: '¡Hola! Soy Verdín, la mascota guardiana de las áreas verdes 🌳. Estoy aquí para ahorrarte tiempo y clics. ¿Qué deseas hacer hoy?',
            chips: [
                'Ver vencidos',
                'Mantenimiento extraordinario',
                'Nuevo parque',
                'Registrar trabajador',
                'Parques sin agua',
                'Reportes del mes',
            ],
        },
    ];

    const [messages, setMessages] = useState<Message[]>(initialMessages);

    // Ocultar la burbuja flotante tras 14 segundos
    useEffect(() => {
        const timer = setTimeout(() => {
            setBubbleVisible(false);
        }, 14000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setBubbleVisible(false);
            scrollToBottom();
        }
    }, [isOpen, messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleExecuteAction = (url: string) => {
        router.visit(url);
        // Cerramos el panel en móviles para no tapar la pantalla
        if (window.innerWidth < 768) {
            setIsOpen(false);
        }
    };

    const processUserInput = (userText: string) => {
        const text = userText.trim();
        if (!text) return;

        const newMsg: Message = {
            id: Date.now().toString(),
            sender: 'user',
            text: text,
        };

        setMessages((prev) => [...prev, newMsg]);
        setInput('');
        setIsTyping(true);

        const lower = text.toLowerCase();

        setTimeout(() => {
            let botReply: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'bot',
                text: 'No estoy seguro de entender ese comando. Puedes probar preguntarme por "vencidos", "nuevo parque", "trabajador", "extraordinario" o pulsar una de las opciones rápidas.',
                chips: ['Ver vencidos', 'Nuevo parque', 'Extraordinario', 'Reportes'],
            };

            if (lower.includes('vencid') || lower.includes('atrasad') || lower.includes('urgente')) {
                botReply = {
                    id: (Date.now() + 1).toString(),
                    sender: 'bot',
                    text: '⚠️ ¡Revisemos las alertas críticas! Te llevo directo a los mantenimientos vencidos para atenderlos:',
                    action: {
                        label: 'Abrir Mantenimientos Vencidos',
                        url: '/mantenimientos?estado=vencidos',
                        icon: AlertTriangle,
                    },
                };
            } else if (lower.includes('extraordinario') || lower.includes('urgencia') || lower.includes('emergencia')) {
                botReply = {
                    id: (Date.now() + 1).toString(),
                    sender: 'bot',
                    text: '⚡ ¿Ocurrió una eventualidad o tala especial? Programemos un mantenimiento extraordinario en 1 clic:',
                    action: {
                        label: 'Programar Extraordinario',
                        url: '/mantenimientos?accion=extraordinario',
                        icon: CalendarCheck2,
                    },
                };
            } else if (lower.includes('parque') || lower.includes('plaza') || lower.includes('crear parque') || lower.includes('nuevo parque')) {
                botReply = {
                    id: (Date.now() + 1).toString(),
                    sender: 'bot',
                    text: '🌳 ¡Vamos a registrar un nuevo parque en el catálogo de Nuevo Chimbote!',
                    action: {
                        label: 'Registrar Nuevo Parque',
                        url: '/parques?accion=nuevo',
                        icon: Trees,
                    },
                };
            } else if (lower.includes('trabajador') || lower.includes('personal') || lower.includes('operario') || lower.includes('cuadrilla')) {
                botReply = {
                    id: (Date.now() + 1).toString(),
                    sender: 'bot',
                    text: '👷 Gestionemos al personal. Te abro la ventana para registrar un nuevo trabajador:',
                    action: {
                        label: 'Registrar Trabajador',
                        url: '/trabajadores?accion=registrar',
                        icon: UserPlus,
                    },
                };
            } else if (lower.includes('agua') || lower.includes('riego') || lower.includes('cisterna') || lower.includes('sin agua')) {
                botReply = {
                    id: (Date.now() + 1).toString(),
                    sender: 'bot',
                    text: '💧 Control de riego: Aquí tienes los parques que requieren abastecimiento de agua o cisterna:',
                    action: {
                        label: 'Ver Parques Sin Punto de Agua',
                        url: '/parques?filtro=sin_agua',
                        icon: Droplets,
                    },
                };
            } else if (lower.includes('reporte') || lower.includes('informe') || lower.includes('estadistic') || lower.includes('grafic')) {
                botReply = {
                    id: (Date.now() + 1).toString(),
                    sender: 'bot',
                    text: '📊 Generación de métricas e informes: Te llevo a la consola de reportes para exportar en PDF/Excel:',
                    action: {
                        label: 'Abrir Módulo de Reportes',
                        url: '/reportes',
                        icon: FileBarChart,
                    },
                };
            } else if (lower.includes('dashboard') || lower.includes('inicio') || lower.includes('resumen') || lower.includes('kpi')) {
                botReply = {
                    id: (Date.now() + 1).toString(),
                    sender: 'bot',
                    text: '🏠 Te llevo a la vista principal del Dashboard con todos los indicadores municipales:',
                    action: {
                        label: 'Ir al Dashboard',
                        url: '/dashboard',
                        icon: Zap,
                    },
                };
            } else if (lower.includes('configur') || lower.includes('regla') || lower.includes('frecuencia')) {
                botReply = {
                    id: (Date.now() + 1).toString(),
                    sender: 'bot',
                    text: '⚙️ Configuración del sistema: Ajusta los tipos de áreas, frecuencias y reglas de corte y riego:',
                    action: {
                        label: 'Ir a Configuración',
                        url: '/configuracion',
                        icon: Wrench,
                    },
                };
            } else if (lower.includes('hola') || lower.includes('buenos') || lower.includes('saludos')) {
                botReply = {
                    id: (Date.now() + 1).toString(),
                    sender: 'bot',
                    text: '¡Hola! 🌿 Qué gusto saludarte. Recuerda que puedo llevarte a cualquier parte del sistema para que no pierdas tiempo buscando menús. ¿Qué tarea realizaremos?',
                    chips: ['Ver vencidos', 'Mantenimiento extraordinario', 'Registrar trabajador', 'Reportes del mes'],
                };
            } else if (lower.includes('gracias') || lower.includes('genial') || lower.includes('bueno')) {
                botReply = {
                    id: (Date.now() + 1).toString(),
                    sender: 'bot',
                    text: '¡Con gusto! Cuidar el pulmón verde de Nuevo Chimbote es nuestra labor 💚. Avísame si necesitas otra acción rápida.',
                };
            }

            setMessages((prev) => [...prev, botReply]);
            setIsTyping(false);
        }, 400);
    };

    const handleChipClick = (chipText: string) => {
        processUserInput(chipText);
    };

    const resetChat = () => {
        setMessages(initialMessages);
    };

    return (
        <aside aria-label="Asistente Verdín" className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
            {/* BURBUJA DE MENSAJE FLOTANTE PROACTIVO */}
            {!isOpen && bubbleVisible && (
                <div className="relative mb-3 flex items-center gap-2 rounded-2xl border border-[#90a955] bg-white p-3.5 shadow-xl shadow-[#132a13]/15 animate-in fade-in slide-in-from-bottom-2 max-w-xs text-[#132a13]">
                    <span className="text-xl">🌿</span>
                    <div className="flex-1 text-xs">
                        <p className="font-bold text-[#132a13]">Verdín Asistente</p>
                        <p className="text-[#31572c] mt-0.5">{bubbleMessage}</p>
                    </div>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setBubbleVisible(false);
                        }}
                        className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                        title="Ocultar saludo"
                    >
                        <X className="h-3 w-3" />
                    </button>
                    {/* Flecha hacia abajo */}
                    <div className="absolute -bottom-2 right-7 h-0 w-0 border-x-8 border-x-transparent border-t-8 border-t-white" />
                </div>
            )}

            {/* BOTÓN FLOTANTE CON EL AVATAR DE LA MASCOTA */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`group relative flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-300 active:scale-95 cursor-pointer ${
                    isOpen
                        ? 'bg-[#132a13] text-white ring-4 ring-[#ecf39e]'
                        : 'bg-gradient-to-tr from-[#132a13] via-[#31572c] to-[#4f772d] text-white hover:scale-110 hover:shadow-[#31572c]/40 ring-4 ring-[#ecf39e]'
                }`}
                title={isOpen ? 'Cerrar a Verdín' : 'Abrir asistente Verdín'}
            >
                {/* Animación de halo pulsante */}
                {!isOpen && (
                    <span className="absolute -inset-1 rounded-full bg-[#ecf39e] opacity-40 blur-sm animate-ping pointer-events-none" />
                )}

                {isOpen ? (
                    <X className="h-6 w-6 transition-transform duration-200 group-hover:rotate-90" />
                ) : (
                    /* ILUSTRACIÓN DE VERDÍN (HOJITA CARISMÁTICA CON PALETA COOLORS) */
                    <div className="relative flex items-center justify-center">
                        <svg
                            viewBox="0 0 100 100"
                            className="h-11 w-11 drop-shadow-md transition-transform duration-300 group-hover:rotate-6"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            {/* Cuerpo de hoja (#4f772d / borde #132a13) */}
                            <path
                                d="M50 10 C25 25 15 55 30 80 C40 92 60 92 70 80 C85 55 75 25 50 10 Z"
                                fill="#4f772d"
                                stroke="#132a13"
                                strokeWidth="3"
                            />
                            {/* Brillo en #ecf39e */}
                            <path
                                d="M48 20 C32 32 26 55 35 72"
                                stroke="#ecf39e"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                            {/* Ojos */}
                            <circle cx="42" cy="48" r="4.5" fill="#132a13" />
                            <circle cx="58" cy="48" r="4.5" fill="#132a13" />
                            {/* Brillos en ojos */}
                            <circle cx="43.5" cy="46.5" r="1.5" fill="#ffffff" />
                            <circle cx="59.5" cy="46.5" r="1.5" fill="#ffffff" />
                            {/* Sonrisa */}
                            <path
                                d="M44 58 Q50 64 56 58"
                                stroke="#132a13"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                fill="none"
                            />
                            {/* Rubor en mejillas (#90a955) */}
                            <circle cx="36" cy="54" r="3" fill="#ecf39e" opacity="0.8" />
                            <circle cx="64" cy="54" r="3" fill="#ecf39e" opacity="0.8" />
                            {/* Tallo */}
                            <path
                                d="M50 85 Q50 95 53 98"
                                stroke="#132a13"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                            />
                        </svg>
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ecf39e] text-[10px] font-black text-[#132a13] shadow-xs">
                            ★
                        </span>
                    </div>
                )}
            </button>

            {/* PANEL DE ASISTENCIA Y ATAJOS DE VERDÍN */}
            {isOpen && (
                <div className="mb-4 flex h-[520px] w-[92vw] max-w-sm flex-col overflow-hidden rounded-3xl border border-[#90a955]/40 bg-white/98 shadow-2xl shadow-[#132a13]/25 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-200 sm:w-96 text-[#132a13]">
                    
                    {/* CABECERA DE VERDÍN */}
                    <div className="flex items-center justify-between border-b border-[#31572c] bg-gradient-to-r from-[#132a13] via-[#31572c] to-[#4f772d] p-4 text-[#ecf39e]">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 p-1 backdrop-blur-sm shadow-inner">
                                <svg viewBox="0 0 100 100" className="h-8 w-8" fill="none">
                                    <path
                                        d="M50 10 C25 25 15 55 30 80 C40 92 60 92 70 80 C85 55 75 25 50 10 Z"
                                        fill="#90a955"
                                        stroke="#ecf39e"
                                        strokeWidth="3"
                                    />
                                    <circle cx="42" cy="48" r="4" fill="#132a13" />
                                    <circle cx="58" cy="48" r="4" fill="#132a13" />
                                    <circle cx="43.5" cy="46.5" r="1.5" fill="#ffffff" />
                                    <circle cx="59.5" cy="46.5" r="1.5" fill="#ffffff" />
                                    <path
                                        d="M44 58 Q50 64 56 58"
                                        stroke="#132a13"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        fill="none"
                                    />
                                    <circle cx="36" cy="54" r="3" fill="#ecf39e" opacity="0.9" />
                                    <circle cx="64" cy="54" r="3" fill="#ecf39e" opacity="0.9" />
                                </svg>
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <h3 className="text-sm font-bold leading-none text-white">Verdín Asistente</h3>
                                    <span className="flex h-2 w-2 rounded-full bg-[#ecf39e] animate-pulse" />
                                </div>
                                <p className="mt-1 text-[11px] text-[#ecf39e]/90">Atajos rápidos y asistencia 24/7</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={resetChat}
                                className="rounded-xl p-1.5 text-[#ecf39e] hover:bg-white/20 transition cursor-pointer"
                                title="Reiniciar conversación"
                            >
                                <RotateCcw className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="rounded-xl p-1.5 text-[#ecf39e] hover:bg-white/20 transition cursor-pointer"
                                title="Cerrar ventana"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* BOTONES DE ACCIÓN RÁPIDA (ATAJOS DIRECTOS DE 1 CLIC) */}
                    <div className="border-b border-[#d6e19f] bg-[#f8fae8] p-2.5">
                        <p className="px-1 text-[10px] font-bold text-[#31572c] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <Zap className="h-3 w-3 text-[#4f772d]" />
                            Atajos de 1 clic (ahorra tiempo)
                        </p>
                        <div className="grid grid-cols-3 gap-1.5">
                            <button
                                type="button"
                                onClick={() => handleExecuteAction('/mantenimientos?estado=vencidos')}
                                className="flex flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50/80 p-2 text-center transition hover:bg-rose-100 hover:border-rose-300 active:scale-95 cursor-pointer shadow-2xs"
                            >
                                <AlertTriangle className="h-4 w-4 text-rose-600 mb-0.5" />
                                <span className="text-[10px] font-bold text-rose-800 leading-tight">Vencidos</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleExecuteAction('/mantenimientos?accion=extraordinario')}
                                className="flex flex-col items-center justify-center rounded-xl border border-amber-200 bg-amber-50/80 p-2 text-center transition hover:bg-amber-100 hover:border-amber-300 active:scale-95 cursor-pointer shadow-2xs"
                            >
                                <CalendarCheck2 className="h-4 w-4 text-amber-600 mb-0.5" />
                                <span className="text-[10px] font-bold text-amber-900 leading-tight">Extraordinario</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleExecuteAction('/parques?accion=nuevo')}
                                className="flex flex-col items-center justify-center rounded-xl border border-[#90a955] bg-[#ecf39e]/40 p-2 text-center transition hover:bg-[#ecf39e] active:scale-95 cursor-pointer shadow-2xs"
                            >
                                <Trees className="h-4 w-4 text-[#31572c] mb-0.5" />
                                <span className="text-[10px] font-bold text-[#132a13] leading-tight">+ Parque</span>
                            </button>
                        </div>
                    </div>

                    {/* CUERPO DEL CHAT Y MENSAJES */}
                    <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-xs leading-relaxed ${
                                        msg.sender === 'user'
                                            ? 'bg-[#31572c] text-[#ecf39e] rounded-br-xs'
                                            : 'bg-[#f4f7e6] border border-[#d6e19f] text-[#132a13] rounded-bl-xs'
                                    }`}
                                >
                                    {msg.text}
                                </div>

                                {/* BOTÓN DE ACCIÓN DIRECTA GENERADO POR VERDÍN */}
                                {msg.action && (
                                    <div className="mt-2 w-full max-w-[85%]">
                                        <button
                                            type="button"
                                            onClick={() => handleExecuteAction(msg.action!.url)}
                                            className="w-full flex items-center justify-between gap-2 rounded-xl border border-[#90a955] bg-gradient-to-r from-[#31572c] to-[#4f772d] p-2.5 text-[#ecf39e] font-bold shadow-md shadow-[#132a13]/20 transition hover:from-[#132a13] hover:to-[#31572c] active:scale-98 cursor-pointer"
                                        >
                                            <span className="flex items-center gap-2 text-xs">
                                                {msg.action.icon && <msg.action.icon className="h-4 w-4" />}
                                                {msg.action.label}
                                            </span>
                                            <ChevronRight className="h-4 w-4 shrink-0 text-[#ecf39e]" />
                                        </button>
                                    </div>
                                )}

                                {/* CHIPS DE COMANDOS RÁPIDOS */}
                                {msg.chips && (
                                    <div className="mt-2 flex flex-wrap gap-1.5 max-w-[95%]">
                                        {msg.chips.map((chip) => (
                                            <button
                                                key={chip}
                                                type="button"
                                                onClick={() => handleChipClick(chip)}
                                                className="inline-flex items-center gap-1 rounded-full border border-[#90a955] bg-[#ecf39e]/40 px-2.5 py-1 text-[11px] font-semibold text-[#132a13] transition hover:bg-[#ecf39e] active:scale-95 shadow-2xs cursor-pointer"
                                            >
                                                <span>🌱</span>
                                                {chip}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* INDICADOR DE ESCRITURA */}
                        {isTyping && (
                            <div className="flex items-center gap-1.5 text-slate-400 text-xs italic pl-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#4f772d] animate-bounce" />
                                <span className="h-1.5 w-1.5 rounded-full bg-[#4f772d] animate-bounce [animation-delay:0.2s]" />
                                <span className="h-1.5 w-1.5 rounded-full bg-[#4f772d] animate-bounce [animation-delay:0.4s]" />
                                <span className="text-[11px] text-[#31572c]">Verdín está pensando...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* ENTRADA DE TEXTO PARA PREGUNTARLE A VERDÍN */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            processUserInput(input);
                        }}
                        className="border-t border-[#d6e19f] bg-white p-2.5 flex items-center gap-2"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Escribe: vencidos, nuevo parque..."
                            className="flex-1 rounded-xl border border-[#d6e19f] bg-[#f8fae8] px-3 py-2 text-xs text-[#132a13] placeholder:text-slate-400 focus:border-[#4f772d] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#4f772d] transition"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim()}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#31572c] text-[#ecf39e] transition hover:bg-[#4f772d] disabled:opacity-40 disabled:hover:bg-[#31572c] cursor-pointer shadow-xs"
                            title="Enviar instrucción"
                        >
                            <Send className="h-3.5 w-3.5" />
                        </button>
                    </form>
                </div>
            )}
        </aside>
    );
}
