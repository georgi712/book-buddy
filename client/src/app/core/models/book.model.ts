import { Timestamp } from "@angular/fire/firestore";

export interface Book {
  id?: string;
  title: string;
  author: string;
  genre: string;
  published: string;
  numberOfPages: string;
  description: string;
  imageUrl: string;
  imagePath: string;
  featured?: boolean;
  createdAt: Timestamp; 
  userId: string;
}