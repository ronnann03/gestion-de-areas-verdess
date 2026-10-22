import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';

import { type NavItem } from '@/types';

import { Link } from '@inertiajs/react';

import { ClipboardList, FileBarChart, LayoutDashboard, Settings2, Trees, Users } from 'lucide-react';

// Módulos principales del sistema

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Gestión de parques',
        url: '/parques',
        icon: Trees,
    },
    {
        title: 'Configuración',
        url: '/configuracion',
        icon: Settings2,
    },
    {
        title: 'Mantenimientos',
        url: '/mantenimientos',
        icon: ClipboardList,
    },
    {
        title: 'Trabajadores',
        url: '/trabajadores',
        icon: Users,
    },
    {
        title: 'Reportes',
        url: '/reportes',
        icon: FileBarChart,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            {/* LOGOTIPO INSTITUCIONAL */}

            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <img
                                    src="/images/escudo-nuevo-chimbote.png"
                                    alt="Escudo de Nuevo Chimbote"
                                    className="h-9 w-9 shrink-0 object-contain"
                                />

                                <div className="ml-1 grid min-w-0 flex-1 text-left group-data-[collapsible=icon]:hidden">
                                    <span className="truncate text-xs font-semibold">Gestión de Áreas Verdes</span>

                                    <span className="text-muted-foreground truncate text-[10px]">Municipalidad de Nuevo Chimbote</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            {/* MENÚ PRINCIPAL */}

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            {/* PERFIL DEL USUARIO */}

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
