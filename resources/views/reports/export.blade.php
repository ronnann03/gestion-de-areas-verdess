<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }}</title>
    <style>
        @page { margin: 22mm 12mm 18mm; }
        * { box-sizing: border-box; }
        body { margin: 0; color: #1e293b; font-family: "DejaVu Sans", Arial, sans-serif; font-size: 9px; }
        .toolbar { margin-bottom: 16px; display: flex; gap: 8px; }
        .toolbar button { border: 0; border-radius: 6px; background: #059669; color: white; cursor: pointer; padding: 9px 14px; font-weight: 700; }
        .toolbar .secondary { background: #475569; }
        .header { border-bottom: 3px solid #059669; margin-bottom: 14px; padding-bottom: 10px; }
        .eyebrow { color: #059669; font-size: 9px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
        h1 { color: #0f172a; font-size: 19px; margin: 5px 0 3px; }
        .meta { color: #64748b; }
        table { border-collapse: collapse; table-layout: auto; width: 100%; }
        thead { display: table-header-group; }
        tr { page-break-inside: avoid; }
        th { background: #064e3b; color: white; font-size: 8px; letter-spacing: .03em; padding: 7px 5px; text-align: left; text-transform: uppercase; }
        td { border-bottom: 1px solid #cbd5e1; padding: 6px 5px; vertical-align: top; }
        tbody tr:nth-child(even) { background: #f8fafc; }
        .empty { border: 1px solid #cbd5e1; color: #64748b; padding: 25px; text-align: center; }
        .footer { bottom: -12mm; color: #64748b; font-size: 8px; left: 0; position: fixed; right: 0; text-align: center; }
        .page-number:after { content: counter(page); }
        @media print {
            .toolbar { display: none; }
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    @if ($printable)
        <div class="toolbar">
            <button type="button" onclick="window.print()">Imprimir o guardar como PDF</button>
            <button type="button" class="secondary" onclick="window.close()">Cerrar</button>
        </div>
    @endif

    <header class="header">
        <div class="eyebrow">{{ $institution?->municipality_name ?? 'Municipalidad Distrital de Nuevo Chimbote' }}</div>
        <h1>{{ $title }}</h1>
        <div class="meta">{{ $institution?->department_name ?? 'Sistema de Gestión de Áreas Verdes' }} · Generado el {{ $generatedAt }}</div>
    </header>

    @if (count($rows))
        <table>
            <thead>
                <tr>
                    @foreach ($headers as $header)
                        <th>{{ $header }}</th>
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @foreach ($rows as $row)
                    <tr>
                        @foreach ($row as $value)
                            <td>{{ $value === null || $value === '' ? '-' : $value }}</td>
                        @endforeach
                    </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <div class="empty">No existen registros para los criterios seleccionados.</div>
    @endif

    <footer class="footer">
        {{ $institution?->document_footer ?? 'Reporte referencial del Sistema de Gestión de Áreas Verdes' }} · Página <span class="page-number"></span>
    </footer>
</body>
</html>
