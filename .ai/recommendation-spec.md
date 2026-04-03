## Recommendation Module Specification (Gemini + Local RAG Architecture)

**Objective:** Act as an Advanced Virtual Stylist. Instead of feeding the entire wardrobe to the LLM, the system implements a **Retrieval-Augmented Generation (RAG)** architecture. It first retrieves a subset of weather-appropriate clothing using vector similarity, then uses the Google Gemini API to logically combine them into the Outfit Of The Day (OOTD).

**Architectural Workflow (The RAG Pipeline):**
1. **Data Ingestion (Embedding):** Every time a user adds or updates an item in the `InventoryService`, its metadata (Category, Color, Style, Material, Tags) is concatenated into a descriptive string. This string is converted into a Vector Embedding (using an embedding model like Gemini Embedding API or a local lightweight model) and stored in the database (e.g., MongoDB Atlas Vector Search).
2. **Contextual Retrieval (The 'R'):** - When the Dashboard requests an OOTD, the module takes the current weather context (e.g., "18°C, raining, casual day").
   - This context is embedded into a query vector.
   - The system performs a Vector Search (Cosine Similarity) against the user's wardrobe to retrieve the **Top K** (e.g., top 15-20) most contextually relevant items (e.g., retrieving waterproof jackets, long pants, boots).
3. **Generative Composition (The 'G'):**
   - The system constructs a Prompt for the Gemini API. 
   - Instead of the whole wardrobe, the prompt *only* includes the metadata of the retrieved Top K items.
   - **System Prompt Task:** Instruct Gemini to act as a fashion stylist, analyze the Top K items, and select exactly 1 matching Top, 1 Bottom, and necessary outerwear/shoes that look good together.

**Technical Requirements & Constraints:**
* **Vector Database:** Utilize MongoDB Atlas Vector Search (or a local vector store) to store embeddings and perform similarity searches.
* **Token & Cost Optimization:** By restricting the context to the Top K retrieved items, the system drastically reduces token consumption, minimizes latency, and prevents AI hallucination.
* **Strict Output Formatting:** Force Gemini to return a strict JSON array containing only the ObjectIds of the selected items (e.g., `["id1", "id2", "id3"]`).
* **Fallback & Timeout Mechanism:** * Set a hard timeout for the Gemini generation step (e.g., max 5000ms).
    * Must wrap the execution in a `try-catch` block. If the vector search fails, the Gemini API times out, or JSON parsing fails, the module must immediately fallback to a **Rule-based Logic** (e.g., randomly querying 1 top + 1 bottom matching the temperature from the DB) to ensure high availability for the UI.