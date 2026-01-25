
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Patient } from '../types/patient';


export const pdfService = {
    generatePatientReport(patient: Patient, evaluation: any) {
        const doc = new jsPDF();

        // --- Branding ---
        doc.setFillColor(255, 248, 246); // Brand background light
        doc.rect(0, 0, 210, 297, "F");

        doc.setFontSize(22);
        doc.setTextColor(88, 28, 135); // Brand Purple
        doc.setFont("helvetica", "bold");
        doc.text("All U Moves", 20, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("Salud Integral de la Mujer", 20, 26);

        // --- Header Info ---
        doc.setDrawColor(200);
        doc.line(20, 30, 190, 30);

        doc.setFontSize(12);
        doc.setTextColor(50);
        doc.text(`Paciente: ${patient.firstName} ${patient.lastName}`, 20, 40);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 150, 40);

        // --- Summary Section ---
        doc.setFontSize(14);
        doc.setTextColor(88, 28, 135);
        doc.text("Resumen de tu Evaluación", 20, 55);

        doc.setFontSize(11);
        doc.setTextColor(0);
        const splitSummary = doc.splitTextToSize(evaluation.summary || "Sin resumen disponible.", 170);
        doc.text(splitSummary, 20, 65);

        let currentY = 65 + (splitSummary.length * 7) + 10;

        // --- Plan / Tasks ---
        // Check if we have plan data
        if (evaluation.plan) {
            doc.setFontSize(14);
            doc.setTextColor(88, 28, 135);
            doc.text("Tu Plan de Acción", 20, currentY);
            currentY += 10;

            const tasks = evaluation.plan.tasks || [];
            const education = evaluation.plan.education || [];

            const rows = [
                ...tasks.map((t: string) => ['Tarea', t]),
                ...education.map((e: string) => ['Educación', e])
            ];

            if (rows.length > 0) {
                autoTable(doc, {
                    startY: currentY,
                    head: [['Tipo', 'Descripción']],
                    body: rows,
                    theme: 'grid',
                    headStyles: { fillColor: [88, 28, 135] }
                });
            } else {
                doc.setFontSize(10);
                doc.setTextColor(100);
                doc.text("No hay tareas asignadas por el momento.", 20, currentY);
            }
        }

        // Footer
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text("Generado por All U Moves App - Kinesiología Pélvica", 105, 280, { align: "center" });

        doc.save(`Ficha_${patient.lastName}_${patient.firstName}.pdf`);
    },

    generateClinicalRecord(patient: Patient, evaluation: any) {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Ficha Clínica Kinesiológica", 20, 20);

        doc.setFontSize(10);
        doc.text(`ID: ${patient.rut}`, 20, 30);
        doc.text(`Nombre: ${patient.firstName} ${patient.lastName}`, 20, 35);
        doc.text(`Fecha Eval: ${new Date(evaluation.date?.seconds * 1000 || Date.now()).toLocaleDateString()}`, 20, 40);

        let y = 55;

        // Section: Anamnesis
        if (evaluation.details?.anamnesis) {
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Anamnesis", 20, y);
            y += 7;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);

            const motive = doc.splitTextToSize(`Motivo: ${evaluation.details.anamnesis.motive}`, 170);
            doc.text(motive, 20, y);
            y += motive.length * 5 + 5;

            const history = doc.splitTextToSize(`Historia: ${evaluation.details.anamnesis.history}`, 170);
            doc.text(history, 20, y);
            y += history.length * 5 + 10;
        }

        // Section: Pelvic Floor
        if (evaluation.details?.pelvic) {
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Suelo Pélvico", 20, y);
            y += 7;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);

            const p = evaluation.details.pelvic;
            const rows = [
                ['Piel', p.skin],
                ['Hiato', p.hiatus],
                ['Oxford', `${p.oxford}/5`],
                ['Mapa Dolor', p.painMap]
            ];

            autoTable(doc, {
                startY: y,
                body: rows,
                theme: 'plain',
            });

            y = (doc as any).lastAutoTable.finalY + 10;
        }

        // Section: Diagnosis
        if (evaluation.plan) {
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Diagnóstico & Plan", 20, y);
            y += 7;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);

            // Check if details.plan exists (Complete Mode) or just top level plan
            const diag = evaluation.details?.plan?.diagnosis || evaluation.summary;
            const text = doc.splitTextToSize(`Dx: ${diag}`, 170);
            doc.text(text, 20, y);
        }

        doc.save(`Clinico_${patient.rut}_${new Date().toISOString().split('T')[0]}.pdf`);
    }
};
