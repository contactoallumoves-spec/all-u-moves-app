import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { SessionLog } from '../types/patient';
import { SessionLogService } from '../services/sessionLogService';

// --- State Types ---
interface SessionState {
    currentSessionId: string | null;
    logs: Record<string, SessionLog>; // Local WIP logs
    history: SessionLog | null; // Last completed session (Ghost Data)
    syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
    lastSaved: number | null;
}

// --- Actions ---
type Action =
    | { type: 'INIT_SESSION'; payload: { sessionId: string; patientId: string } }
    | { type: 'UPDATE_SET'; payload: { sessionId: string; exerciseId: string; instanceId?: string; setIndex: number; data: any } }
    | { type: 'UPDATE_EXERCISE'; payload: { sessionId: string; exerciseId: string; instanceId?: string; data: any } }
    | { type: 'MARK_COMPLETED'; payload: { sessionId: string; exerciseId: string; instanceId?: string; completed: boolean } }
    | { type: 'SET_SYNC_STATUS'; payload: 'synced' | 'syncing' | 'offline' | 'error' }
    | { type: 'LOAD_FROM_STORAGE'; payload: SessionState }
    | { type: 'SET_HISTORY'; payload: SessionLog | null }
    | { type: 'UPDATE_FEEDBACK'; payload: { sessionId: string; feedback: any } };

// --- Initial State ---
const initialState: SessionState = {
    currentSessionId: null,
    logs: {},
    history: null,
    syncStatus: 'synced',
    lastSaved: null
};

// --- Reducer ---
function sessionReducer(state: SessionState, action: Action): SessionState {
    switch (action.type) {
        // ... (INIT_SESSION - No Change)
        case 'INIT_SESSION': {
            const { sessionId, patientId } = action.payload;
            if (state.logs[sessionId]) return { ...state, currentSessionId: sessionId };
            const newLog: SessionLog = {
                id: sessionId,
                date: new Date(),
                patientId,
                dayKey: 'unknown',
                exercises: [],
                status: 'partial'
            };
            return { ...state, currentSessionId: sessionId, logs: { ...state.logs, [sessionId]: newLog } };
        }

        case 'UPDATE_SET': {
            const { sessionId, exerciseId, instanceId, setIndex, data } = action.payload;
            const log = state.logs[sessionId];
            if (!log) return state;

            const exercises = [...log.exercises];
            // [FIX] Match by instanceId if provided, else exerciseId
            let exLog = exercises.find(e => instanceId ? e.instanceId === instanceId : e.exerciseId === exerciseId);
            let exIndex = exercises.findIndex(e => instanceId ? e.instanceId === instanceId : e.exerciseId === exerciseId);

            if (!exLog) {
                // Check if we are adding a duplicate based on exerciseId but it's actually a new instance
                // If instanceId is provided, we MUST create a new entry
                exLog = { exerciseId, instanceId, sets: [], skipped: false, notes: '' };
                exercises.push(exLog);
                exIndex = exercises.length - 1;
            }

            // Ensure set exists
            const sets = [...exLog.sets];
            if (!sets[setIndex]) {
                sets[setIndex] = { completed: false, reps: '', load: '', rpe: '' };
            }
            sets[setIndex] = { ...sets[setIndex], ...data };
            exLog.sets = sets;
            exercises[exIndex] = exLog;

            return {
                ...state,
                logs: { ...state.logs, [sessionId]: { ...log, exercises } },
                syncStatus: 'offline',
                lastSaved: Date.now()
            };
        }

        case 'UPDATE_EXERCISE': {
            const { sessionId, exerciseId, instanceId, data } = action.payload;
            const log = state.logs[sessionId];
            if (!log) return state;

            const exercises = [...log.exercises];
            let exLog = exercises.find(e => instanceId ? e.instanceId === instanceId : e.exerciseId === exerciseId);
            let exIndex = exercises.findIndex(e => instanceId ? e.instanceId === instanceId : e.exerciseId === exerciseId);

            if (!exLog) {
                exLog = { exerciseId, instanceId, sets: [], skipped: false, notes: '' };
                exercises.push(exLog);
                exIndex = exercises.length - 1;
            }

            exercises[exIndex] = { ...exLog, ...data };

            return {
                ...state,
                logs: { ...state.logs, [sessionId]: { ...log, exercises } },
                syncStatus: 'offline',
                lastSaved: Date.now()
            };
        }
        case 'SET_HISTORY':
            return { ...state, history: action.payload };

        case 'UPDATE_FEEDBACK': {
            const { sessionId, feedback } = action.payload;
            const log = state.logs[sessionId];
            if (!log) return state;

            return {
                ...state,
                logs: {
                    ...state.logs,
                    [sessionId]: { ...log, feedback }
                },
                lastSaved: Date.now()
            };
        }

        case 'SET_SYNC_STATUS':
            return { ...state, syncStatus: action.payload };

        case 'LOAD_FROM_STORAGE':
            return { ...action.payload, syncStatus: 'synced' }; // Reset sync status on load

        default:
            return state;
    }
}

