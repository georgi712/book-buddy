export interface User {
    id?: string; 
    displayName: string;
    email: string;
    photoURL?: string; 
    favorites: string[]; 
    createdAt: Date | null; 
}