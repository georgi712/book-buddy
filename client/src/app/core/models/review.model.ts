// core/models/review.model.ts
import { Timestamp } from '@angular/fire/firestore';

export interface Review {
  id?: string;
  userId: string;
  userName: string;
  userPhoto?: string | null;
  rating: number;             
  comment: string;
  createdAt: Timestamp;       
}