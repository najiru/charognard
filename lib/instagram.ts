import type { AymlResponse, FriendshipStatus } from './types';

const IG_APP_ID = '936619743392459';

export function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

export function getCurrentUserId(): string | null {
  return getCookie('ds_user_id');
}

function getHeaders(): HeadersInit {
  const csrfToken = getCookie('csrftoken') || '';

  return {
    'accept': '*/*',
    'content-type': 'application/x-www-form-urlencoded',
    'x-csrftoken': csrfToken,
    'x-ig-app-id': IG_APP_ID,
    'x-requested-with': 'XMLHttpRequest',
  };
}

export async function fetchSuggestions(maxId?: string): Promise<AymlResponse> {
  // Check if user is logged in by verifying CSRF token exists
  const csrfToken = getCookie('csrftoken');
  if (!csrfToken) {
    throw new Error('Please log in to Instagram to see suggestions');
  }

  const encodedMaxId = maxId ? encodeURIComponent(maxId) : '%5B%5D';
  const response = await fetch('https://www.instagram.com/api/v1/discover/ayml/', {
    method: 'POST',
    headers: getHeaders(),
    body: `max_id=${encodedMaxId}&max_number_to_display=30&module=discover_people&paginate=true`,
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Please log in to Instagram to see suggestions');
    }
    throw new Error(`Erreur ${response.status}`);
  }

  // Check if response is HTML (login page redirect)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/html')) {
    throw new Error('Please log in to Instagram to see suggestions');
  }

  return response.json();
}

export async function followUser(userId: string): Promise<void> {
  const response = await fetch(`https://www.instagram.com/api/v1/friendships/create/${userId}/`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to follow user: ${response.status}`);
  }
}

export async function unfollowUser(userId: string): Promise<void> {
  const response = await fetch(`https://www.instagram.com/api/v1/friendships/destroy/${userId}/`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to unfollow user: ${response.status}`);
  }
}

export async function checkFriendshipStatus(userId: string): Promise<FriendshipStatus> {
  const response = await fetch(`https://www.instagram.com/api/v1/friendships/show/${userId}/`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to check friendship status: ${response.status}`);
  }

  return response.json();
}

export interface UserInfo {
  user: {
    pk: string;
    username: string;
    full_name: string;
    profile_pic_url: string;
    is_verified: boolean;
    is_private: boolean;
  };
}

export async function fetchUserInfo(userId: string): Promise<UserInfo> {
  const response = await fetch(`https://www.instagram.com/api/v1/users/${userId}/info/`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user info: ${response.status}`);
  }

  return response.json();
}

export interface UserMedia {
  items: Array<{
    pk: string;
    id: string;
    code: string;
    taken_at: number;
  }>;
}

export async function fetchUserMedia(userId: string): Promise<UserMedia> {
  const response = await fetch(`https://www.instagram.com/api/v1/feed/user/${userId}/?count=1`, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user media: ${response.status}`);
  }

  return response.json();
}

export async function likePost(mediaId: string): Promise<void> {
  const response = await fetch(`https://www.instagram.com/api/v1/web/likes/${mediaId}/like/`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to like post: ${response.status}`);
  }
}

export async function unlikePost(mediaId: string): Promise<void> {
  const response = await fetch(`https://www.instagram.com/api/v1/web/likes/${mediaId}/unlike/`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to unlike post: ${response.status}`);
  }
}
