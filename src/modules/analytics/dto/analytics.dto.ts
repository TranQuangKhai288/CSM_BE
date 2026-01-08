export interface CreateAnalyticsDto {
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'REALTIME';
  category: string;
  metric: string;
  value: number;
  metadata?: Record<string, any>;
  date: Date;
}

export interface UpdateAnalyticsDto {
  value?: number;
  metadata?: Record<string, any>;
}

export interface AnalyticsQuery {
  type?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'REALTIME';
  category?: string;
  metric?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

export interface SalesAnalyticsQuery {
  startDate?: Date;
  endDate?: Date;
  groupBy?: 'day' | 'week' | 'month' | 'year';
}

export interface ProductAnalyticsQuery {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export interface CustomerAnalyticsQuery {
  startDate?: Date;
  endDate?: Date;
}

export interface PageViewDto {
  path: string;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
  userId?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface DashboardStatsQuery {
  startDate?: Date;
  endDate?: Date;
}
