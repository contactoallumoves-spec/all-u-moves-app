import { Appointment } from '../types/appointment';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly';
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

let accessToken: string | null = null;

declare global {
    interface Window {
        google: any;
    }
}

function loadGisScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (window.google?.accounts?.oauth2) { resolve(); return; }
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('No se pudo cargar Google Identity Services'));
        document.head.appendChild(script);
    });
}

export const calendarService = {
    isConfigured(): boolean {
        return !!CLIENT_ID && CLIENT_ID !== 'TU_CLIENT_ID_GOOGLE_AQUI';
    },

    isConnected(): boolean {
        return !!accessToken;
    },

    async connect(): Promise<void> {
        if (!this.isConfigured()) {
            throw new Error('Google Client ID no configurado. Revisa el archivo .env.local');
        }
        await loadGisScript();

        return new Promise((resolve, reject) => {
            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: (response: any) => {
                    if (response.error) { reject(new Error(response.error)); return; }
                    accessToken = response.access_token;
                    resolve();
                }
            });
            client.requestAccessToken();
        });
    },

    disconnect() {
        accessToken = null;
    },

    async fetchEvents(daysAhead = 30): Promise<any[]> {
        if (!accessToken) throw new Error('No conectado a Google Calendar');
        const now = new Date().toISOString();
        const end = new Date(Date.now() + daysAhead * 86400000).toISOString();
        const url = `${CALENDAR_API}/calendars/primary/events?timeMin=${now}&timeMax=${end}&singleEvents=true&orderBy=startTime&maxResults=100`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
        if (!res.ok) throw new Error(`Error al leer Google Calendar: ${res.status}`);
        const data = await res.json();
        return data.items || [];
    },

    async createEvent(appt: Appointment): Promise<string> {
        if (!accessToken) throw new Error('No conectado a Google Calendar');

        const [year, month, day] = appt.date.split('-').map(Number);
        const [hours, minutes] = appt.time.split(':').map(Number);
        const start = new Date(year, month - 1, day, hours, minutes);
        const end = new Date(start.getTime() + appt.durationMinutes * 60000);

        const event = {
            summary: `Kine: ${appt.patientName}`,
            description: `Tipo: ${appt.type}\n${appt.notes || ''}`,
            start: { dateTime: start.toISOString(), timeZone: 'America/Santiago' },
            end: { dateTime: end.toISOString(), timeZone: 'America/Santiago' },
            reminders: {
                useDefault: false,
                overrides: [{ method: 'popup', minutes: 60 }]
            }
        };

        const res = await fetch(`${CALENDAR_API}/calendars/primary/events`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(event)
        });
        if (!res.ok) throw new Error(`Error al crear evento: ${res.status}`);
        const data = await res.json();
        return data.id;
    },

    async deleteEvent(eventId: string): Promise<void> {
        if (!accessToken) return;
        await fetch(`${CALENDAR_API}/calendars/primary/events/${eventId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` }
        });
    },

    buildCalendarLink(appt: Appointment): string {
        const [year, month, day] = appt.date.split('-').map(Number);
        const [hours, minutes] = appt.time.split(':').map(Number);
        const start = new Date(year, month - 1, day, hours, minutes);
        const end = new Date(start.getTime() + appt.durationMinutes * 60000);

        const fmt = (d: Date) =>
            d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: `Kinesiología: ${appt.patientName}`,
            dates: `${fmt(start)}/${fmt(end)}`,
            details: `Tipo: ${appt.type}. ${appt.notes || ''}`,
            location: 'Allufem'
        });

        return `https://calendar.google.com/calendar/render?${params.toString()}`;
    },

    buildWhatsAppLink(appt: Appointment, phone?: string): string {
        if (!phone) return '';
        const cleaned = phone.replace(/\D/g, '');
        const withCountry = cleaned.startsWith('56') ? cleaned : `56${cleaned}`;

        const [year, month, day] = appt.date.split('-').map(Number);
        const dateLabel = new Date(year, month - 1, day).toLocaleDateString('es-CL', {
            weekday: 'long', day: 'numeric', month: 'long'
        });

        const confirmUrl = appt.id ? `${window.location.origin}/confirmar/${appt.id}` : '';
        const message = confirmUrl
            ? `Hola ${appt.patientName} 👋, te recuerdo tu sesión de kinesiología el *${dateLabel}* a las *${appt.time}*.\n\nConfirma tu asistencia con un toque aquí 👉 ${confirmUrl}\n\n¡Muchas gracias!`
            : `Hola ${appt.patientName} 👋, te recuerdo tu sesión de kinesiología el *${dateLabel}* a las *${appt.time}*. Por favor confirma tu asistencia respondiendo este mensaje. ¡Muchas gracias!`;

        return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
    }
};
