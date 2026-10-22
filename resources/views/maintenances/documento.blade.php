<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Parte de Mantenimiento - {{ $maintenance->maintenance_number }}</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        body {
            background-color: #f1f5f9;
            color: #0f172a;
            padding: 24px;
        }

        .paper {
            max-width: 820px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            padding: 40px;
            border: 1px solid #e2e8f0;
        }

        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #059669;
            padding-bottom: 20px;
            margin-bottom: 24px;
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .logo-box {
            width: 56px;
            height: 56px;
            background: #059669;
            color: #ffffff;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 24px;
        }

        .title-box h1 {
            font-size: 16px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #064e3b;
        }

        .title-box h2 {
            font-size: 12px;
            font-weight: 600;
            color: #475569;
            margin-top: 2px;
        }

        .doc-tag {
            text-align: right;
        }

        .doc-tag .type {
            font-size: 11px;
            text-transform: uppercase;
            font-weight: 700;
            color: #64748b;
        }

        .doc-tag .number {
            font-size: 18px;
            font-weight: 800;
            color: #047857;
            font-family: monospace;
            letter-spacing: 0.5px;
        }

        .meta-strip {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 24px;
            font-size: 12px;
        }

        .meta-strip .item span {
            display: block;
            color: #64748b;
            font-size: 11px;
            font-weight: 500;
        }

        .meta-strip .item strong {
            color: #1e293b;
            font-size: 13px;
        }

        .section-title {
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #0f172a;
            border-left: 4px solid #059669;
            padding-left: 8px;
            margin-top: 20px;
            margin-bottom: 12px;
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            margin-bottom: 16px;
        }

        .data-table th, .data-table td {
            border: 1px solid #e2e8f0;
            padding: 8px 12px;
            text-align: left;
        }

        .data-table th {
            background-color: #f1f5f9;
            color: #334155;
            font-weight: 600;
            width: 25%;
        }

        .data-table td {
            color: #0f172a;
        }

        .photos-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-top: 16px;
            margin-bottom: 24px;
        }

        .photo-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
            background: #f8fafc;
            text-align: center;
        }

        .photo-card img {
            width: 100%;
            height: 200px;
            object-fit: cover;
            display: block;
        }

        .photo-card .caption {
            padding: 8px;
            font-size: 12px;
            font-weight: 600;
            color: #475569;
            border-top: 1px solid #e2e8f0;
        }

        .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 60px;
            padding-top: 20px;
        }

        .sign-box {
            text-align: center;
            border-top: 1px dashed #94a3b8;
            padding-top: 8px;
        }

        .sign-box p {
            font-size: 12px;
            color: #1e293b;
            font-weight: 600;
        }

        .sign-box span {
            font-size: 11px;
            color: #64748b;
        }

        .actions-bar {
            max-width: 820px;
            margin: 0 auto 16px auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #059669;
            color: #ffffff;
            padding: 10px 18px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            text-decoration: none;
            border: none;
            cursor: pointer;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .btn:hover {
            background: #047857;
        }

        .btn-secondary {
            background: #e2e8f0;
            color: #334155;
        }

        .btn-secondary:hover {
            background: #cbd5e1;
        }

        @media print {
            body {
                background: none;
                padding: 0;
            }

            .paper {
                box-shadow: none;
                border: none;
                padding: 0;
                max-width: 100%;
            }

            .actions-bar {
                display: none !important;
            }
        }
    </style>
</head>
<body>

    <div class="actions-bar">
        <a href="{{ route('maintenances.index') }}" class="btn btn-secondary">
            ← Volver a Bandeja de Mantenimientos
        </a>
        <button onclick="window.print()" class="btn">
            🖨️ Imprimir / Guardar como PDF
        </button>
    </div>

    <div class="paper">
        <!-- Encabezado Oficial -->
        <div class="header">
            <div class="brand">
                <div class="logo-box">
                    @if ($institution?->logo_url)
                        <img src="{{ $institution->logo_url }}" alt="Logotipo institucional" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                    @else
                        🌿
                    @endif
                </div>
                <div class="title-box">
                    <h1>{{ $institution?->municipality_name ?? 'Municipalidad Distrital de Nuevo Chimbote' }}</h1>
                    <h2>{{ $institution?->department_name ?? 'Subgerencia de Parques, Jardines y Áreas Verdes' }}</h2>
                </div>
            </div>
            <div class="doc-tag">
                <div class="type">Parte de Mantenimiento de Área Verde</div>
                <div class="number">{{ $maintenance->maintenance_number }}</div>
            </div>
        </div>

        <!-- Metadatos de Emisión -->
        <div class="meta-strip">
            <div class="item">
                <span>Fecha de Emisión:</span>
                <strong>{{ now()->format('d/m/Y - H:i') }}</strong>
            </div>
            <div class="item">
                <span>Estado del Mantenimiento:</span>
                <strong style="text-transform: capitalize; color: {{ $maintenance->status === 'finalizado' ? '#059669' : '#d97706' }};">
                    {{ $maintenance->status }}
                </strong>
            </div>
            <div class="item">
                <span>Modalidad:</span>
                <strong>{{ $maintenance->is_extraordinary ? 'Extraordinario' : 'Por Frecuencia Automatizada' }}</strong>
            </div>
        </div>

        <!-- 1. Datos del Parque -->
        <h3 class="section-title">Datos del Parque o Área Verde</h3>
        <table class="data-table">
            <tr>
                <th>Código del Parque</th>
                <td><strong>{{ $park->code ?? ('PRQ-' . str_pad($park->id, 4, '0', STR_PAD_LEFT)) }}</strong></td>
                <th>Denominación</th>
                <td><strong>{{ $park->name }}</strong></td>
            </tr>
            <tr>
                <th>Tipo de Área Verde</th>
                <td>{{ $park->green_area_type ?? 'Parque' }}</td>
                <th>Sector / Zona</th>
                <td>{{ $park->zone ?? 'Sector Central' }}</td>
            </tr>
            <tr>
                <th>Ubicación</th>
                <td colspan="3">{{ $park->address ?: 'Sin dirección registrada' }} {{ $park->reference ? ' (' . $park->reference . ')' : '' }}</td>
            </tr>
        </table>

        <!-- 2. Información del Mantenimiento -->
        <h3 class="section-title">Detalle del Mantenimiento Ejecutado</h3>
        <table class="data-table">
            <tr>
                <th>Tipo de Mantenimiento</th>
                <td><strong>{{ $maintenance->maintenance_type }}</strong></td>
                <th>Trabajador / Cuadrilla</th>
                <td>{{ $maintenance->responsible_worker ?: 'No especificado' }}</td>
            </tr>
            <tr>
                <th>Fecha Programada</th>
                <td>{{ $maintenance->scheduled_date ? $maintenance->scheduled_date->format('d/m/Y') : 'N/A' }}</td>
                <th>Fecha Real de Ejecución</th>
                <td><strong>{{ $maintenance->execution_date ? $maintenance->execution_date->format('d/m/Y') : now()->format('d/m/Y') }}</strong></td>
            </tr>
            <tr>
                <th>Hora de Inicio</th>
                <td>{{ $maintenance->start_time ?: 'No registrada' }}</td>
                <th>Hora de Finalización</th>
                <td>{{ $maintenance->end_time ?: 'No registrada' }}</td>
            </tr>
            <tr>
                <th>Duración Estimada</th>
                <td>
                    @if($maintenance->duration_minutes)
                        <strong>{{ floor($maintenance->duration_minutes / 60) }}h {{ $maintenance->duration_minutes % 60 }}min</strong> ({{ $maintenance->duration_minutes }} minutos)
                    @else
                        No calculada
                    @endif
                </td>
                <th>Resultado de la Labor</th>
                <td><strong style="color: #059669;">{{ $maintenance->result ?: 'Conforme / Óptimo' }}</strong></td>
            </tr>
            @if($maintenance->is_extraordinary && $maintenance->reason)
            <tr>
                <th>Motivo Extraordinario</th>
                <td colspan="3" style="color: #b45309; font-weight: 500;">{{ $maintenance->reason }}</td>
            </tr>
            @endif
            <tr>
                <th>Descripción del Trabajo</th>
                <td colspan="3">{{ $maintenance->work_description ?: 'Mantenimiento integral realizado según los estándares municipales.' }}</td>
            </tr>
            @if($maintenance->initial_observation)
            <tr>
                <th>Observación Inicial</th>
                <td colspan="3">{{ $maintenance->initial_observation }}</td>
            </tr>
            @endif
            @if($maintenance->observations)
            <tr>
                <th>Observaciones Generales</th>
                <td colspan="3">{{ $maintenance->observations }}</td>
            </tr>
            @endif
        </table>

        <!-- 3. Fotografías del Trabajo (si existen) -->
        @if($maintenance->photo_before_url || $maintenance->photo_after_url)
        <h3 class="section-title">Evidencia Fotográfica</h3>
        <div class="photos-grid">
            @if($maintenance->photo_before_url)
            <div class="photo-card">
                <img src="{{ str_starts_with($maintenance->photo_before_url, 'http') ? $maintenance->photo_before_url : asset('storage/' . $maintenance->photo_before_url) }}" alt="Antes del trabajo">
                <div class="caption">Fotografía Previa al Mantenimiento</div>
            </div>
            @endif
            @if($maintenance->photo_after_url)
            <div class="photo-card">
                <img src="{{ str_starts_with($maintenance->photo_after_url, 'http') ? $maintenance->photo_after_url : asset('storage/' . $maintenance->photo_after_url) }}" alt="Posterior al trabajo">
                <div class="caption">Fotografía Posterior al Mantenimiento</div>
            </div>
            @endif
        </div>
        @endif

        <!-- Firmas de Conformidad -->
        <div class="signatures">
            <div class="sign-box">
                <p>{{ $maintenance->responsible_worker ?: 'Responsable de Cuadrilla' }}</p>
                <span>Firma del Encargado / Trabajador</span>
            </div>
            <div class="sign-box">
                <p>{{ $institution?->manager_name ?: 'Supervisor de Áreas Verdes' }}</p>
                <span>V°B° {{ $institution?->department_name ?? 'Subgerencia de Parques y Jardines' }}</span>
            </div>
        </div>
        @if ($institution?->document_footer)
            <p style="margin-top: 22px; color: #64748b; font-size: 10px; text-align: center;">{{ $institution->document_footer }}</p>
        @endif
    </div>

</body>
</html>
