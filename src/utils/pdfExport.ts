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

        // --- Estilo Moderno y Minimalista ---
        // Paleta Soft & Clean
        // Paleta Soft & Clean
        const colors: { [key: string]: [number, number, number] } = {
            primary: [190, 24, 93],     // Pink 700 (Brand Accent)
            secondary: [161, 161, 170], // Gray 400 (Subtitles)
            text: [39, 39, 42],         // Zinc 800 (Main Text)
            lightBg: [253, 242, 248],   // Pink 50 (Very light wash)
            line: [228, 228, 231]       // Gray 200 (Dividers)
        };

        const setFont = (type: 'bold' | 'normal' | 'light', size: number, color: number[]) => {
            doc.setFont('helvetica', type);
            doc.setFontSize(size);
            doc.setTextColor(color[0], color[1], color[2]);
        };

        // 1. Header Minimalista
        // Logo (Text based for now, clean)
        setFont('bold', 18, colors.primary);
        doc.text('All U Moves', 14, 20);

        setFont('normal', 10, colors.secondary);
        doc.text('Kinesiología Pélvica Integral', 14, 26);

        // Date (Right aligned)
        const dateStr = new Date().toLocaleDateString('es-CL', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        doc.text(dateStr, pageWidth - 14, 20, { align: 'right' });

        // Divider
        doc.setDrawColor(colors.line[0], colors.line[1], colors.line[2]);
        doc.setLineWidth(0.5);
        doc.line(14, 32, pageWidth - 14, 32);

        // 2. Report Title & Patient
        let nextY = 50;

        setFont('bold', 22, colors.text);
        doc.text('Reporte de Progreso', 14, nextY);

        nextY += 12;
        setFont('normal', 12, colors.secondary);
        doc.text('Usuaria', 14, nextY);

        setFont('normal', 12, colors.text);
        doc.text(patientName, 35, nextY);

        nextY += 20;

        // 3. Chart Capture (Cleaner look)
        const chartElement = document.getElementById(chartId);
        if (chartElement) {
            setFont('bold', 14, colors.text);
            doc.text('Evolución Gráfica', 14, nextY);
            nextY += 8;

            const canvas = await html2canvas(chartElement, {
                scale: 4, // Higher resolution for crisp text
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true
            });
            const imgData = canvas.toDataURL('image/png');
            const imgProps = doc.getImageProperties(imgData);
            const pdfWidth = pageWidth - 28; // Full width minus margins
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            doc.addImage(imgData, 'PNG', 14, nextY, pdfWidth, pdfHeight);
            nextY += pdfHeight + 20;
        }

        // 4. Table Data (Minimalist)
        setFont('bold', 14, colors.text);
        doc.text('Detalle de Sesiones', 14, nextY);
        nextY += 5;

        // Filter and Sort Data
        const tableBody = history
            .filter(item => {
                if (!item.date) return false;
                // Include if any meaningful data exists
                return (item.raw?.symptomsScore !== undefined ||
                    item.raw?.pelvic?.oxford !== undefined ||
                    item.raw?.proms?.sane !== undefined) ||
                    (item.raw?.reassessment?.psfs && item.raw.reassessment.psfs.length > 0);
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

        // Correct implementation:
        autoTable(doc, {
            startY: nextY,
            head: [['Fecha', 'Dolor (EVA)', 'Fuerza', 'SANE %', 'PSFS']],
            body: tableBody,
            theme: 'grid', // gives us borders
            headStyles: {
                fillColor: [255, 255, 255],
                textColor: colors.primary,
                fontStyle: 'bold',
                halign: 'center',
                lineWidth: 0 // No border on header
            },
            styles: {
                fontSize: 10,
                cellPadding: 5,
                textColor: colors.text,
                lineColor: colors.line, // Very light gray borders
                lineWidth: 0.1,
                valign: 'middle'
            },
            alternateRowStyles: {
                fillColor: [255, 255, 255] // No alternating background for ultra clean look, or maybe very light?
                // Left white for "Minimalist"
            },
            columnStyles: {
                0: { fontStyle: 'bold', halign: 'left' },
                1: { halign: 'center' },
                2: { halign: 'center' },
                3: { halign: 'center' },
                4: { halign: 'left' }
            }
        });


        // 5. Professional Footer (Corrected)
        const footerY = pageHeight - 25;

        // Thin separator
        doc.setDrawColor(colors.line[0], colors.line[1], colors.line[2]);
        doc.line(14, footerY, pageWidth - 14, footerY);

        setFont('bold', 9, colors.text);
        doc.text('Fernanda Rojas Cruz', 14, footerY + 6);

        setFont('normal', 8, colors.secondary);
        doc.text('Kinesióloga especialista en piso pélvico y salud integral femenina', 14, footerY + 11);
        doc.text('Klga.fernandarojascruz@gmail.com', 14, footerY + 16);

        // Page Number / App Branding
        doc.text('Generado con All U Moves', pageWidth - 14, footerY + 16, { align: 'right' });

        // Save
        doc.save(`Progreso_${patientName.replace(/\s+/g, '_')}.pdf`);
        return true;

    } catch (error) {
        console.error("Error generating PDF", error);
        throw error;
    }
};
