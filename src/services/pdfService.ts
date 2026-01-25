
import jsPDF from 'jspdf';
import { Patient } from '../types/patient';
import { REPORT_ASSETS } from '../assets/reportAssets';

export const pdfService = {
    generatePatientReport(patient: Patient, evaluation: any) {
        const doc = new jsPDF();
        this._applyDesign(doc, patient, evaluation, "Resumen para la usuaria", true);
    },

    generateClinicalRecord(patient: Patient, evaluation: any) {
        const doc = new jsPDF();
        this._applyDesign(doc, patient, evaluation, "Ficha Clínica Kinesiológica", false);
    },

    _applyDesign(doc: jsPDF, patient: Patient, evaluation: any, title: string, isSimpleReport: boolean) {
        // --- Config ---
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);

        // --- Background ---
        doc.setFillColor(253, 251, 247); // #FDFBF7 (Beige)
        doc.rect(0, 0, pageWidth, pageHeight, "F");

        // --- Header ---
        // Title
        doc.setFontSize(22);
        doc.setTextColor(30, 41, 59); // Dark Slate
        doc.setFont("helvetica", "bold");
        doc.text(title, margin, margin + 10);

        // Subtitle line
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139); // Slate 500
        const dateStr = new Date(evaluation.date?.seconds * 1000 || Date.now()).toLocaleDateString();
        doc.text(`Nombre: ${patient.firstName} ${patient.lastName} · Fecha: ${dateStr}`, margin, margin + 18);

        // Line Separator
        doc.setDrawColor(226, 232, 240); // Slate 200
        doc.line(margin, margin + 25, pageWidth - margin, margin + 25);

        // --- Round Logo (Top Right) ---
        this._drawCircularImage(doc, REPORT_ASSETS.logo, pageWidth - margin - 25, margin - 5, 12.5);

        let currentY = 60;

        if (isSimpleReport) {
            // ==================== SIMPLE REPORT ====================

            // --- Section: Próxima Sesión ---
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 41, 59);
            doc.text("Próxima sesión", margin, currentY);
            doc.setDrawColor(234, 88, 12); // Orange/Red accent
            doc.setLineWidth(0.5);
            doc.line(margin, currentY + 2, margin + 35, currentY + 2);
            currentY += 15;

            // --- Box: Tasks ---
            const boxTop = currentY;
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(226, 232, 240);
            doc.roundedRect(margin, currentY, contentWidth, 80, 5, 5, "FD");
            currentY += 15;
            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(51, 65, 85);

            const tasks = evaluation.plan?.tasks || [];
            const education = evaluation.plan?.education || [];
            const allItems = [...tasks, ...education];

            if (allItems.length === 0) {
                doc.text("No hay tareas específicas asignadas para esta sesión.", margin + 10, currentY);
            } else {
                allItems.forEach((item: string, index: number) => {
                    if (index > 4) return;
                    doc.setDrawColor(71, 85, 105);
                    doc.rect(margin + 10, currentY - 4, 4, 4);
                    doc.text(item, margin + 20, currentY);
                    currentY += 12;
                });
            }

            currentY = boxTop + 95;

            // --- Section: Señales para avisar ---
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 41, 59);
            doc.text("Señales para avisar", margin, currentY);
            doc.setDrawColor(234, 88, 12);
            doc.line(margin, currentY + 2, margin + 40, currentY + 2);
            currentY += 10;

            // Warning Box
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(226, 232, 240);
            doc.roundedRect(margin, currentY, contentWidth, 40, 5, 5, "FD");

            const iconY = currentY + 12;
            doc.setFillColor(239, 68, 68);
            doc.circle(margin + 12, iconY, 4, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.text("!", margin + 11, iconY + 1.5);

            doc.setTextColor(71, 85, 105);
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            const warningText = "Avisar/consultar si aparece: fiebre + dolor pélvico o urinario, hematuria visible, retención urinaria, sangrado anormal importante.";
            const splitWarning = doc.splitTextToSize(warningText, contentWidth - 30);
            doc.text(splitWarning, margin + 25, iconY);

        } else {
            // ==================== CLINICAL RECORD ====================

            // --- Summary ---
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 41, 59);
            doc.text("Resumen General", margin, currentY);
            currentY += 7;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(51, 65, 85);
            const summary = doc.splitTextToSize(evaluation.summary || "Sin resumen", contentWidth);
            doc.text(summary, margin, currentY);
            currentY += summary.length * 5 + 10;

            // --- Details (Anamnesis) ---
            if (evaluation.details?.anamnesis) {
                doc.setFontSize(12);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(30, 41, 59);
                doc.text("Anamnesis & Motivo", margin, currentY);
                currentY += 7;
                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
                const hText = doc.splitTextToSize(`Motivo: ${evaluation.details.anamnesis.motive}\nHistoria: ${evaluation.details.anamnesis.history}`, contentWidth);
                doc.text(hText, margin, currentY);
                currentY += hText.length * 5 + 10;
            }

            // --- Pelvic ---
            if (evaluation.details?.pelvic) {
                doc.setFontSize(12);
                doc.setFont("helvetica", "bold");
                doc.text("Evaluación Suelo Pélvico", margin, currentY);
                currentY += 7;
                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
                const p = evaluation.details.pelvic;
                const pText = `Piel: ${p.skin} | Hiato: ${p.hiatus}\nFuerza (Oxford): ${p.oxford}/5\nMapa Dolor: ${p.painMap}`;
                doc.text(pText, margin, currentY);
            }
        }

        // --- Footer (Common) ---
        const footerY = 240;
        doc.setDrawColor(234, 231, 225);
        doc.line(margin, footerY, pageWidth - margin, footerY);
        const infoY = footerY + 10;

        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "bold");
        doc.text("Profesional", margin, infoY);

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Fernanda Rojas Cruz — Kinesióloga especialista en piso pélvico", margin, infoY + 7);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text("RUT 19.670.038-2 · Registro 727918", margin, infoY + 13);
        doc.text("Klga.fernandarojascruz@gmail.com · @Kinefer", margin, infoY + 18);
        doc.text("Firma: _________________________", margin, infoY + 28);

        // --- Round Photo (Bottom Right) ---
        this._drawCircularImage(doc, REPORT_ASSETS.photo, pageWidth - margin - 25, footerY + 5, 12.5);

        const filename = isSimpleReport
            ? `Reporte_${patient.firstName}.pdf`
            : `Ficha_${patient.rut}.pdf`;
        doc.save(filename);
    },

    _drawCircularImage(doc: any, imgData: string, x: number, y: number, r: number) {
        try {
            if (!imgData) return;
            const diam = r * 2;
            doc.saveGraphicsState();
            // Use roundedRect with radius == width/2 to force a circle intersection
            // roundedRect(x, y, w, h, rx, ry, style)
            // style null = path only
            doc.roundedRect(x, y, diam, diam, r, r, null);
            doc.clip();
            doc.addImage(imgData, 'PNG', x, y, diam, diam);
            doc.restoreGraphicsState();
        } catch (e) {
            console.error("Circle Draw Error", e);
            // Safe fallback
            doc.addImage(imgData, 'PNG', x, y, r * 2, r * 2);
        }
    }
};
