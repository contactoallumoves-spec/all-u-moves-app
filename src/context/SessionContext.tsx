import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { SessionLog, SessionExerciseLog } from '../types/patient';

// --- State Types ---
interface SessionState {
    currentSessionId: string | null; // Date Key (YYYY-MM-DD)
    logs: Record<string, SessionLog>; // Keyed by session ID
    syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
    lastSaved: number | null;
}

// --- Actions ---
type Action =
    | { type: 'INIT_SESSION'; payload: { sessionId: string; patientId: string } }
    | { type: 'UPDATE_SET'; payload: { sessionId: string; exerciseId: string; setIndex: number; data: any } }
    | { type: 'MARK_COMPLETED'; payload: { sessionId: string; exerciseId: string; completed: boolean } }
    | { type: 'SET_SYNC_STATUS'; payload: 'synced' | 'syncing' | 'offline' | 'error' }
    | { type: 'LOAD_FROM_STORAGE'; payload: SessionState };

// --- Initial State ---
const initialState: SessionState = {
    currentSessionId: null,
    logs: {},
    syncStatus: 'synced',
    lastSaved: null
};

// --- Reducer ---
function sessionReducer(state: SessionState, action: Action): SessionState {
    switch (action.type) {
        case 'INIT_SESSION': {
            const { sessionId, patientId } = action.payload;
            if (state.logs[sessionId]) return { ...state, currentSessionId: sessionId };

            // New Log
            const newLog: SessionLog = {
                id: sessionId,
                date: new Date(),
                patientId,
                dayKey: 'unknown', // Updated by component
                exercises: [],
                status: 'partial'
            };

            return {
                ...state,
                currentSessionId: sessionId,
                logs: { ...state.logs, [sessionId]: newLog }
            };
        }

        case 'UPDATE_SET': {
            const { sessionId, exerciseId, setIndex, data } = action.payload;
            const log = state.logs[sessionId];
            if (!log) return state;

            const exercises = [...log.exercises];
            let exLog = exercises.find(e => e.exerciseId === exerciseId);

            if (!exLog) {
                exLog = { exerciseId, sets: [] };
                exercises.push(exLog);
            }

            // Ensure set exists
            const sets = [...exLog.sets];
            sets[setIndex] = { ...sets[setIndex], ...data };
            exLog.sets = sets;

            // Update exercises array
            const exIndex = exercises.findIndex(e => e.exerciseId === exerciseId);
            exercises[exIndex] = exLog;

            return {
                ...state,
                logs: { ...state.logs, [sessionId]: { ...log, exercises } },
                syncStatus: 'offline', // Mark as needs sync
                lastSaved: Date.now()
            };
        }

        case 'LOAD_FROM_STORAGE':
            return action.payload;

        default:
            return state;
    }
}

// --- Context ---
const SessionContext = createContext<{
    state: SessionState;
    dispatch: React.Dispatch<Action>;
    getSessionLog: (sessionId: string) => SessionLog | undefined;
}>({
    state: initialState,
    dispatch: () => null,
    getSessionLog: () => undefined
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

    // Helper
    const getSessionLog = (sessionId: string) => state.logs[sessionId];

    return (
        <SessionContext.Provider value={{ state, dispatch, getSessionLog }}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = () => useContext(SessionContext);
