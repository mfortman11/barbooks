// Define different page types
export type PageType = 'list' | 'text' | 'custom' | 'matchup' | 'teams';

export interface ListItem {
  // Flexible clue - can be any string or number
  clue?: string | number;
  // Legacy support (deprecated - use clue instead)
  year?: number;
  label?: string;
  // Additional properties
  hasNote?: boolean;
  noteText?: string;
}

export interface ActionContent {
  content: string;
  position?: 'left' | 'right';
  rotation?: number;
  icon?: string;
}

export interface MatchupItem {
  // The central text/clue (e.g., "vs", "40-22", "2023 NFC Championship")
  centerText: string;
  // Optional additional context or year
  context?: string | number;
}

export type PageDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface ListPageConfig {
  type: 'list';
  title: string;
  description?: string;
  category?: string;
  difficulty?: PageDifficulty;
  items: ListItem[];
  columns?: number;
  showInstructions?: boolean;
  instructionText?: string;
  answerKeyUrl?: string;
  actionContent?: ActionContent;
}

export interface TextPageConfig {
  type: 'text';
  content: string;
  answerKeyUrl?: string;
  actionContent?: ActionContent;
}

export interface CustomPageConfig {
  type: 'custom';
  content: string;
  answerKeyUrl?: string;
  actionContent?: ActionContent;
}

export interface MatchupPageConfig {
  type: 'matchup';
  title: string;
  description?: string;
  category?: string;
  difficulty?: PageDifficulty;
  items: MatchupItem[];
  columns?: number;
  showInstructions?: boolean;
  instructionText?: string;
  answerKeyUrl?: string;
  actionContent?: ActionContent;
}

export interface TeamsPageConfig {
  type: 'teams';
  title: string;
  description?: string;
  category?: string;
  difficulty?: PageDifficulty;
  answerKeyUrl?: string;
  actionContent?: ActionContent;
}

export type PageConfiguration = ListPageConfig | TextPageConfig | CustomPageConfig | MatchupPageConfig | TeamsPageConfig;

export interface PageConfig {
  pages: PageConfiguration[];
  getPageConfiguration(pageNum: number): PageConfiguration;
  getAnswerKeyUrl(pageNum: number): string;
  pageExists(pageNum: number): boolean;
}