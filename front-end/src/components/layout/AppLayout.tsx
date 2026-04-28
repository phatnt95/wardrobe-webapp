import { useState } from "react";
import { Outlet, NavLink, useNavigate, useMatch } from "react-router-dom";
import {
	Menu,
	X,
	Home,
	Heart,
	PlusSquare,
	Shirt,
	User,
	Settings as SettingsIcon,
	LogOut,
	Map,
	Tag,
	ChevronDown,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { NotificationBell } from "../NotificationBell";

export const AppLayout = () => {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const logout = useStore((state) => state.logout);
	const navigate = useNavigate();

	const handleLogout = () => {
		logout();
		navigate("/login");
	};

	const navItems = [
		{ name: "Dashboard", path: "/", icon: <Home className="w-5 h-5 mr-3" /> },
		{ name: "Items", path: "/items", icon: <Shirt className="w-5 h-5 mr-3" /> },
		{ name: "Favorites", path: "/favorites", icon: <Heart className="w-5 h-5 mr-3" /> },
		// { name: "Add Item", path: "/add", icon: <PlusSquare className="w-5 h-5 mr-3" /> },
		{ name: "Outfits", path: "/outfits", icon: <Shirt className="w-5 h-5 mr-3" /> },
		{ name: "Profile", path: "/profile", icon: <User className="w-5 h-5 mr-3" /> },
	];

	const isSettingsActive = !!useMatch({ path: '/settings', end: false });

	const settingsSubItems = [
		{ name: "Locations", path: "/settings/locations", icon: <Map className="w-4 h-4 mr-2" /> },
		{ name: "Attributes", path: "/settings/attributes", icon: <Tag className="w-4 h-4 mr-2" /> },
	];

	return (
		<div className="min-h-screen flex bg-background font-sans text-gray-800">
			{/* Mobile Sidebar Overlay */}
			{isMobileMenuOpen && (
				<div
					className="fixed inset-0 bg-black bg-opacity-50 z-20 sm:hidden transition-opacity"
					onClick={() => setIsMobileMenuOpen(false)}
				/>
			)}

			{/* Sidebar */}
			<aside
				className={`fixed inset-y-0 left-0 z-30 w-64 bg-surface shadow-soft-lg transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} sm:translate-x-0 sm:sticky sm:top-0 sm:h-screen sm:overflow-y-auto sm:flex-shrink-0 flex flex-col`}
			>
				<div className="flex items-center justify-between p-6">
					<h2 className="text-2xl font-bold text-primary-600">
						Wardrobe
					</h2>
					<button
						className="sm:hidden p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
						onClick={() => setIsMobileMenuOpen(false)}
					>
						<X className="w-6 h-6" />
					</button>
				</div>

				<nav className="flex-1 px-4 py-4 space-y-1">
					{navItems.map((item) => (
						<NavLink
							key={item.name}
							to={item.path}
							end
							className={({ isActive }) =>
								`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${isActive
									? "bg-primary-50 text-primary-600 font-semibold shadow-sm"
									: "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
								}`
							}
							onClick={() => setIsMobileMenuOpen(false)}
						>
							{item.icon}
							{item.name}
						</NavLink>
					))}

					{/* Settings with expandable sub-menu */}
					<div>
						<NavLink
							to="/settings"
							className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${isSettingsActive
									? "bg-primary-50 text-primary-600 font-semibold shadow-sm"
									: "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
								}`}
							onClick={() => setIsMobileMenuOpen(false)}
						>
							<SettingsIcon className="w-5 h-5 mr-3" />
							<span className="flex-1">Settings</span>
							<ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSettingsActive ? 'rotate-180' : ''}`} />
						</NavLink>

						{isSettingsActive && (
							<div className="ml-4 mt-1 space-y-1 border-l-2 border-primary-100 pl-3">
								{settingsSubItems.map((sub) => (
									<NavLink
										key={sub.name}
										to={sub.path}
										className={({ isActive }) =>
											`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${isActive
												? "text-primary-600 font-semibold bg-primary-50/60"
												: "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
											}`
										}
										onClick={() => setIsMobileMenuOpen(false)}
									>
										{sub.icon}
										{sub.name}
									</NavLink>
								))}
							</div>
						)}
					</div>
				</nav>

				<div className="p-4 border-t border-gray-100">
					<button
						onClick={handleLogout}
						className="flex items-center w-full px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200"
					>
						<LogOut className="w-5 h-5 mr-3" />
						Logout
					</button>
				</div>
			</aside>

			{/* Main Content */}
			<main className="flex-1 flex flex-col min-w-0 overflow-hidden">
				{/* Mobile Header */}
				<header className="sm:hidden flex items-center justify-between p-4 bg-surface shadow-sm z-10 w-full">
					<div className="flex items-center">
						<button
							onClick={() => setIsMobileMenuOpen(true)}
							className="p-2 mr-3 text-gray-600 hover:text-gray-900 focus:outline-none rounded-md bg-gray-50"
						>
							<Menu className="w-6 h-6" />
						</button>
						<h1 className="text-xl font-bold text-gray-800">
							Wardrobe
						</h1>
					</div>
					<div className="flex items-center space-x-2">
						<NotificationBell />
					</div>
				</header>

				{/* Desktop Header / Top Nav */}
				<header className="hidden sm:flex items-center justify-end p-4 bg-surface shadow-sm z-10 w-full mb-4">
					<div className="flex items-center">
						<NotificationBell />
					</div>
				</header>

				{/* Page Content */}
				<div className="flex-1 overflow-auto p-4 sm:p-8 w-full max-w-7xl mx-auto">
					<Outlet />
				</div>
			</main>
		</div>
	);
};
