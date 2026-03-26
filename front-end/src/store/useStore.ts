import { create } from 'zustand';

interface User {
    id: string;
    name: string;
    username: string;
}

interface Item {
    id: string;
    name: string;
    category: string;
    color: string;
    description: string;
    brand?: string;
    size?: string;
    occasion?: string;
    seasonCode?: string;
    style?: string;
    neckline?: string;
    sleeveLength?: string;
    shoulder?: string;
    favorite: boolean;
    location: {
        location: string;
        cabinet: string;
        shelf: string;
        box: string;
    };
    imageUrl: string;
}

interface AppState {
    authUser: User | null;
    items: Item[];
    login: (user: User) => void;
    logout: () => void;
    toggleFavorite: (id: string) => void;
    addItem: (item: Item) => void;
}

export const useStore = create<AppState>((set) => ({
    authUser: null,
    items: [
        {
            id: "item1",
            name: "Blue Denim Jacket",
            category: "Jacket",
            color: "Blue",
            description: "Casual jacket",
            favorite: true,
            location: {
                location: "Bedroom Closet",
                cabinet: "Cabinet A",
                shelf: "Shelf 2",
                box: "Box 1"
            },
            imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
        },
        {
            id: "item2",
            name: "White T-Shirt",
            category: "Shirt",
            color: "White",
            description: "Basic cotton tee",
            favorite: false,
            location: {
                location: "Bedroom Closet",
                cabinet: "Cabinet A",
                shelf: "Shelf 1",
                box: "Box 2"
            },
            imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
        }
    ],
    login: (user) => set({ authUser: user }),
    logout: () => set({ authUser: null }),
    toggleFavorite: (id) => set((state) => ({
        items: state.items.map(item => item.id === id ? { ...item, favorite: !item.favorite } : item)
    })),
    addItem: (item) => set((state) => ({ items: [...state.items, item] }))
}));
