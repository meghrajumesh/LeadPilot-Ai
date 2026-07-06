export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type QuickAction = {
  label: string;
  icon: "headset" | "calendar" | "message" | "link" | "star" | "zap";
  action: "sendMessage" | "link";
  value: string;
};

export type WidgetConfig = {
  widgetKey: string;
  projectName: string;
  color: string;
  botName: string;
  welcomeMessage: string;
  avatarUrl?: string;
  textColor: string;
  backgroundColor: string;
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  launcherShape: "round" | "square";
  launcherIcon: string;
  headerTitle: string;
  cornerRadius: number;
  sizePreset: "S" | "M" | "L";
  showBranding: boolean;
  fontFamily: string;
  layout: "bubble" | "bar" | "voice" | "terminal" | "command" | "commandbar";
  voiceEnabled: boolean;
  callEnabled: boolean;
  quickActions: QuickAction[];
};

export type WidgetConfigResponse = {
  config: WidgetConfig;
};

export type ConversationStartResponse = {
  conversationId: string;
};

export type ChatResponse = {
  conversationId: string;
  reply: string;
};
