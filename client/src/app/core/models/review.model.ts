export interface Review {
    id?: string;
    bookId: string;
    userId: string;
    content: string;
    rating: number; 
    createdAt: Date;
  }