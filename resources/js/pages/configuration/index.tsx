import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Building2,
    CalendarClock,
    CheckCircle2,
    Edit,
    ImagePlus,
    Layers3,
    Plus,
    Power,
    Settings2,
    SlidersHorizontal,
    Wrench,
    X,
    Zap,
} from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';

type Tab = 'areas' | 'maintenances' | 'rules' | 'institution';
type CatalogKind = 'area' | 'maintenance';

interface CatalogItem {
    id: number;
    name: string;
    description: string | null;
    is_active: boolean;
}

interface MaintenanceRule {
    id: number;
    green_area_type: string;
    maintenance_type: string;
    frequency_days: number;
    advance_days: number;
    is_active: boolean;
}

interface Institution {
    municipality_name: string;
    department_name: string;
    logo_url: string | null;
    address: string | null;
    manager_name: string | null;
    management_year: string | null;
    document_footer: string | null;
}

interface Props {
    greenAreaTypes: CatalogItem[];
    maintenanceTypes: CatalogItem[];
    maintenanceRules: MaintenanceRule[];
    institution: Institution;
}

type CatalogForm = {
    name: string;
    description: string;
    is_active: boolean;
};

type RuleForm = {
    green_area_type: string;
    maintenance_type: string;
    frequency_days: number;
    advance_days: number;
    is_active: boolean;
};

type InstitutionForm = {
    municipality_name: string;
    department_name: string;
    logo: File | null;
    address: string;
    manager_name: string;
    management_year: string;
    document_footer: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Configuración', href: '/configuracion' },
];

const tabs: Array<{ id: Tab; label: string; description: string; icon: typeof Layers3 }> = [
    { id: 'areas', label: 'Tipos de áreas verdes', description: 'Catálogo para clasificar parques', icon: Layers3 },
    { id: 'maintenances', label: 'Tipos de mantenimiento', description: 'Labores disponibles en el sistema', icon: Wrench },
    { id: 'rules', label: 'Programación por frecuencia', description: 'Reglas para fechas y alertas', icon: CalendarClock },
    { id: 'institution', label: 'Datos institucionales', description: 'Información para documentos', icon: Building2 },
];

function StatusBadge({ active }: { active: boolean }) {
    return active ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3" /> Activo
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-neutral-800 dark:text-neutral-300">
            <Power className="h-3 w-3" /> Inactivo
        </span>
    );
}

