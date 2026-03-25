import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { Shirt } from "lucide-react";
import { getAuth } from "../api/endpoints/auth/auth";

const { authControllerLogin } = getAuth();

export const Login = () => {
	const [username, setUsername] = useState("user@example.com");
	const [password, setPassword] = useState("Password123");
	const login = useStore((state) => state.login);
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const response = (await authControllerLogin({
				email: username,
				password,
			})) as unknown as { access_token: string };

			const token = response.access_token;
			if (token) {
				console.log("token: ", token);

				localStorage.setItem("token", token);

				// Decode JWT to set user info in store
				const payloadBase64 = token.split(".")[1];
				const decodedPayload = JSON.parse(atob(payloadBase64));

				login({
					id: decodedPayload.sub,
					name: decodedPayload.email, // Adjust according to your needs
					username: decodedPayload.email,
				});
				navigate("/");
			}
		} catch (error) {
			console.error("Login failed:", error);
			alert("Login failed. Please check your credentials.");
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full bg-surface p-8 rounded-3xl shadow-soft-lg border border-gray-100 transform transition-all">
				<div className="text-center mb-10">
					<div className="mx-auto h-16 w-16 bg-primary-50 rounded-full flex items-center justify-center mb-4 text-primary-600 shadow-inner">
						<Shirt className="h-8 w-8" />
					</div>
					<h2 className="text-3xl font-bold text-gray-900 mb-2">
						Welcome Back
					</h2>
					<p className="text-sm text-gray-500">
						Sign in to manage your wardrobe
					</p>
				</div>

				<form className="space-y-6" onSubmit={handleSubmit}>
					<div>
						<label
							className="block text-sm font-medium text-gray-700 mb-1"
							htmlFor="username"
						>
							Username
						</label>
						<input
							id="username"
							type="text"
							required
							className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
							placeholder="Enter your username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
						/>
					</div>

					<div>
						<label
							className="block text-sm font-medium text-gray-700 mb-1"
							htmlFor="password"
						>
							Password
						</label>
						<input
							id="password"
							type="password"
							required
							className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
							placeholder="Enter your password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
					</div>

					<div>
						<button
							type="submit"
							className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none ring-2 ring-primary-500 ring-offset-2 transition-all shadow-md mt-4"
						>
							Sign In
						</button>
					</div>
				</form>

				<div className="mt-8">
					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t border-gray-200" />
						</div>
						<div className="relative flex justify-center text-sm">
							<span className="px-2 bg-surface text-gray-500">
								Or continue with
							</span>
						</div>
					</div>

					<div className="mt-6 grid grid-cols-2 gap-4">
						<button className="w-full flex justify-center items-center py-3 px-4 border border-gray-200 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
							<img
								src="https://www.svgrepo.com/show/475656/google-color.svg"
								alt="Google"
								className="h-5 w-5 mr-2"
							/>
							Google
						</button>
						<button className="w-full flex justify-center items-center py-3 px-4 border border-gray-200 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
							<img
								src="https://www.svgrepo.com/show/448224/facebook.svg"
								alt="Facebook"
								className="h-5 w-5 mr-2"
							/>
							Facebook
						</button>
					</div>
				</div>

				<div className="mt-8 text-center text-sm">
					<span className="text-gray-500">
						Don't have an account?{" "}
					</span>
					<Link
						to="/register"
						className="font-semibold text-primary-600 hover:text-primary-500 transition-colors"
					>
						Register here
					</Link>
				</div>
			</div>
		</div>
	);
};
