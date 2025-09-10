/**
 * React Hook for Firebase Error Logging
 * 
 * This hook provides easy integration of Firebase error logging
 * with React components, especially for the battle system.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseErrorLogger, logFirebaseError, logPermissionError, PermissionErrorDetails } from '@/lib/firebaseErrorLogger';
import { FirestoreError } from 'firebase/firestore';

export interface UseFirebaseErrorLoggerOptions {
  componentName?: string;
  enableConsoleLogging?: boolean;
  enableErrorReporting?: boolean;
  maxLogs?: number;
}

export interface FirebaseErrorLoggerHook {
  logError: (error: Error, operation: string, context?: Record<string, any>) => void;
  logPermissionError: (error: FirestoreError, permissionDetails: PermissionErrorDetails, context?: Record<string, any>) => void;
  getErrorSummary: () => ReturnType<typeof firebaseErrorLogger.getErrorSummary>;
  getRecentErrors: (minutes?: number) => ReturnType<typeof firebaseErrorLogger.getRecentErrors>;
  exportLogs: () => string;
  clearLogs: () => void;
  isErrorFrequent: (errorCode: string, timeWindowMinutes?: number) => boolean;
}

export function useFirebaseErrorLogger(
  options: UseFirebaseErrorLoggerOptions = {}
): FirebaseErrorLoggerHook {
  const { user } = useAuth();
  const {
    componentName = 'Unknown Component',
    enableConsoleLogging = true,
    enableErrorReporting = true,
    maxLogs = 100
  } = options;

  const errorCounts = useRef<Map<string, number[]>>(new Map());
  const userRef = useRef(user);

  // Keep user ref up to date
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Enhanced logError function with user context
  const logError = useCallback((
    error: Error,
    operation: string,
    context: Record<string, any> = {}
  ) => {
    if (!enableErrorReporting) return;

    const enhancedContext = {
      ...context,
      componentName,
      userId: userRef.current?.uid,
      userEmail: userRef.current?.email,
      userDisplayName: userRef.current?.displayName,
      timestamp: new Date().toISOString()
    };

    const errorLog = logFirebaseError(error, operation, enhancedContext);

    // Track error frequency
    const errorKey = `${errorLog.errorCode}:${operation}`;
    const now = Date.now();
    const timeWindow = 5 * 60 * 1000; // 5 minutes

    if (!errorCounts.current.has(errorKey)) {
      errorCounts.current.set(errorKey, []);
    }

    const timestamps = errorCounts.current.get(errorKey)!;
    timestamps.push(now);

    // Remove old timestamps
    const recentTimestamps = timestamps.filter(ts => now - ts < timeWindow);
    errorCounts.current.set(errorKey, recentTimestamps);

    if (enableConsoleLogging) {
      console.group(`🚨 ${componentName} - Firebase Error`);
      console.error('Operation:', operation);
      console.error('Error:', error);
      console.error('Context:', enhancedContext);
      console.groupEnd();
    }

    return errorLog;
  }, [componentName, enableErrorReporting, enableConsoleLogging]);

  // Enhanced logPermissionError function
  const logPermissionErrorCallback = useCallback((
    error: FirestoreError,
    permissionDetails: PermissionErrorDetails,
    context: Record<string, any> = {}
  ) => {
    if (!enableErrorReporting) return;

    const enhancedContext = {
      ...context,
      componentName,
      userId: userRef.current?.uid,
      userEmail: userRef.current?.email,
      userDisplayName: userRef.current?.displayName,
      timestamp: new Date().toISOString()
    };

    return logPermissionError(error, permissionDetails, enhancedContext);
  }, [componentName, enableErrorReporting]);

  // Check if an error is occurring frequently
  const isErrorFrequent = useCallback((
    errorCode: string,
    timeWindowMinutes: number = 5
  ): boolean => {
    const timeWindow = timeWindowMinutes * 60 * 1000;
    const now = Date.now();
    
    for (const [key, timestamps] of errorCounts.current.entries()) {
      if (key.startsWith(errorCode)) {
        const recentTimestamps = timestamps.filter(ts => now - ts < timeWindow);
        return recentTimestamps.length >= 3; // 3 or more errors in time window
      }
    }
    
    return false;
  }, []);

  // Get error summary
  const getErrorSummary = useCallback(() => {
    return firebaseErrorLogger.getErrorSummary();
  }, []);

  // Get recent errors
  const getRecentErrors = useCallback((minutes: number = 5) => {
    return firebaseErrorLogger.getRecentErrors(minutes);
  }, []);

  // Export logs
  const exportLogs = useCallback(() => {
    return firebaseErrorLogger.exportLogs();
  }, []);

  // Clear logs
  const clearLogs = useCallback(() => {
    firebaseErrorLogger.clearLogs();
    errorCounts.current.clear();
  }, []);

  // Log component mount/unmount for debugging
  useEffect(() => {
    if (enableConsoleLogging) {
      console.log(`🔧 ${componentName} - Firebase Error Logger initialized`);
    }

    return () => {
      if (enableConsoleLogging) {
        console.log(`🔧 ${componentName} - Firebase Error Logger cleanup`);
      }
    };
  }, [componentName, enableConsoleLogging]);

  // Log authentication state changes
  useEffect(() => {
    if (enableConsoleLogging) {
      console.log(`🔐 ${componentName} - Auth state changed:`, {
        isAuthenticated: !!user,
        userId: user?.uid,
        userEmail: user?.email
      });
    }
  }, [user, componentName, enableConsoleLogging]);

  return {
    logError,
    logPermissionError: logPermissionErrorCallback,
    getErrorSummary,
    getRecentErrors,
    exportLogs,
    clearLogs,
    isErrorFrequent
  };
}

// Specialized hook for battle-related errors
export function useBattleErrorLogger() {
  const baseLogger = useFirebaseErrorLogger({
    componentName: 'Battle System',
    enableConsoleLogging: true,
    enableErrorReporting: true
  });

  // Use refs to avoid dependency issues
  const baseLoggerRef = useRef(baseLogger);
  useEffect(() => {
    baseLoggerRef.current = baseLogger;
  }, [baseLogger]);

  const logBattleError = useCallback((
    error: Error,
    battleOperation: 'create_room' | 'join_room' | 'start_battle' | 'update_battle' | 'listen_battle' | 'listen_room',
    context: Record<string, any> = {}
  ) => {
    const battleContext = {
      ...context,
      battleOperation,
      system: 'battle'
    };

    return baseLoggerRef.current.logError(error, `battle_${battleOperation}`, battleContext);
  }, []);

  const logRoomError = useCallback((
    error: Error,
    roomOperation: 'create' | 'join' | 'update' | 'listen' | 'leave',
    roomId: string,
    context: Record<string, any> = {}
  ) => {
    const roomContext = {
      ...context,
      roomId,
      roomOperation,
      system: 'room'
    };

    return baseLoggerRef.current.logError(error, `room_${roomOperation}`, roomContext);
  }, []);

  const logBattlePermissionError = useCallback((
    error: FirestoreError,
    operation: 'read' | 'write' | 'delete' | 'listen',
    collection: 'battle_rooms' | 'battles' | 'user_teams',
    documentId?: string,
    context: Record<string, any> = {}
  ) => {
    const permissionDetails: PermissionErrorDetails = {
      operation,
      collection,
      documentId,
      userId: context.userId,
      expectedPermissions: [],
      actualPermissions: [],
      securityRuleViolations: []
    };

    return baseLoggerRef.current.logPermissionError(error, permissionDetails, context);
  }, []);

  return {
    ...baseLogger,
    logBattleError,
    logRoomError,
    logBattlePermissionError
  };
}

