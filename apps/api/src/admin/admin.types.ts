export interface AdminDashboardMetrics {
  totalUsers: number;
  newUsersLast24h: number;
  totalSellers: number;
  pendingSellers: number;
  activeListings: number;
  activeAuctions: number;
  openDisputes: number;
  totalOrders: number;
  totalRevenueCents: number;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  reason?: string;
  details?: any;
  createdAt: Date;
}

export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  description?: string;
  updatedAt: Date;
}

export interface AdminRepository {
  getDashboardMetrics(): Promise<AdminDashboardMetrics>;
  listUsers(params: { skip: number; take: number; status?: string; q?: string }): Promise<{ items: any[]; total: number }>;
  listSellers(params: { skip: number; take: number; status?: string }): Promise<{ items: any[]; total: number }>;
  listListings(params: { skip: number; take: number; status?: string; q?: string }): Promise<{ items: any[]; total: number }>;
  listAuctions(params: { skip: number; take: number; status?: string }): Promise<{ items: any[]; total: number }>;
  listOrders(params: { skip: number; take: number; status?: string }): Promise<{ items: any[]; total: number }>;
  listDisputes(params: { skip: number; take: number; status?: string }): Promise<{ items: any[]; total: number }>;
  listRefunds(params: { skip: number; take: number; status?: string }): Promise<{ items: any[]; total: number }>;
  listAuditLogs(params: { skip: number; take: number; action?: string; adminId?: string }): Promise<{ items: any[]; total: number }>;
  getFeatureFlags(): Promise<FeatureFlag[]>;
  updateFeatureFlag(name: string, enabled: boolean): Promise<FeatureFlag>;
  createAuditLog(data: Omit<AdminAuditLog, 'id' | 'createdAt'>): Promise<AdminAuditLog>;
  
  findUserById(id: string): Promise<any>;
  findSellerById(id: string): Promise<any>;
  findListingById(id: string): Promise<any>;
  findAuctionById(id: string): Promise<any>;
  findDisputeById(id: string): Promise<any>;
  
  updateUserStatus(id: string, status: string): Promise<any>;
  updateSellerStatus(id: string, status: string, reason?: string): Promise<any>;
  updateListingStatus(id: string, status: string): Promise<any>;
  cancelAuction(id: string): Promise<any>;
  resolveDispute(id: string, status: string, resolution: string): Promise<any>;
}
