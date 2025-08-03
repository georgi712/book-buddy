export interface User {
    id?: string; 
    displayName: string;
    email: string;
    imageUrl?: string; 
    favorites: string[]; 
    createdAt: Date | null; 
}