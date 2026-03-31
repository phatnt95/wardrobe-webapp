# Backend Feature Specification: Dashboard API & AI Recommendation

## 1. Architectural Overview (BFF Pattern)

To optimize the home page loading performance (especially on Mobile environments), the NestJS Backend will implement the **BFF (Backend For Frontend)** pattern. Instead of making the React Frontend call multiple individual APIs for third-party and internal services, the Backend will act as the Orchestrator.

The system is divided into 3 main modules:
1. **WeatherModule:** Processes weather data (OpenWeatherMap).
2. **RecommendationModule:** Processes AI logic for outfit suggestions (Google Gemini API).
3. **DashboardModule:** The aggregator controller that returns a single payload to the Frontend.

---

## 2. Weather Module Specification

**Objective:** Communicate with OpenWeatherMap to fetch current weather info based on the User's location, serving UI display and acting as input data for the AI.

**Technical Requirements & Constraints:**
* **Third-party Provider:** Use OpenWeatherMap API (Current Weather Data).
* **Caching Mechanism (Mandatory):** Weather is not data that changes every second. To avoid hitting the Rate Limit of the Free API tier and to reduce latency, all requests to OpenWeatherMap MUST pass through a cache (CacheModule or Redis) with a minimum Time-To-Live (TTL) of 30 minutes.
* **Data Transformation:** The OpenWeatherMap API returns a massive payload. This service is responsible for mapping/filtering the data, keeping only the crucial fields the Frontend needs (Current temperature, Icon code, General condition like Rain/Sunny, and short description text), and completely stripping out redundant fields before returning it to the DashboardModule.

---

## 3. Recommendation Module Specification (OOTD)

**Objective:** Act as a Virtual Stylist (AI Stylist). Take the weather context and the user's personal wardrobe as input to select the most logical Outfit Of The Day (OOTD).

**Technical Requirements & Constraints:**
* **Third-party Provider:** Use Google Gemini API.
* **Context Window (Token) Optimization:** When querying the Database (Inventory) to get the user's clothing list to send to Gemini, you are only allowed to `select` text-based metadata (ID, Item Name, Category, Color, Tags). **Absolutely do not** include image URL strings or irrelevant data to save Tokens and speed up AI processing.
* **Prompt Design (System Prompt):** Setup a clear prompt defining Gemini's role (Fashion Stylist), providing temperature variables, weather conditions, and the wardrobe JSON array. Force (instruct strictly) Gemini to return a standard JSON array format containing only the IDs of the selected items, without any extra explanatory text.
* **Fallback & Timeout Mechanism:** Calling AI APIs always carries the risk of delays or timeouts. 
    * Must set a hard timeout for the Gemini request (e.g., max 5000ms).
    * Must wrap the call in a `try-catch` block. If the Gemini API fails, times out, or fails to parse JSON, the module must immediately trigger **Rule-based Logic** (e.g., Automatically query a random top + bottom matching the current weather metadata in the DB) to ensure the API always returns data for the UI.

---

## 4. Dashboard Module Specification (Aggregator)

**Objective:** Serve as the single touchpoint (Single Endpoint) for the Frontend when loading the home page. 

**Execution Flow:**
1.  **Receive Request:** The `GET /dashboard/home` endpoint receives the request from the User (containing location info from query parameters or the user profile).
2.  **Fetch Weather:** Call internally to `WeatherModule` to get weather data (from Cache or fresh fetch).
3.  **Fetch OOTD Suggestion:** Pass the weather data obtained in step 2 along with the User ID to `RecommendationModule`.
4.  **Fetch Auxiliary Data (Optional):** Call `InventoryModule` to get additional widgets for the Dashboard (like the 5 most recently added items, or total wardrobe value statistics).
5.  **Aggregate & Respond:** Bundle all data (Weather, OOTD Items populated with images from DB, Recent Items) into a single JSON Object and return it to the Frontend.

**Swagger & DTO Requirements:**
* The returning DTOs from this Controller must be extremely strictly defined using `class-validator` and `@ApiProperty()` (clearly defining the nested object for weather and the array of items for ootd).
* **Purpose:** Ensure the **Orval** tool can read and understand the Swagger JSON to automatically generate 100% accurate TypeScript Interfaces (`IDashboardResponse`) and React Query Hooks for the Frontend to use.