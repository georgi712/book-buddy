import { Timestamp } from "@angular/fire/firestore";

export interface Book {
  id?: string;
  title: string;
  titleLower: string;
  author: string;
  genre: string;
  published: string;
  numberOfPages: string;
  description: string;
  imageUrl: string;
  imagePath: string;
  avgRaiting: number;
  reviewsCount: string;
  featured?: boolean;
  createdAt: Timestamp; 
  userId: string;
}