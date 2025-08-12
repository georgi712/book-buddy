import { FieldValue, Timestamp } from "@angular/fire/firestore";

export interface User {
    id?: string; 
    displayName: string;
    email: string;
    imagePath?: string; 
    favorites: string[]; 
    createdAt: Timestamp | FieldValue; 
    bio: string;
}