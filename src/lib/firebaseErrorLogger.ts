/**
 * Firebase Permission Error Logger
 * 
 * This utility provides comprehensive logging for Firebase permission errors
 * to help debug authentication and authorization issues in the battle system.
 */

import { FirebaseError } from 'firebase/app';
import { AuthError } from 'firebase/auth';
import { FirestoreError } from 'firebase/firestore';

export interface FirebaseErrorLog {
  timestamp: string;
  errorType: 'auth' | 'firestore' | 'general';
  errorCode: string;
  errorMessage: string;
  operation: string;
  collection?: string;
  documentId?: string;
  userId?: string;
  userEmail?: string;
  authState: 'authenticated' | 'unauthenticated' | 'unknown';
  context: Record<string, any>;
  stackTrace?: string;
  suggestions: string[];
}

export interface PermissionErrorDetails {
  operation: 'read' | 'write' | 'delete' | 'listen';
  collection: string;
  documentId?: string;
  userId?: string;
  expectedPermissions: string[];
  actualPermissions: string[];
  securityRuleViolations: string[];
}

class FirebaseErrorLogger {
  private logs: FirebaseErrorLog[] = [];
  private maxLogs = 100; // Keep last 100 errors

  /**
   * Log a Firebase error with comprehensive details
   */
  logError(
    error: Error | FirebaseError | AuthError | FirestoreError,
    operation: string,
    context: Record<string, any> = {}
  ): FirebaseErrorLog {
    const errorLog: FirebaseErrorLog = {
      timestamp: new Date().toISOString(),
      errorType: this.getErrorType(error),
      errorCode: this.getErrorCode(error),
      errorMessage: error.message,
      operation,
      authState: this.getAuthState(),
      context,
      suggestions: this.generateSuggestions(error, operation, context)
    };

    // Add specific details based on error type
    if (this.isFirestoreError(error)) {
      errorLog.collection = context.collection;
      errorLog.documentId = context.documentId;
    }

    if (this.isAuthError(error)) {
      errorLog.userId = context.userId;
      errorLog.userEmail = context.userEmail;
    }

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
      errorLog.stackTrace = error.stack;
    }

    this.logs.unshift(errorLog);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log to console with detailed formatting
    this.logToConsole(errorLog);

