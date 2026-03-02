type EventCallback = (...args: any[]) => void;

class EventEmitter {
  private listeners: Record<string, EventCallback[]> = {};

  on(event: string, callback: EventCallback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: EventCallback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(
      (cb) => cb !== callback
    );
  }

  emit(event: string, ...args: any[]) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach((cb) => cb(...args));
  }
}

export const eventService = new EventEmitter();

// Event names
export const REFRESH_HISTORY = "REFRESH_HISTORY";
export const REFRESH_GROUPS = "REFRESH_GROUPS";
