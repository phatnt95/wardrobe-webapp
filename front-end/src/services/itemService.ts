import api from './api';

export interface WardrobeItem {
    id: string;
    name: string;
    category: string;
    imageUrl?: string;
    // Add more fields based on your requirements
}

export const itemService = {
    // Get all items
    getAllItems: async (): Promise<WardrobeItem[]> => {
        return api.get('/items');
    },

    // Get a single item by ID
    getItemById: async (id: string): Promise<WardrobeItem> => {
        return api.get(`/items/${id}`);
    },

    // Create a new item
    createItem: async (itemData: Partial<WardrobeItem>): Promise<WardrobeItem> => {
        return api.post('/items', itemData);
    },

    // Update an existing item
    updateItem: async (id: string, itemData: Partial<WardrobeItem>): Promise<WardrobeItem> => {
        return api.put(`/items/${id}`, itemData);
    },

    // Delete an item
    deleteItem: async (id: string): Promise<void> => {
        return api.delete(`/items/${id}`);
    }
};