export default function ConfigurationIndex({ greenAreaTypes, maintenanceTypes, maintenanceRules, institution }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('areas');
    const [catalogModalOpen, setCatalogModalOpen] = useState(false);
    const [catalogKind, setCatalogKind] = useState<CatalogKind>('area');
    const [editingCatalog, setEditingCatalog] = useState<CatalogItem | null>(null);
    const [ruleModalOpen, setRuleModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<MaintenanceRule | null>(null);

    const catalogForm = useForm<CatalogForm>({ name: '', description: '', is_active: true });
    const ruleForm = useForm<RuleForm>({
        green_area_type: greenAreaTypes.find((item) => item.is_active)?.name ?? '',
        maintenance_type: maintenanceTypes.find((item) => item.is_active)?.name ?? '',
        frequency_days: 7,
        advance_days: 1,
        is_active: true,
    });
    const institutionForm = useForm<InstitutionForm>({
        municipality_name: institution.municipality_name,
        department_name: institution.department_name,
        logo: null,
        address: institution.address ?? '',
        manager_name: institution.manager_name ?? '',
        management_year: institution.management_year ?? new Date().getFullYear().toString(),
        document_footer: institution.document_footer ?? '',
    });

    const openCatalog = (kind: CatalogKind, item?: CatalogItem) => {
        setCatalogKind(kind);
        setEditingCatalog(item ?? null);
        catalogForm.clearErrors();
        catalogForm.setData({
            name: item?.name ?? '',
            description: item?.description ?? '',
            is_active: item?.is_active ?? true,
        });
        setCatalogModalOpen(true);
    };

    const submitCatalog = (event: FormEvent) => {
        event.preventDefault();
        const base = catalogKind === 'area' ? '/configuracion/tipos-area' : '/configuracion/tipos-mantenimiento';
        const options = { onSuccess: () => setCatalogModalOpen(false), preserveScroll: true };

        if (editingCatalog) {
            catalogForm.put(`${base}/${editingCatalog.id}`, options);
        } else {
            catalogForm.post(base, options);
        }
    };

    const toggleCatalog = (kind: CatalogKind, item: CatalogItem) => {
        const label = item.is_active ? 'desactivar' : 'activar';
        if (!confirm(`¿Desea ${label} “${item.name}”? Los registros relacionados se conservarán.`)) return;
        const base = kind === 'area' ? '/configuracion/tipos-area' : '/configuracion/tipos-mantenimiento';
        router.patch(`${base}/${item.id}/estado`, {}, { preserveScroll: true });
    };

    const openRule = (rule?: MaintenanceRule) => {
        setEditingRule(rule ?? null);
        ruleForm.clearErrors();
        ruleForm.setData({
            green_area_type: rule?.green_area_type ?? greenAreaTypes.find((item) => item.is_active)?.name ?? '',
            maintenance_type: rule?.maintenance_type ?? maintenanceTypes.find((item) => item.is_active)?.name ?? '',
            frequency_days: rule?.frequency_days ?? 7,
            advance_days: rule?.advance_days ?? 1,
            is_active: rule?.is_active ?? true,
        });
        setRuleModalOpen(true);
    };

    const submitRule = (event: FormEvent) => {
        event.preventDefault();
        const options = { onSuccess: () => setRuleModalOpen(false), preserveScroll: true };
        if (editingRule) {
            ruleForm.put(`/configuracion/reglas/${editingRule.id}`, options);
        } else {
            ruleForm.post('/configuracion/reglas', options);
        }
    };

    const toggleRule = (rule: MaintenanceRule) => {
        const label = rule.is_active ? 'desactivar' : 'activar';
        if (!confirm(`¿Desea ${label} esta regla de programación?`)) return;
        router.patch(`/configuracion/reglas/${rule.id}/estado`, {}, { preserveScroll: true });
    };

    const submitInstitution = (event: FormEvent) => {
        event.preventDefault();
        institutionForm.post('/configuracion/datos-institucionales', { forceFormData: true, preserveScroll: true });
    };

    const activeRules = maintenanceRules.filter((rule) => rule.is_active).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configuración - Sistema de Áreas Verdes" />

            <div className="flex flex-1 flex-col gap-6 bg-slate-50/60 p-4 dark:bg-background md:p-6">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                    <div>
                        <p className="text-xs text-muted-foreground">Administración del sistema</p>
                        <h1 className="mt-1 flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                            <Settings2 className="h-8 w-8 text-emerald-600" /> Configuración
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">Catálogos generales, reglas automáticas e información institucional.</p>
                    </div>
                    <Link href="/mantenimientos" className="inline-flex items-center justify-center gap-2 rounded-xl border bg-card px-4 py-2.5 text-xs font-semibold shadow-xs transition hover:bg-muted">
                        <Zap className="h-4 w-4 text-amber-600" /> Programar mantenimiento extraordinario
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border bg-card p-4 shadow-xs"><p className="text-xs text-muted-foreground">Tipos de áreas activos</p><p className="mt-1 text-2xl font-bold">{greenAreaTypes.filter((item) => item.is_active).length}</p></div>
                    <div className="rounded-2xl border bg-card p-4 shadow-xs"><p className="text-xs text-muted-foreground">Mantenimientos activos</p><p className="mt-1 text-2xl font-bold">{maintenanceTypes.filter((item) => item.is_active).length}</p></div>
                    <div className="rounded-2xl border bg-card p-4 shadow-xs"><p className="text-xs text-muted-foreground">Reglas que generan alertas</p><p className="mt-1 text-2xl font-bold text-emerald-600">{activeRules}</p></div>
                </div>

                <nav className="grid grid-cols-1 gap-2 rounded-2xl border bg-card p-2 shadow-xs sm:grid-cols-2 xl:grid-cols-4" aria-label="Secciones de configuración">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const selected = activeTab === tab.id;
                        return (
                            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition ${selected ? 'bg-emerald-600 text-white shadow-sm' : 'hover:bg-muted'}`}>
                                <Icon className="h-5 w-5 shrink-0" />
                                <span><span className="block text-xs font-bold">{tab.label}</span><span className={`block text-[10px] ${selected ? 'text-emerald-50' : 'text-muted-foreground'}`}>{tab.description}</span></span>
                            </button>
                        );
                    })}
                </nav>

                {activeTab === 'areas' && (
                    <CatalogSection
                        title="Tipos de áreas verdes"
                        description="Defina las categorías disponibles al registrar parques y áreas verdes. No se eliminan categorías relacionadas; se desactivan para conservar el historial."
                        items={greenAreaTypes}
                        onCreate={() => openCatalog('area')}
                        onEdit={(item) => openCatalog('area', item)}
                        onToggle={(item) => toggleCatalog('area', item)}
                    />
                )}

                {activeTab === 'maintenances' && (
                    <CatalogSection
                        title="Tipos de mantenimiento"
                        description="Administre las labores que podrán utilizarse en reglas, programaciones y mantenimientos extraordinarios."
                        items={maintenanceTypes}
                        onCreate={() => openCatalog('maintenance')}
                        onEdit={(item) => openCatalog('maintenance', item)}
                        onToggle={(item) => toggleCatalog('maintenance', item)}
                    />
                )}

                {activeTab === 'rules' && (
                    <section className="overflow-hidden rounded-2xl border bg-card shadow-xs">
                        <div className="flex flex-col justify-between gap-3 border-b p-5 sm:flex-row sm:items-center">
                            <div><h2 className="font-bold text-foreground">Programación por frecuencia</h2><p className="mt-1 text-xs text-muted-foreground">Las reglas activas calculan las fechas de mantenimiento y sus alertas al registrar un parque.</p></div>
                            <button type="button" onClick={() => openRule()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700"><Plus className="h-4 w-4" /> Registrar regla</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[820px] text-left text-xs">
                                <thead className="border-b bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-4 py-3">Tipo de área verde</th><th className="px-4 py-3">Mantenimiento</th><th className="px-4 py-3 text-center">Frecuencia</th><th className="px-4 py-3 text-center">Anticipación</th><th className="px-4 py-3 text-center">Estado</th><th className="px-4 py-3 text-center">Acciones</th></tr></thead>
                                <tbody className="divide-y divide-border">
                                    {maintenanceRules.map((rule) => (
                                        <tr key={rule.id} className="hover:bg-muted/25"><td className="px-4 py-3 font-semibold">{rule.green_area_type}</td><td className="px-4 py-3">{rule.maintenance_type}</td><td className="px-4 py-3 text-center"><span className="rounded-lg bg-blue-100 px-2.5 py-1 font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-300">Cada {rule.frequency_days} días</span></td><td className="px-4 py-3 text-center">{rule.advance_days} día(s) antes</td><td className="px-4 py-3 text-center"><StatusBadge active={rule.is_active} /></td><td className="px-4 py-3"><div className="flex justify-center gap-1"><button type="button" title="Editar regla" onClick={() => openRule(rule)} className="rounded-lg p-2 text-blue-600 hover:bg-blue-100"><Edit className="h-4 w-4" /></button><button type="button" title={rule.is_active ? 'Desactivar regla' : 'Activar regla'} onClick={() => toggleRule(rule)} className={`rounded-lg p-2 ${rule.is_active ? 'text-amber-600 hover:bg-amber-100' : 'text-emerald-600 hover:bg-emerald-100'}`}><Power className="h-4 w-4" /></button></div></td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {activeTab === 'institution' && (
                    <section className="rounded-2xl border bg-card shadow-xs">
                        <div className="border-b p-5"><h2 className="font-bold text-foreground">Datos institucionales</h2><p className="mt-1 text-xs text-muted-foreground">Esta información se utilizará en reportes y documentos oficiales generados por el sistema.</p></div>
                        <form onSubmit={submitInstitution} className="space-y-5 p-5">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Field label="Nombre de la municipalidad" error={institutionForm.errors.municipality_name}><input required value={institutionForm.data.municipality_name} onChange={(e) => institutionForm.setData('municipality_name', e.target.value)} className="field" /></Field>
                                <Field label="Área municipal responsable" error={institutionForm.errors.department_name}><input required value={institutionForm.data.department_name} onChange={(e) => institutionForm.setData('department_name', e.target.value)} className="field" /></Field>
                                <Field label="Dirección" error={institutionForm.errors.address}><input value={institutionForm.data.address} onChange={(e) => institutionForm.setData('address', e.target.value)} className="field" /></Field>
                                <Field label="Nombre del encargado" error={institutionForm.errors.manager_name}><input value={institutionForm.data.manager_name} onChange={(e) => institutionForm.setData('manager_name', e.target.value)} className="field" /></Field>
                                <Field label="Año de gestión" error={institutionForm.errors.management_year}><input required maxLength={20} value={institutionForm.data.management_year} onChange={(e) => institutionForm.setData('management_year', e.target.value)} className="field" /></Field>
                                <Field label="Logotipo institucional" error={institutionForm.errors.logo}><div className="flex items-center gap-3">{institution.logo_url ? <img src={institution.logo_url} alt="Logotipo institucional" className="h-14 w-14 rounded-xl border object-contain p-1" /> : <div className="flex h-14 w-14 items-center justify-center rounded-xl border bg-muted"><Building2 className="h-6 w-6 text-muted-foreground" /></div>}<label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-muted"><ImagePlus className="h-4 w-4" /> Seleccionar imagen<input type="file" accept="image/*" className="sr-only" onChange={(e) => institutionForm.setData('logo', e.target.files?.[0] ?? null)} /></label></div></Field>
                            </div>
                            <Field label="Texto del pie del documento" error={institutionForm.errors.document_footer}><textarea rows={3} value={institutionForm.data.document_footer} onChange={(e) => institutionForm.setData('document_footer', e.target.value)} className="field" /></Field>
                            <div className="flex justify-end border-t pt-4"><button type="submit" disabled={institutionForm.processing} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{institutionForm.processing ? 'Guardando...' : 'Guardar datos institucionales'}</button></div>
                        </form>
                    </section>
                )}
            </div>

            {catalogModalOpen && (
                <Modal title={editingCatalog ? 'Editar catálogo' : catalogKind === 'area' ? 'Registrar tipo de área verde' : 'Registrar tipo de mantenimiento'} onClose={() => setCatalogModalOpen(false)}>
                    <form onSubmit={submitCatalog} className="space-y-4">
                        <Field label="Nombre" error={catalogForm.errors.name}><input required autoFocus value={catalogForm.data.name} onChange={(e) => catalogForm.setData('name', e.target.value)} className="field" placeholder={catalogKind === 'area' ? 'Ej. Plazoleta' : 'Ej. Corte de césped'} /></Field>
                        <Field label="Descripción" error={catalogForm.errors.description}><textarea rows={3} value={catalogForm.data.description} onChange={(e) => catalogForm.setData('description', e.target.value)} className="field" placeholder="Descripción breve para los usuarios del sistema." /></Field>
                        <Field label="Estado"><select value={catalogForm.data.is_active ? '1' : '0'} onChange={(e) => catalogForm.setData('is_active', e.target.value === '1')} className="field"><option value="1">Activo</option><option value="0">Inactivo</option></select></Field>
                        <ModalActions processing={catalogForm.processing} editing={!!editingCatalog} onCancel={() => setCatalogModalOpen(false)} />
                    </form>
                </Modal>
            )}

            {ruleModalOpen && (
                <Modal title={editingRule ? 'Editar regla de programación' : 'Registrar regla de programación'} onClose={() => setRuleModalOpen(false)}>
                    <form onSubmit={submitRule} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="Tipo de área verde" error={ruleForm.errors.green_area_type}><select required value={ruleForm.data.green_area_type} onChange={(e) => ruleForm.setData('green_area_type', e.target.value)} className="field">{greenAreaTypes.map((item) => <option key={item.id} value={item.name} disabled={!item.is_active && item.name !== editingRule?.green_area_type}>{item.name}{!item.is_active ? ' (inactivo)' : ''}</option>)}</select></Field>
                            <Field label="Tipo de mantenimiento" error={ruleForm.errors.maintenance_type}><select required value={ruleForm.data.maintenance_type} onChange={(e) => ruleForm.setData('maintenance_type', e.target.value)} className="field">{maintenanceTypes.map((item) => <option key={item.id} value={item.name} disabled={!item.is_active && item.name !== editingRule?.maintenance_type}>{item.name}{!item.is_active ? ' (inactivo)' : ''}</option>)}</select></Field>
                            <Field label="Frecuencia en días" error={ruleForm.errors.frequency_days}><input type="number" required min={1} value={ruleForm.data.frequency_days} onChange={(e) => ruleForm.setData('frequency_days', Number(e.target.value))} className="field" /></Field>
                            <Field label="Días de anticipación" error={ruleForm.errors.advance_days}><input type="number" required min={0} max={ruleForm.data.frequency_days} value={ruleForm.data.advance_days} onChange={(e) => ruleForm.setData('advance_days', Number(e.target.value))} className="field" /></Field>
                        </div>
                        <Field label="Estado de la regla"><select value={ruleForm.data.is_active ? '1' : '0'} onChange={(e) => ruleForm.setData('is_active', e.target.value === '1')} className="field"><option value="1">Activa: generará programaciones y alertas</option><option value="0">Inactiva</option></select></Field>
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"><strong>Validación:</strong> la frecuencia debe ser mayor que cero y la anticipación no puede superar la frecuencia.</div>
                        <ModalActions processing={ruleForm.processing} editing={!!editingRule} onCancel={() => setRuleModalOpen(false)} />
                    </form>
                </Modal>
            )}
        </AppLayout>
    );
}

function CatalogSection({ title, description, items, onCreate, onEdit, onToggle }: { title: string; description: string; items: CatalogItem[]; onCreate: () => void; onEdit: (item: CatalogItem) => void; onToggle: (item: CatalogItem) => void }) {
    return (
        <section className="overflow-hidden rounded-2xl border bg-card shadow-xs">
            <div className="flex flex-col justify-between gap-3 border-b p-5 sm:flex-row sm:items-center"><div><h2 className="font-bold text-foreground">{title}</h2><p className="mt-1 max-w-3xl text-xs text-muted-foreground">{description}</p></div><button type="button" onClick={onCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700"><Plus className="h-4 w-4" /> Registrar</button></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-xs"><thead className="border-b bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Descripción</th><th className="px-4 py-3 text-center">Estado</th><th className="px-4 py-3 text-center">Acciones</th></tr></thead><tbody className="divide-y divide-border">{items.map((item) => <tr key={item.id} className="hover:bg-muted/25"><td className="px-4 py-3 font-semibold text-foreground">{item.name}</td><td className="max-w-xl px-4 py-3 text-muted-foreground">{item.description || 'Sin descripción'}</td><td className="px-4 py-3 text-center"><StatusBadge active={item.is_active} /></td><td className="px-4 py-3"><div className="flex justify-center gap-1"><button type="button" title="Editar" onClick={() => onEdit(item)} className="rounded-lg p-2 text-blue-600 hover:bg-blue-100"><Edit className="h-4 w-4" /></button><button type="button" title={item.is_active ? 'Desactivar' : 'Activar'} onClick={() => onToggle(item)} className={`rounded-lg p-2 ${item.is_active ? 'text-amber-600 hover:bg-amber-100' : 'text-emerald-600 hover:bg-emerald-100'}`}><Power className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></div>
        </section>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
    return <label className="block text-xs font-semibold text-foreground">{label}{children}{error && <span className="mt-1 block font-normal text-red-500">{error}</span>}</label>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"><div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border bg-background shadow-2xl"><div className="sticky top-0 flex items-center justify-between border-b bg-background px-6 py-4"><h2 className="flex items-center gap-2 text-lg font-bold"><SlidersHorizontal className="h-5 w-5 text-emerald-600" />{title}</h2><button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button></div><div className="p-6">{children}</div></div></div>;
}

function ModalActions({ processing, editing, onCancel }: { processing: boolean; editing: boolean; onCancel: () => void }) {
    return <div className="flex justify-end gap-2 border-t pt-4"><button type="button" onClick={onCancel} className="rounded-xl border px-4 py-2 text-xs font-semibold hover:bg-muted">Cancelar</button><button type="submit" disabled={processing} className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{processing ? 'Guardando...' : editing ? 'Guardar cambios' : 'Registrar'}</button></div>;
}
