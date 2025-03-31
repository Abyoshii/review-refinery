
export type Review = {
  id: string;
  rating: number;
  text: string;
  date: string;
  articleId: string;
  processed: boolean;
  response?: string;
  canEdit: boolean;
};

export type BatchAction = 'template' | 'generate' | 'send' | 'deselect';