// --- Context ---
const SessionContext = createContext<{
    state: SessionState;
    dispatch: React.Dispatch<Action>;
    getSessionLog: (sessionId: string) => SessionLog | undefined;
    syncSession: (sessionId: string, mergeData?: Partial<SessionLog>) => Promise<void>;
    loadHistory: (patientId: string) => Promise<void>;
}>({
    state: initialState,
    dispatch: () => null,
    getSessionLog: () => undefined,
    syncSession: async () => { },
    loadHistory: async () => { }
});

// --- Provider ---
export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useReducer(sessionReducer, initialState);

    // 1. Load from LocalStorage on Mount
    useEffect(() => {
        const saved = localStorage.getItem('all_u_moves_sessions');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);

                // [FIX] Hydrate Dates
                if (parsed.logs) {
                    Object.keys(parsed.logs).forEach(key => {
                        if (typeof parsed.logs[key].date === 'string') {
                            parsed.logs[key].date = new Date(parsed.logs[key].date);
                        }
                    });
                }

                // Ensure history field exists if loading old schema
                if (!parsed.history) parsed.history = null;
                dispatch({ type: 'LOAD_FROM_STORAGE', payload: parsed });
            } catch (e) {
                console.error("Failed to load session backup", e);
            }
        }
    }, []);

    // 2. Auto-Save to LocalStorage
    useEffect(() => {
        if (state.lastSaved) {
            localStorage.setItem('all_u_moves_sessions', JSON.stringify(state));
        }
    }, [state]);

    // Helpers
    const getSessionLog = (sessionId: string) => state.logs[sessionId];

    const syncSession = async (sessionId: string, mergeData?: Partial<SessionLog>) => {
        // [FIX] Use mergeData if provided (resolves stale closure issue for feedback)
        const currentLog = state.logs[sessionId];
        if (!currentLog) {
            console.error(`Attempted to sync non-existent session: ${sessionId}`);
            alert(`Error crítico: No se encontró la sesión activa (${sessionId}). Por favor recarga la página.`);
            return;
        }

        const logToSave = mergeData ? { ...currentLog, ...mergeData } : currentLog;

        dispatch({ type: 'SET_SYNC_STATUS', payload: 'syncing' });
        try {
            // Strip ID for creation if needed
            // Use destructuring to remove 'id' safely (works even if id is required/optional in source type)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, ...logWithoutId } = logToSave;

            // Cast to any to assume compatibility with Service.create requirement
            await SessionLogService.create(logWithoutId as any);
            dispatch({ type: 'SET_SYNC_STATUS', payload: 'synced' });
        } catch (error) {
            console.error("Sync failed", error);
            dispatch({ type: 'SET_SYNC_STATUS', payload: 'error' });
            throw error; // [FIX] Rethrow so caller knows it failed
        }
    };

    const loadHistory = async (patientId: string) => {
        try {
            const lastLog = await SessionLogService.getLastLog(patientId);
            dispatch({ type: 'SET_HISTORY', payload: lastLog });
        } catch (error) {
            // silent fail
        }
    };

    return (
        <SessionContext.Provider value={{ state, dispatch, getSessionLog, syncSession, loadHistory }}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = () => useContext(SessionContext);