    return errorLog;
  }

  /**
   * Log a permission error with detailed analysis
   */
  logPermissionError(
    error: FirestoreError,
    permissionDetails: PermissionErrorDetails,
    context: Record<string, any> = {}
  ): FirebaseErrorLog {
    const enhancedContext = {
      ...context,
      ...permissionDetails,
      permissionAnalysis: this.analyzePermissionError(permissionDetails)
    };

    return this.logError(error, `permission_${permissionDetails.operation}`, enhancedContext);
  }

  /**
   * Get all logged errors
   */
  getLogs(): FirebaseErrorLog[] {
    return [...this.logs];
  }

  /**
   * Get errors by type
   */
  getErrorsByType(type: 'auth' | 'firestore' | 'general'): FirebaseErrorLog[] {
    return this.logs.filter(log => log.errorType === type);
  }

  /**
   * Get recent errors (last N minutes)
   */
  getRecentErrors(minutes: number = 5): FirebaseErrorLog[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.logs.filter(log => new Date(log.timestamp) > cutoff);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Get error summary for debugging
   */
  getErrorSummary(): {
    totalErrors: number;
    errorTypes: Record<string, number>;
    recentErrors: number;
    commonErrors: Array<{ code: string; count: number; message: string }>;
    suggestions: string[];
  } {
    const errorTypes = this.logs.reduce((acc, log) => {
      acc[log.errorType] = (acc[log.errorType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorCounts = this.logs.reduce((acc, log) => {
      const key = `${log.errorCode}:${log.errorMessage}`;
      if (!acc[key]) {
        acc[key] = { code: log.errorCode, count: 0, message: log.errorMessage };
      }
      acc[key].count++;
      return acc;
    }, {} as Record<string, any>);

    const commonErrors = Object.values(errorCounts)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5);

    const recentErrors = this.getRecentErrors(5).length;

    const allSuggestions = this.logs.flatMap(log => log.suggestions);
    const uniqueSuggestions = [...new Set(allSuggestions)];

    return {
      totalErrors: this.logs.length,
      errorTypes,
      recentErrors,
      commonErrors,
      suggestions: uniqueSuggestions
    };
  }

  private getErrorType(error: Error): 'auth' | 'firestore' | 'general' {
    if (this.isAuthError(error)) return 'auth';
    if (this.isFirestoreError(error)) return 'firestore';
    return 'general';
  }

  private getErrorCode(error: Error): string {
    if ('code' in error) {
      return (error as any).code || 'unknown';
    }
    return 'unknown';
  }

  private isAuthError(error: Error): error is AuthError {
    return 'code' in error && typeof (error as any).code === 'string' && 
           (error as any).code.startsWith('auth/');
  }

  private isFirestoreError(error: Error): error is FirestoreError {
    return 'code' in error && typeof (error as any).code === 'string' && 
           (error as any).code.startsWith('firestore/');
  }

  private getAuthState(): 'authenticated' | 'unauthenticated' | 'unknown' {
    try {
      // This would need to be passed from the auth context
      // For now, we'll return unknown and let the caller provide it
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private analyzePermissionError(details: PermissionErrorDetails): {
    likelyCause: string;
    recommendedAction: string;
    securityRuleCheck: string;
  } {
    const { operation, collection, userId, expectedPermissions, actualPermissions } = details;

    let likelyCause = 'Unknown permission issue';
    let recommendedAction = 'Check Firebase security rules';
    let securityRuleCheck = 'Review security rules for this collection';

    // Analyze based on operation and collection
    if (collection === 'battle_rooms') {
      if (operation === 'read') {
        likelyCause = 'Room read access denied - check if user is authenticated';
        recommendedAction = 'Ensure user is signed in before accessing rooms';
        securityRuleCheck = 'Check battle_rooms read rules - should allow authenticated users';
      } else if (operation === 'write') {
        likelyCause = 'Room write access denied - check if user is host/guest';
        recommendedAction = 'Verify user is the room host or guest';
        securityRuleCheck = 'Check battle_rooms write rules - should allow host/guest updates';
      }
    } else if (collection === 'battles') {
      if (operation === 'read') {
        likelyCause = 'Battle read access denied - check if user is participant';
        recommendedAction = 'Ensure user is battle host or guest';
        securityRuleCheck = 'Check battles read rules - should allow participants';
      } else if (operation === 'write') {
        likelyCause = 'Battle write access denied - check participant status';
        recommendedAction = 'Verify user is battle participant';
        securityRuleCheck = 'Check battles write rules - should allow participant updates';
      }
    }

    return {
      likelyCause,
      recommendedAction,
      securityRuleCheck
    };
  }

  private generateSuggestions(
    error: Error,
    operation: string,
    context: Record<string, any>
  ): string[] {
    const suggestions: string[] = [];
    const errorCode = this.getErrorCode(error);

    // General suggestions
    if (errorCode.includes('permission-denied')) {
      suggestions.push('Check Firebase security rules for this operation');
      suggestions.push('Verify user is authenticated');
      suggestions.push('Ensure user has proper permissions for this resource');
    }

    if (errorCode.includes('unauthenticated')) {
      suggestions.push('User needs to sign in');
      suggestions.push('Check authentication state');
      suggestions.push('Verify Firebase Auth configuration');
    }

    if (errorCode.includes('not-found')) {
      suggestions.push('Check if document/collection exists');
      suggestions.push('Verify document ID is correct');
      suggestions.push('Check if user has read permissions');
    }

    // Operation-specific suggestions
    if (operation.includes('room')) {
      suggestions.push('Check if user is room host or guest');
      suggestions.push('Verify room exists and is accessible');
      suggestions.push('Check battle_rooms security rules');
    }

    if (operation.includes('battle')) {
      suggestions.push('Check if user is battle participant');
      suggestions.push('Verify battle document exists');
      suggestions.push('Check battles security rules');
    }

    if (operation.includes('team')) {
      suggestions.push('Check if user owns the team');
      suggestions.push('Verify team document exists');
      suggestions.push('Check userTeams security rules');
    }

    // Context-specific suggestions
    if (context.collection === 'battle_rooms') {
      suggestions.push('Review battle_rooms security rules');
      suggestions.push('Check if user is in activeUsers array');
      suggestions.push('Verify room status allows this operation');
    }

    if (context.collection === 'battles') {
      suggestions.push('Review battles security rules');
      suggestions.push('Check if user is battle host or guest');
      suggestions.push('Verify battle status allows this operation');
    }

    return suggestions;
  }

  private logToConsole(errorLog: FirebaseErrorLog): void {
    const { errorType, errorCode, errorMessage, operation, suggestions } = errorLog;

    console.group(`🔥 Firebase ${errorType.toUpperCase()} Error`);
    console.error(`Code: ${errorCode}`);
    console.error(`Message: ${errorMessage}`);
    console.error(`Operation: ${operation}`);
    console.error(`Timestamp: ${errorLog.timestamp}`);
    
    if (errorLog.collection) {
      console.error(`Collection: ${errorLog.collection}`);
    }
    
    if (errorLog.documentId) {
      console.error(`Document ID: ${errorLog.documentId}`);
    }
    
    if (errorLog.userId) {
      console.error(`User ID: ${errorLog.userId}`);
    }

    console.group('Context:');
    console.table(errorLog.context);
    console.groupEnd();

    console.group('Suggestions:');
    suggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion}`);
    });
    console.groupEnd();

    if (errorLog.stackTrace) {
      console.group('Stack Trace:');
      console.error(errorLog.stackTrace);
      console.groupEnd();
    }

    console.groupEnd();
  }
}

// Export singleton instance
export const firebaseErrorLogger = new FirebaseErrorLogger();

// Export helper functions for common error logging scenarios
export const logFirebaseError = (
  error: Error,
  operation: string,
  context: Record<string, any> = {}
) => firebaseErrorLogger.logError(error, operation, context);

export const logPermissionError = (
  error: FirestoreError,
  permissionDetails: PermissionErrorDetails,
  context: Record<string, any> = {}
) => firebaseErrorLogger.logPermissionError(error, permissionDetails, context);

export const getFirebaseErrorSummary = () => firebaseErrorLogger.getErrorSummary();

export const exportFirebaseErrorLogs = () => firebaseErrorLogger.exportLogs();

