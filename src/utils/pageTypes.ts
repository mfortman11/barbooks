// Define different page types
export type PageType = 'list' | 'text' | 'custom';

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

export interface ListPageConfig {
  type: 'list';
  title: string;
  description?: string;
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

export type PageConfiguration = ListPageConfig | TextPageConfig | CustomPageConfig;