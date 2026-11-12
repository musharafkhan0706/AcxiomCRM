import { User } from '../types';

/**
 * Safely normalizes user list data from various API response shapes
 * (flat array, paginated { content: [...] }, wrapped { users: [...] }, or ApiResponse { data: [...] }).
 * Returns a guaranteed Array<User> without throwing.
 */
export const normalizeUsersList = (data: any): User[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    if (Array.isArray(data.content)) return data.content;
    if (Array.isArray(data.users)) return data.users;
    if (Array.isArray(data.data)) return data.data;
    if (data.data && typeof data.data === 'object') {
      return normalizeUsersList(data.data);
    }
  }
  return [];
};
