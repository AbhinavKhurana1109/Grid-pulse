"use client";

import { FirestorePermissionError } from './errors';

/**
 * A simple, browser-native event emitter to avoid 'Illegal constructor' 
 * issues common with Node.js 'events' polyfills in the browser.
 */
type PermissionErrorListener = (error: FirestorePermissionError) => void;

class ErrorEmitter {
  private listeners: PermissionErrorListener[] = [];

  emit(event: 'permission-error', error: FirestorePermissionError): boolean {
    if (event === 'permission-error') {
      this.listeners.forEach((listener) => listener(error));
    }
    return true;
  }

  on(event: 'permission-error', listener: PermissionErrorListener): this {
    if (event === 'permission-error') {
      this.listeners.push(listener);
    }
    return this;
  }

  removeListener(event: 'permission-error', listener: PermissionErrorListener): this {
    if (event === 'permission-error') {
      this.listeners = this.listeners.filter((l) => l !== listener);
    }
    return this;
  }
}

export const errorEmitter = new ErrorEmitter();
