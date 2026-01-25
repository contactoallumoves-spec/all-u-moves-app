
import jsPDF from 'jspdf';
import { Patient } from '../types/patient';
import { REPORT_ASSETS } from '../assets/reportAssets';

export const pdfService = {
    generatePatientReport(patient: Patient, evaluation: any) {
        const doc = new jsPDF();
        this._applyDesign(doc, patient, evaluation, "Resumen de tu Sesión", true);
    },

    generateClinicalRecord(patient: Patient, evaluation: any) {
        const doc = new jsPDF();
        this._applyDesign(doc, patient, evaluation, "Ficha Clínica", false);
    },

    _applyDesign(doc: jsPDF, patient: Patient, evaluation: any, title: string, isSimpleReport: boolean) {
        // --- Palette ---
        const colors = {
            bg: [253, 251, 247], // #FDFBF7
            text: [70, 70, 85],  // Soft Dark
            primary: [88, 28, 135], // Brand Purple
            accent: [243, 232, 255], // Light Purple bg
            highlight: [217, 70, 239] // Fuchsia/Pink accent
        };

        const w = 210; // A4
        const h = 297;
        const margin = 20;

        // Background
        doc.setFillColor(colors.bg[0], colors.bg[1], colors.bg[2]);
        doc.rect(0, 0, w, h, "F");

        // --- Header Section ---
        // Top Accent Bar (Gradient-ish via lines? or just solid)
        // Let's keep it clean. Just a modern header.

        // Logo (Top Right)
        // Using "Thick Border Mask" Hack for perfect circle on solid bg
        const logoSize = 30;
        const logoX = w - margin - logoSize;
        const logoY = margin - 5;
        this._drawCircularImage(doc, REPORT_ASSETS.logo, logoX, logoY, logoSize, colors.bg);

        // Title Group
        doc.setFont("helvetica", "bold");
        doc.setFontSize(24);
        doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.text(title, margin, margin + 10);

        // Date & Patient
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(120, 120, 140);
        const dateStr = new Date(evaluation.date?.seconds * 1000 || Date.now()).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
        doc.text(dateStr, margin, margin + 18);
        doc.setFontSize(14);
        doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
        doc.text(`${patient.firstName} ${patient.lastName}`, margin, margin + 26);

        // Modern Divider
        doc.setDrawColor(230, 230, 235);
        doc.setLineWidth(0.5);
        doc.line(margin, margin + 35, w - margin, margin + 35);


        let y = margin + 50;

        if (isSimpleReport) {
            // === Modern Report Content ===

            // "Next Session" Pill
            doc.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
            doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
            doc.roundedRect(margin, y, 120, 14, 7, 7, "F");

            doc.setFontSize(10);
            doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
            doc.setFont("helvetica", "bold");
            doc.text("🎯 PRÓXIMA SESIÓN", margin + 5, y + 10);

            y += 25;

            // Tasks Container (Card Style)
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(240, 240, 245);
            doc.roundedRect(margin, y, w - (margin * 2), 90, 6, 6, "FD");

            doc.setFontSize(12);
            doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
            doc.setFont("helvetica", "bold");
            doc.text("Plan de tareas en casa", margin + 8, y + 12);

            y += 20;
            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");

            const tasks = evaluation.plan?.tasks || [];

            if (tasks.length === 0) {
                doc.setTextColor(150, 150, 160);
                doc.text("• Disfruta tu descanso, no hay tareas hoy. :)", margin + 12, y);
            } else {
                tasks.slice(0, 5).forEach((t: string) => {
                    doc.setTextColor(colors.highlight[0], colors.highlight[1], colors.highlight[2]);
                    doc.text("•", margin + 8, y);
                    doc.setTextColor(80, 80, 90);
                    doc.text(t, margin + 15, y);
                    y += 10;
                });
            }

            y = margin + 50 + 90 + 20;

            // Warning/Alert Section
            doc.setFillColor(254, 242, 242); // Light Red bg
            doc.setDrawColor(252, 165, 165); // Red border
            doc.roundedRect(margin, y, w - (margin * 2), 35, 4, 4, "FD");

            // Icon
            doc.setFillColor(239, 68, 68);
            doc.circle(margin + 12, y + 10, 3, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.text("!", margin + 11.2, y + 11);

            doc.setFontSize(10);
            doc.setTextColor(185, 28, 28);
            doc.text("Señales de alerta", margin + 20, y + 10);

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(127, 29, 29);
            const alertText = "Consulta si presentas: fiebre, dolor pélvico intenso, sangrado anormal o problemas urinarios severos.";
            doc.text(alertText, margin + 20, y + 20, { maxWidth: w - (margin * 2) - 30 });

        } else {
            // === Clinical Record Content ===
            doc.setFontSize(11);
            doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);

            const summary = doc.splitTextToSize(evaluation.summary || "Sin observaciones", w - (margin * 2));
            doc.text(summary, margin, y);
            y += (summary.length * 6) + 10;

            // Data Grid
            const p = evaluation.details?.pelvic || {};
            const data = [
                ["Oxford (Fuerza)", `${p.oxford || '-'}/5`],
                ["Hiato Urogenital", p.hiatus || '-'],
                ["Puntos Gatillo", p.painMap || 'Sin dolor']
            ];

            data.forEach(([label, val]) => {
                doc.setFont("helvetica", "bold");
                doc.text(`${label}:`, margin, y);
                doc.setFont("helvetica", "normal");
                doc.text(String(val), margin + 40, y);
                y += 8;
            });
        }

        // --- Footer (Modern & Clean) ---
        const footerH = 40;
        const footerY = h - footerH - margin;

        // Decorative line
        doc.setDrawColor(colors.accent[0], colors.accent[1], colors.accent[2]);
        doc.setLineWidth(2);
        doc.line(margin, footerY, margin + 10, footerY); // Small dash

        // Text Info
        const infoX = margin;
        const infoY = footerY + 10;

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
        doc.text("Fernanda Rojas Cruz", infoX, infoY);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(150, 150, 160);
        doc.text("Kinesióloga Salud de la Mujer", infoX, infoY + 5);
        doc.text("Reg. 727918 · @Kinefer", infoX, infoY + 10);

        // Photo (Right Alignment)
        // Using same mask trick
        const photoSize = 35;
        this._drawCircularImage(doc, REPORT_ASSETS.photo, w - margin - photoSize, footerY - 5, photoSize, colors.bg);

        doc.save(`${isSimpleReport ? 'Reporte' : 'Ficha'}_${patient.firstName}.pdf`);
    },

    // Robust Round Image using "Donut Mask" technique
    // Draws image (square) then draws a thick border matching bg color to hide corners
    _drawCircularImage(doc: any, img: string, x: number, y: number, size: number, bgColor: number[]) {
        if (!img) return;
        try {
            // 1. Draw Image
            doc.addImage(img, 'PNG', x, y, size, size);

            // 2. Draw Mask (Thick stroke circle matching BG)
            const r = size / 2;
            const cx = x + r;
            const cy = y + r;

            // Calculate thick stroke to cover the corners
            // Corner distance from center is r * sqrt(2) approx 1.414 * r
            // We need to cover from r to corner.
            // Stroke width should be large enough.
            const strokeWidth = r; // Generous width

            // To mask effectively, we draw a circle at radius r + (strokeWidth/2)
            // wait, stroke is centered on path. 
            // If we want inner edge at r, and strokeWidth w.
            // Center of stroke should be at r + w/2.

            doc.setDrawColor(bgColor[0], bgColor[1], bgColor[2]);
            doc.setLineWidth(strokeWidth);

            // Draw circle mask
            // Radius of the stroke path center
            const maskRadius = r + (strokeWidth / 2) - 0.5; // -0.5 to overlap slightly and avoid hairline gaps

            doc.circle(cx, cy, maskRadius, 'S');

            // Reset
            doc.setLineWidth(0.2); // Reset to default
            doc.setDrawColor(0);
        } catch (e) {
            console.error("Img error", e);
        }
    }
};
