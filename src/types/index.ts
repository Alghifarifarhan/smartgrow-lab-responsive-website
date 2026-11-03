export interface ThemeConfig {
  presetId?: string;
  primary: string;
  darkBg: string;
  lightBg: string;
  textDark: string;
  textMedium: string;
  textLight: string;
}

export interface SiteContent {
  theme?: ThemeConfig;
  heroTitle?: string;
  heroDescription?: string;
  heroLeftImage?: string;
  heroRightImage?: string;
  heroRightText?: string;
  aboutTitle?: string;
  aboutParagraph1?: string;
  aboutParagraph2?: string;
  stats?: {
    partners?: string;
    projects?: string;
    increase?: string | number;
    members?: string;
  };
  footer?: {
    address?: string;
    research?: Array<{ text: string; url: string }>;
    contact?: Array<{ text: string; url: string }>;
  };
  joinUsLink?: string;
}

export interface ResearchInterest {
  id: string;
  title: string;
  iconLink: string;
  createdAt?: unknown;
}

export interface NewsItem {
  id: string;
  title: string;
  date: string;
  summary: string;
  content: string;
  image: string;
  createdAt?: unknown;
}

export interface CommentItem {
  id: string;
  name: string;
  email: string;
  text: string;
  createdAt?: unknown;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  link?: string;
  images: string[];
  createdAt?: unknown;
}

export interface TeamMember {
  id: string;
  name: string;
  role: "Mentor" | "Member" | string;
  image: string;
  createdAt?: unknown;
}

export interface AnalyticsStats {
  totalVisits: number;
  uniqueVisitors: number;
  totalUploads: number;
  totalDownloads: number;
  lastUpdated?: unknown;
}
