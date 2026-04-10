# CONTEXT
You are an Expert Frontend Developer specializing in React, TypeScript, and Tailwind CSS. 
I have built a backend REST API for a Wardrobe Management App. The backend uses a complex RAG (Retrieval-Augmented Generation) pipeline with ChromaDB and Gemini AI to recommend outfits based on current weather.

# TASK
Your task is to build the `HomeDashboard.tsx` page. This page will act as the main screen of the application, displaying the current weather and the AI Stylist's Outfit of the Day (OOTD) recommendation.

# API INTERFACES
Please use the following TypeScript interfaces to type the API response:

interface WeatherData {
  temperature: number;
  condition: string; // e.g., "Nắng nóng", "Mưa rào", "Có tuyết"
  location: string;
}

interface WardrobeItem {
  _id: string;
  name: string;
  color: string;
  images: string[];
  category?: { _id: string; name: string };
  style?: { _id: string; name: string };
}

interface OotdResponse {
  items: WardrobeItem[];
  source: 'ai_rag' | 'fallback';
  reason: string; // The AI's explanation for the outfit choice
}

# UI/UX REQUIREMENTS

1. Layout & Styling:
   - Use Tailwind CSS for styling. 
   - The design should be modern, minimalist, and mobile-first (like a premium fashion app).
   - Use `lucide-react` for icons (e.g., Sun, CloudRain, Snowflake, Sparkles, Shirt).

2. Header Section:
   - Display a greeting (e.g., "Good morning, User!").
   - Display a compact Weather Widget showing the current location, temperature, and an appropriate weather icon.

3. AI Stylist Section (Core Feature):
   - Loading State: While fetching the OOTD API, display a beautiful shimmering Skeleton loader (simulate AI thinking and picking clothes).
   - Success State (Items Found):
     - Display a prominent AI badge/icon.
     - Show the `reason` text returned by the AI in an elegant quote or callout box.
     - Display the recommended `items` in a CSS Grid or horizontal scrollable list of Cards. Each card should show the item's image, name, and category.
   - Empty/Refusal State (Important): If the API returns an empty `items` array [] (this happens when the AI refuses to pick clothes because the wardrobe lacks weather-appropriate items), display a friendly Empty State UI.
     - Show the AI's `reason` explaining why it couldn't find anything (e.g., "Trời quá lạnh, tủ đồ của bạn không có áo ấm!").
     - Add a Call-to-Action button: "Thêm đồ mới vào tủ".

4. Component Architecture:
   - Keep the code clean and modular. You can write sub-components (like WeatherWidget, OutfitCard, SkeletonCard) within the same file for now, or split them logically.
   - Use `useEffect` to fetch the data on component mount, and manage state with `useState` (loading, data, error).

Please write the complete, production-ready code for `HomeDashboard.tsx`.