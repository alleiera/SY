import { Column } from '../components/UniversalDataGrid';

const escapeXML = (str: any) => String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export const exportToCSV = (data: any[], cols: Column[]) => {
    const c = cols.filter(x => x.visible !== false && x.type !== 'checkbox');
    const h = c.map(x => `"${x.headerName}"`).join(',');
    const r = data.map(d => c.map(x => `"${String(d[x.field] ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const b = new Blob([`\uFEFF${h}\n${r}`], { type: 'text/csv;charset=utf-8;' });
    const l = document.createElement('a');
    l.href = URL.createObjectURL(b);
    l.download = 'export.csv';
    l.click();
};

export const exportToTXT = (data: any[], cols: Column[]) => {
    const c = cols.filter(x => x.visible !== false && x.type !== 'checkbox');
    let t = c.map(x => x.headerName).join(', ') + '\n';
    t += data.map(d => c.map(x => String(d[x.field] ?? '')).join(', ')).join('\n');
    const b = new Blob([t], { type: 'text/plain;charset=utf-8;' });
    const l = document.createElement('a');
    l.href = URL.createObjectURL(b);
    l.download = 'export.txt';
    l.click();
};

export const exportToXML = (data: any[], cols: Column[]) => {
    const c = cols.filter(x => x.visible !== false && x.type !== 'checkbox');
    let x = '<?xml version="1.0" encoding="UTF-8"?>\n<rows>\n';
    data.forEach(r => {
        x += '  <row>\n';
        c.forEach(k => {
            x += `    <${k.field}>${escapeXML(r[k.field])}</${k.field}>\n`;
        });
        x += '  </row>\n';
    });
    x += '</rows>';
    const b = new Blob([x], { type: 'application/xml' });
    const l = document.createElement('a');
    l.href = URL.createObjectURL(b);
    l.download = 'export.xml';
    l.click();
};

export const exportToExcel = (data: any[], cols: Column[]) => {
    const c = cols.filter(x => x.visible !== false && x.type !== 'checkbox');
    let x = '<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40">\n <Worksheet ss:Name="Sheet1">\n  <Table>\n   <Row>\n';
    c.forEach(k => {
        x += `    <Cell><Data ss:Type="String">${escapeXML(k.headerName)}</Data></Cell>\n`;
    });
    x += '   </Row>\n';
    data.forEach(r => {
        x += '   <Row>\n';
        c.forEach(k => {
            const v = r[k.field];
            const t = typeof v === 'number' ? 'Number' : 'String';
            x += `    <Cell><Data ss:Type="${t}">${escapeXML(v)}</Data></Cell>\n`;
        });
        x += '   </Row>\n';
    });
    x += '  </Table>\n </Worksheet>\n</Workbook>';
    const b = new Blob([x], { type: 'application/vnd.ms-excel' });
    const l = document.createElement('a');
    l.href = URL.createObjectURL(b);
    l.download = 'export.xls';
    l.click();
};

export const printGrid = (data: any[], cols: Column[]) => {
    const w = window.open('', '', 'height=600,width=800');
    if (!w) return;
    const c = cols.filter(x => x.visible !== false && x.type !== 'checkbox');
    let h = `<html><head><title>Print</title><style>table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px}th{background:#eee}</style></head><body><h1>Grid Export</h1><table><thead><tr>${c.map(x => `<th>${x.headerName}</th>`).join('')}</tr></thead><tbody>`;
    data.forEach(r => {
        if (r.isGroup) return;
        h += '<tr>';
        c.forEach(k => {
            h += `<td>${r[k.field]}</td>`;
        });
        h += '</tr>';
    });
    h += '</tbody></table><script>window.onload=()=>{window.print();window.close()}<\/script></body></html>';
    w.document.write(h);
    w.document.close();
};
