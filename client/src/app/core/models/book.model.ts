export interface Book {
    id?: string; 
    title: string;
    author: string;
    description?: string;
    imageUrl?: string;
    createdAt: Date;
    userId: string; 
  }