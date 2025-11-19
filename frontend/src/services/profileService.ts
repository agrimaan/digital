
import apiService from './api';

export interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  address?: string;
  profileImage?: string;
  isVerified: boolean;
  preferences?: {
    notifications?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
    };
    language?: string;
    timezone?: string;
  };
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
  preferences?: {
    notifications?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
    };
    language?: string;
    timezone?: string;
  };
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ProfileStats {
  fields?: number;
  crops?: number;
  sensors?: number;
  listings?: number;
  orders?: number;
}

class ProfileService {
  /**
   * Get current user profile
   */
  async getProfile(): Promise<{ success: boolean; user: UserProfile }> {
    return apiService.get('/api/auth/me');
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UpdateProfileData): Promise<{ success: boolean; data: UserProfile }> {
    return apiService.put(`/api/users/${userId}`, data);
  }

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordData): Promise<{ success: boolean; message: string }> {
    return apiService.put('/api/auth/change-password', data);
  }

  /**
   * Upload profile image
   */
  async uploadProfileImage(base64: string): Promise<{ success: boolean; imageUrl: string }> {
    return apiService.uploadFile('/api/users/profile-image', { image: base64 });
  }

  /**
   * Get profile statistics (fields, crops, sensors, etc.)
   */
  async getProfileStats(): Promise<{ success: boolean; data: ProfileStats }> {
    try {
      // This will aggregate data from multiple services
      const [fieldsResponse, cropsResponse, sensorsResponse] = await Promise.allSettled([
        apiService.get<any>('/api/fields').catch(() => ({ data: [] })),
        apiService.get<any>('/api/crops').catch(() => ({ data: [] })),
        apiService.get<any>('/api/sensors/devices').catch(() => ({ data: [] })),
      ]);

      const stats: ProfileStats = {
        fields: fieldsResponse.status === 'fulfilled' ? (fieldsResponse.value?.data?.length || 0) : 0,
        crops: cropsResponse.status === 'fulfilled' ? (cropsResponse.value?.data?.length || 0) : 0,
        sensors: sensorsResponse.status === 'fulfilled' ? (sensorsResponse.value?.data?.length || 0) : 0,
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching profile stats:', error);
      return { success: false, data: { fields: 0, crops: 0, sensors: 0 } };
    }
  }

  /**
   * Get recent activity
   * This would typically come from an activity log service
   */
  async getRecentActivity(): Promise<{ success: boolean; data: any[] }> {
    // TODO: Implement activity tracking service
    // For now, return empty array
    return { success: true, data: [] };
  }

  /**
   * Get notifications
   * This would typically come from a notification service
   */
  async getNotifications(): Promise<{ success: boolean; data: any[] }> {
    // TODO: Implement notification service
    // For now, return empty array
    return { success: true, data: [] };
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<{ success: boolean }> {
    // TODO: Implement notification service
    return { success: true };
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead(): Promise<{ success: boolean }> {
    // TODO: Implement notification service
    return { success: true };
  }
}

export const profileService = new ProfileService();
export default profileService;
