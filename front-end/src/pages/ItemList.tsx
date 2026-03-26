import { useEffect, useState } from "react";
import { Heart, MapPin, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getItems } from "../api/endpoints/items/items";
import { useStore } from "../store/useStore";

const { itemsControllerFindAll } = getItems();

type ItemData = {
	_id: string;
	name: string;
	images?: string[];
	favorite?: boolean;
	category?: { name: string };
	location?: { name: string };
};

export const ItemList = () => {
	const [items, setItems] = useState<ItemData[]>([]);
	const toggleFavorite = useStore((state) => state.toggleFavorite);
	const navigate = useNavigate();

	useEffect(() => {
		itemsControllerFindAll()
			.then((res: unknown) => {
				console.log("res: ", res);
				if (res) {
					setItems(res as ItemData[]);
				}
			})
			.catch((err) => console.error("Failed to fetch items", err));
	}, []);

	return (
		<div className="relative min-h-[calc(100vh-8rem)]">
			<div className="mb-6">
				<h2 className="text-3xl font-bold text-gray-900 tracking-tight">
					Your Wardrobe
				</h2>
				<p className="text-gray-500 mt-2">
					Manage all your clothing items and accessories here.
				</p>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-20">
				{items.map((item) => (
					<div
						key={item._id}
						className="bg-surface rounded-2xl shadow-soft hover:shadow-soft-lg transform hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer group border border-gray-100"
						onClick={() => navigate(`/item/${item._id}`)}
					>
						<div className="relative aspect-auto h-48 w-full bg-gray-100 overflow-hidden">
							<img
								src={
									item.images && item.images.length > 0
										? item.images[0]
										: "https://images.unsplash.com/photo-1551028719-00167b16eac5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
								}
								alt={item.name}
								className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
							/>
							<button
								className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors z-10"
								onClick={(e) => {
									e.stopPropagation();
									toggleFavorite(item._id);
								}}
							>
								<Heart
									className={`w-5 h-5 transition-colors ${item.favorite ? "fill-red-500 text-red-500" : "text-gray-400"}`}
								/>
							</button>
						</div>

						<div className="p-4">
							<div className="flex justify-between items-start mb-1">
								<h3 className="font-semibold text-gray-900 truncate pr-2">
									{item.name}
								</h3>
								{item.category && (
									<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700 whitespace-nowrap">
										{item.category?.name || ""}
									</span>
								)}
							</div>

							<div className="flex items-center text-sm text-gray-500 mt-3 pt-3 border-t border-gray-100">
								<MapPin className="w-4 h-4 mr-1.5 flex-shrink-0 text-gray-400" />
								<span className="truncate">
									{item.location?.name || "No Location"}
								</span>
							</div>
						</div>
					</div>
				))}
				{items.length === 0 && (
					<div className="col-span-full py-12 text-center text-gray-500">
						No items in your wardrobe yet. Click the + button to add
						one!
					</div>
				)}
			</div>

			<button
				onClick={() => navigate("/add")}
				className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-primary-200 z-40"
			>
				<Plus className="w-6 h-6" />
			</button>
		</div>
	);
};
