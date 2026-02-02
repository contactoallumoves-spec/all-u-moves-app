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
    | { type: 'UPDATE_SET'; payload: { sessionId: string; exerciseId: string; setIndex: number; data: any } }
    | { type: 'MARK_COMPLETED'; payload: { sessionId: string; exerciseId: string; completed: boolean } }
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
        case 'INIT_SESSION': {
            const { sessionId, patientId } = action.payload;
            if (state.logs[sessionId]) return { ...state, currentSessionId: sessionId };

            // New Log
            const newLog: SessionLog = {
                id: sessionId,
                date: new Date(),
                patientId,
                dayKey: 'unknown',
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
                exLog = { exerciseId, sets: [], skipped: false, notes: '' };
                exercises.push(exLog);
            }

            // Ensure set exists
            const sets = [...exLog.sets];
            // Ensure sets[setIndex] is initialized if undefined
            if (!sets[setIndex]) {
                sets[setIndex] = { completed: false, reps: '', load: '', rpe: '' };
            }
            sets[setIndex] = { ...sets[setIndex], ...data };
            exLog.sets = sets;

            const exIndex = exercises.findIndex(e => e.exerciseId === exerciseId);
            exercises[exIndex] = exLog;

            return {
                ...state,
                logs: { ...state.logs, [sessionId]: { ...log, exercises } },
                syncStatus: 'offline',
                lastSaved: Date.now()
            };
        }
            // ... (skip unchanged handlers)

            const syncSession = async (sessionId: string) => {
                const log = state.logs[sessionId];
                if (!log) return;

                dispatch({ type: 'SET_SYNC_STATUS', payload: 'syncing' });
                try {
                    // Strip ID for creation if needed, or just pass as is if Service handles it or if ID is the docRef
                    // The service expects Omit<SessionLog, 'id' | 'createdAt'>.
                    // Our local log has 'id' (the date key) which is NOT the Firestore Doc ID.
                    // We should probably rely on Firestore auto-ID or use the date key as ID?
                    // Service.create uses addDoc, so it auto-generates ID.

                    const logToSave = { ...log };
                    delete logToSave.id; // Remove the local date-key ID
                    // createdAt is optional in type but Service overrides it. 

                    await SessionLogService.create(logToSave as any);
                    dispatch({ type: 'SET_SYNC_STATUS', payload: 'synced' });
                } catch (error) {
                    console.error("Sync failed", error);
                    dispatch({ type: 'SET_SYNC_STATUS', payload: 'error' });
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
