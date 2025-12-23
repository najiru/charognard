// Instagram API Types
export interface InstagramUser {
  pk: string;
  username: string;
  full_name: string;
  profile_pic_url: string;
  is_verified: boolean;
  is_private: boolean;
}

export interface Suggestion {
  user: InstagramUser;
  social_context: string;
  caption: string;
}

export interface AymlResponse {
  more_available: boolean;
  max_id: string;
  suggested_users: {
    suggestions: Suggestion[];
  };
}

// Friendship Status
export interface FriendshipStatus {
  following: boolean;
  followed_by: boolean;
  blocking: boolean;
  muting: boolean;
  is_private: boolean;
  incoming_request: boolean;
  outgoing_request: boolean;
}

// Message Types for extension communication
export enum MessageType {
  GetSuggestions = 'GET_SUGGESTIONS',
  FollowUser = 'FOLLOW_USER',
  UnfollowUser = 'UNFOLLOW_USER',
  RunAutomation = 'RUN_AUTOMATION',
  UpdateAlarm = 'UPDATE_ALARM',
  OpenPanel = 'OPEN_PANEL',
}

export interface BaseMessage {
  type: MessageType;
}

export interface GetSuggestionsMessage extends BaseMessage {
  type: MessageType.GetSuggestions;
}

export interface FollowUserMessage extends BaseMessage {
  type: MessageType.FollowUser;
  userId: string;
}

export interface UnfollowUserMessage extends BaseMessage {
  type: MessageType.UnfollowUser;
  userId: string;
}

export interface RunAutomationMessage extends BaseMessage {
  type: MessageType.RunAutomation;
}

export interface UpdateAlarmMessage extends BaseMessage {
  type: MessageType.UpdateAlarm;
}

export interface OpenPanelMessage extends BaseMessage {
  type: MessageType.OpenPanel;
}

export type ExtensionMessage =
  | GetSuggestionsMessage
  | FollowUserMessage
  | UnfollowUserMessage
  | RunAutomationMessage
  | UpdateAlarmMessage
  | OpenPanelMessage;

export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
