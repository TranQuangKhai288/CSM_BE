import { EventEmitter } from 'events';

// Event types
export enum AppEvents {
  // User events
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',

  // Category events
  CATEGORY_CREATED = 'category.created',
  CATEGORY_UPDATED = 'category.updated',
  CATEGORY_DELETED = 'category.deleted',

  // Product events
  PRODUCT_CREATED = 'product.created',
  PRODUCT_UPDATED = 'product.updated',
  PRODUCT_DELETED = 'product.deleted',
  PRODUCT_OUT_OF_STOCK = 'product.out_of_stock',
  PRODUCT_LOW_STOCK = 'product.low_stock',

  // Customer events
  CUSTOMER_CREATED = 'customer.created',
  CUSTOMER_UPDATED = 'customer.updated',
  CUSTOMER_DELETED = 'customer.deleted',

  // Order events
  ORDER_CREATED = 'order.created',
  ORDER_UPDATED = 'order.updated',
  ORDER_CANCELLED = 'order.cancelled',
  ORDER_COMPLETED = 'order.completed',
  ORDER_SHIPPED = 'order.shipped',

  // Inventory events
  INVENTORY_UPDATED = 'inventory.updated',
  INVENTORY_LOW = 'inventory.low',

  // Media events
  MEDIA_UPLOADED = 'media.uploaded',
  MEDIA_UPDATED = 'media.updated',
  MEDIA_DELETED = 'media.deleted',

  // Analytics events
  ANALYTICS_CREATED = 'analytics.created',
  ANALYTICS_UPDATED = 'analytics.updated',

  // Notification events
  SEND_EMAIL = 'notification.send_email',
  SEND_SMS = 'notification.send_sms',
  SEND_PUSH = 'notification.send_push',
}

class EventEmitterService extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(20); // Increase if needed
  }

  // Type-safe emit
  emitEvent<T>(event: AppEvents, data: T): boolean {
    console.log(`📢 Event emitted: ${event}`, data);
    return this.emit(event, data);
  }

  // Type-safe listener
  onEvent<T>(event: AppEvents, listener: (data: T) => void): this {
    return this.on(event, listener);
  }

  // Remove listener
  offEvent<T>(event: AppEvents, listener: (data: T) => void): this {
    return this.off(event, listener);
  }
}

export default new EventEmitterService();
