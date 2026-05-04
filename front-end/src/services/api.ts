import axios from "axios";

// Create an Axios instance
const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000", // Replace with your actual API base URL
	timeout: 30000, // 30 seconds timeout
});

// Request Interceptor
api.interceptors.request.use(
	(config) => {
		// You can add auth tokens here before the request is sent
		const token = localStorage.getItem("token");
		if (token && config.headers) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

// Response Interceptor
api.interceptors.response.use(
	(response) => {
		// Any status code that lie within the range of 2xx cause this function to trigger
		return response.data; // Usually, we only need the data part
	},
	(error) => {
		// Any status codes that falls outside the range of 2xx cause this function to trigger
		console.error("API Error:", error.response?.data || error.message);

		// Handle global errors (e.g., 401 Unauthorized -> redirect to login)
		if (error.response?.status === 401) {
			localStorage.removeItem("token");
			if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
				window.location.href = "/login";
			}
		}

		// Handle 403 — license limit exceeded → trigger upgrade prompt
		if (error.response?.status === 403) {
			const msg = error.response?.data?.message || "";
			if (msg.includes("limit") || msg.includes("upgrade") || msg.includes("feature")) {
				// Lazy import to avoid circular dependency
				import("../store/useLicenseStore").then(({ useLicenseStore }) => {
					useLicenseStore.getState().triggerUpgradePrompt(msg);
				});
				// Redirect to subscription page
				if (window.location.pathname !== "/subscription") {
					window.location.href = "/subscription";
				}
			}
		}

		return Promise.reject(error);
	},
);

export default api;

export const customInstance = <T>(
	config: import("axios").AxiosRequestConfig,
	options?: import("axios").AxiosRequestConfig,
): Promise<T> => {
	return api({
		...config,
		...options,
	}) as unknown as Promise<T>;
};
