import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

export const generateProgressReport = async (
    patientName: string,
    history: any[],
    chartId: string
) => {
    try {
        const doc = new jsPDF();

        // 1. Header
        doc.setFontSize(22);
        doc.setTextColor(44, 62, 80); // Brand Dark
        doc.text('Reporte de Progreso', 14, 20);

        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`Usuaria: ${patientName}`, 14, 30);
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, 14, 36);

        // 2. Chart Capture
        const chartElement = document.getElementById(chartId);
        if (chartElement) {
            // Wait a moment for any animations to settle if needed, or just capture
            const canvas = await html2canvas(chartElement, {
                scale: 2, // Higher quality
                backgroundColor: '#ffffff'
            });
            const imgData = canvas.toDataURL('image/png');
            const imgProps = doc.getImageProperties(imgData);
            const pdfWidth = doc.internal.pageSize.getWidth() - 28;
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            doc.addImage(imgData, 'PNG', 14, 45, pdfWidth, pdfHeight);

            // Move cursor down
            var nextY = 45 + pdfHeight + 10;
        } else {
            var nextY = 50;
        }

        // 3. Table Data
        // Prepare data (reuse logic from Modal/Chart ideally, simplified here)
        const tableBody = history
            .filter(item => {
                if (!item.date) return false;
                // Basic filter for items with data
                const hasData = item.raw?.symptomsScore !== undefined || item.raw?.pelvic?.oxford !== undefined || item.raw?.proms?.sane !== undefined;
                return hasData;
            })
            .sort((a, b) => b.date.toMillis() - a.date.toMillis())
            .map(item => {
                const date = item.date.toDate().toLocaleDateString('es-CL');
                const eva = item.raw?.symptomsScore ?? '-';
                const oxford = item.raw?.reassessment?.oxford ?? item.raw?.pelvic?.oxford ?? '-';
                const sane = item.raw?.proms?.sane ? `${item.raw.proms.sane}%` : '-';

                return [date, eva, oxford, sane];
            });

        autoTable(doc, {
            startY: nextY,
            head: [['Fecha', 'Dolor (EVA)', 'Fuerza (Oxford)', 'SANE']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [66, 133, 244] }, // Brand Blue-ish
            styles: { fontSize: 10 },
        });

        // 4. Save
        doc.save(`Progreso_${patientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
        return true;

    } catch (error) {
        console.error("Error generating PDF", error);
        throw error;
    }
};
