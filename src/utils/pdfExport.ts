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
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // --- Estilo Femenino y Premium (Paleta All U Moves) ---
        const brandColor = [190, 24, 93]; // Pink 700
        const brandLight = [252, 231, 243]; // Pink 100
        const brandText = [88, 28, 135]; // Purple 900
        const secondaryText = [130, 130, 130]; // Gray

        // 1. Decorative Header (Franja superior)
        doc.setFillColor(brandColor[0], brandColor[1], brandColor[2]);
        doc.rect(0, 0, pageWidth, 15, 'F'); // Top bar

        // Logo placeholder or App Name
        doc.setFontSize(16);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('All U Moves - Kinesiología Pélvica', 14, 10);

        // 2. Title & Info
        doc.setFontSize(24);
        doc.setTextColor(brandText[0], brandText[1], brandText[2]);
        doc.setFont('times', 'bold'); // Serif font for elegance
        doc.text('Reporte de Progreso', 14, 35);

        // Line separator
        doc.setDrawColor(brandColor[0], brandColor[1], brandColor[2]);
        doc.setLineWidth(0.5);
        doc.line(14, 40, 100, 40);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(secondaryText[0], secondaryText[1], secondaryText[2]);

        doc.text('Usuaria:', 14, 50);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(brandText[0], brandText[1], brandText[2]);
        doc.text(patientName, 32, 50);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(secondaryText[0], secondaryText[1], secondaryText[2]);
        doc.text('Fecha:', 14, 56);
        doc.text(new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), 32, 56);

        let nextY = 65;

        // 3. Chart Capture
        const chartElement = document.getElementById(chartId);
        if (chartElement) {
            // Title for Chart
            doc.setFontSize(12);
            doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
            doc.setFont('helvetica', 'bold');
            doc.text('Evolución Gráfica', 14, nextY);
            nextY += 5;

            // Capture with high scale
            const canvas = await html2canvas(chartElement, {
                scale: 3, // Higher resolution
                backgroundColor: '#ffffff',
                logging: false
            });
            const imgData = canvas.toDataURL('image/png');
            const imgProps = doc.getImageProperties(imgData);
            const pdfWidth = pageWidth - 28;
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            // Add a subtle border/shadow effect logic (simple rect behind)
            doc.setDrawColor(240, 240, 240);
            doc.rect(13, nextY - 1, pdfWidth + 2, pdfHeight + 2);

            doc.addImage(imgData, 'PNG', 14, nextY, pdfWidth, pdfHeight);
            nextY += pdfHeight + 15;
        }

        // 4. Table Data
        doc.setFontSize(12);
        doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('Detalle de Sesiones', 14, nextY);
        nextY += 5;

        const tableBody = history
            .filter(item => {
                if (!item.date) return false;
                return item.raw?.symptomsScore !== undefined || item.raw?.pelvic?.oxford !== undefined || item.raw?.proms?.sane !== undefined;
            })
            .sort((a, b) => {
                const getDateMillis = (d: any) => d.toMillis ? d.toMillis() : (d instanceof Date ? d.getTime() : new Date(d).getTime());
                return getDateMillis(b.date) - getDateMillis(a.date);
            })
            .map(item => {
                const dateObj = item.date.toDate ? item.date.toDate() : (item.date instanceof Date ? item.date : new Date(item.date));
                const date = dateObj.toLocaleDateString('es-CL');
                const eva = item.raw?.symptomsScore ?? '-';
                const oxford = item.raw?.reassessment?.oxford ?? item.raw?.pelvic?.oxford ?? '-';
                const sane = item.raw?.proms?.sane ? `${item.raw.proms.sane}%` : '-';
                const psfs = item.raw?.reassessment?.psfs?.map((p: any) => p.score).join(', ') || '-';

                return [date, eva, oxford, sane, psfs];
            });

        autoTable(doc, {
            startY: nextY,
            head: [['Fecha', 'Dolor (EVA)', 'Fuerza', 'SANE %', 'PSFS']],
            body: tableBody,
            theme: 'grid',
            headStyles: {
                fillColor: brandColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center'
            },
            styles: {
                fontSize: 10,
                cellPadding: 4,
                textColor: [60, 60, 60],
                lineColor: [245, 245, 245],
                lineWidth: 0.1
            },
            columnStyles: {
                0: { fontStyle: 'bold' }, // Date
                1: { halign: 'center' },
                2: { halign: 'center' },
                3: { halign: 'center' }
            },
            alternateRowStyles: {
                fillColor: brandLight
            }
        });

        // 5. Professional Footer
        const footerY = pageHeight - 20;
        doc.setDrawColor(brandColor[0], brandColor[1], brandColor[2]);
        doc.line(14, footerY, pageWidth - 14, footerY);

        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text('Klga. Fernanda Allendes - Especialista en Piso Pélvico', 14, footerY + 5);
        doc.text('Reg. Colegio Kinesiólogos: 12345 | Contacto: fernanda@allumoves.cl', 14, footerY + 9);
        doc.text(`Generado el ${new Date().toLocaleDateString('es-CL')} - All U Moves App`, pageWidth - 14, footerY + 5, { align: 'right' });

        // Save
        doc.save(`Progreso_${patientName.replace(/\s+/g, '_')}.pdf`);
        return true;

    } catch (error) {
        console.error("Error generating PDF", error);
        throw error;
    }
};
