// models/user.ts
import { Timestamp, FieldValue } from '@angular/fire/firestore';

export interface User {
  id?: string;
  displayName: string;
  email: string;
  imageUrl?: string;   
  imagePath?: string;  
  favorites: string[];
  createdAt: Timestamp | FieldValue | Date;
  bio: string;
}