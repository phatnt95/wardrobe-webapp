import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { useStore } from "../store/useStore";
import { getItems } from "../api/endpoints/items/items";
import { getLocations } from "../api/endpoints/locations/locations";

const { itemsControllerFindAllAttributes } = getItems();
const { locationsControllerGetLocationsTree } = getLocations();

export const AddItem = () => {
	const navigate = useNavigate();
	const addItem = useStore((state) => state.addItem);

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [color, setColor] = useState("");
	const [category, setCategory] = useState("");

	const [locL1, setLocL1] = useState("");
	const [locL2, setLocL2] = useState("");
	const [locL3, setLocL3] = useState("");
	const [locL4, setLocL4] = useState("");

	useEffect(() => {
		itemsControllerFindAllAttributes().then((res) => {
			console.log("attributes: ", res);
		});
		locationsControllerGetLocationsTree().then((res) => {
			console.log("locations: ", res);
		});
	}, []);

	const handleSave = (e: React.FormEvent) => {
		e.preventDefault();
		addItem({
			id: Date.now().toString(),
			name,
			description,
			color,
			category,
			favorite: false,
			location: {
				location: locL1,
				cabinet: locL2,
				shelf: locL3,
				box: locL4,
			},
			imageUrl:
				"https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
		});
		navigate("/");
	};

	return (
		<div className="max-w-5xl mx-auto pb-12">
			<div className="flex items-center mb-6">
				<button
					onClick={() => navigate(-1)}
					className="mr-4 p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
				>
					<ArrowLeft className="w-5 h-5" />
				</button>
				<div>
					<h2 className="text-3xl font-bold text-gray-900 tracking-tight">
						Add New Item
					</h2>
					<p className="text-gray-500 mt-1">
						Fill in the details below to add an item to your
						wardrobe.
					</p>
				</div>
			</div>

			<form onSubmit={handleSave}>
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
					{/* Section 1 - Item Info */}
					<div className="lg:col-span-7 space-y-6">
						<div className="bg-surface p-6 rounded-2xl shadow-soft border border-gray-100">
							<h3 className="text-lg font-semibold text-gray-900 mb-5 pb-3 border-b border-gray-100">
								Item Information
							</h3>

							<div className="space-y-5">
								{/* Image Placeholder */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Item Photo
									</label>
									<div className="w-full h-48 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50 text-gray-500 hover:bg-gray-100 hover:border-primary-400 transition-colors cursor-pointer">
										<ImageIcon className="w-8 h-8 mb-2 text-gray-400" />
										<span className="text-sm">
											Click to upload image
										</span>
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Item Name
									</label>
									<input
										type="text"
										required
										placeholder="e.g. Vintage Leather Jacket"
										value={name}
										onChange={(e) =>
											setName(e.target.value)
										}
										className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Category
										</label>
										<select
											required
											value={category}
											onChange={(e) =>
												setCategory(e.target.value)
											}
											className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
										>
											<option value="">
												Select Category
											</option>
											<option value="Shirt">Shirt</option>
											<option value="Pants">Pants</option>
											<option value="Jacket">
												Jacket
											</option>
											<option value="Shoes">Shoes</option>
										</select>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Color
										</label>
										<select
											required
											value={color}
											onChange={(e) =>
												setColor(e.target.value)
											}
											className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
										>
											<option value="">
												Select Color
											</option>
											<option value="Black">Black</option>
											<option value="White">White</option>
											<option value="Blue">Blue</option>
											<option value="Red">Red</option>
										</select>
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Description
									</label>
									<textarea
										rows={4}
										placeholder="Write a little bit about this item..."
										value={description}
										onChange={(e) =>
											setDescription(e.target.value)
										}
										className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
									/>
								</div>
							</div>
						</div>
					</div>

					{/* Section 2 - Location Info */}
					<div className="lg:col-span-5 space-y-6">
						<div className="bg-surface p-6 rounded-2xl shadow-soft border border-gray-100">
							<h3 className="text-lg font-semibold text-gray-900 mb-5 pb-3 border-b border-gray-100">
								Item Location
							</h3>

							<div className="space-y-5">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Location (Level 1)
									</label>
									<select
										required
										value={locL1}
										onChange={(e) =>
											setLocL1(e.target.value)
										}
										className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
									>
										<option value="">
											Select Location
										</option>
										<option value="Ha Noi">Ha Noi</option>
										<option value="Ho Chi Minh">
											Ho Chi Minh
										</option>
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Cabinet (Level 2)
									</label>
									<select
										value={locL2}
										onChange={(e) =>
											setLocL2(e.target.value)
										}
										className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white disabled:bg-gray-50"
										disabled={!locL1}
									>
										<option value="">Select Cabinet</option>
										<option value="Cabinet A">
											Cabinet A
										</option>
										<option value="Cabinet B">
											Cabinet B
										</option>
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Shelf (Level 3)
									</label>
									<select
										value={locL3}
										onChange={(e) =>
											setLocL3(e.target.value)
										}
										className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white disabled:bg-gray-50"
										disabled={!locL2}
									>
										<option value="">Select Shelf</option>
										<option value="Shelf 1">Shelf 1</option>
										<option value="Shelf 2">Shelf 2</option>
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Box (Level 4)
									</label>
									<select
										value={locL4}
										onChange={(e) =>
											setLocL4(e.target.value)
										}
										className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white disabled:bg-gray-50"
										disabled={!locL3}
									>
										<option value="">Select Box</option>
										<option value="Box Alpha">
											Box Alpha
										</option>
										<option value="Box Beta">
											Box Beta
										</option>
									</select>
								</div>
							</div>
						</div>

						<div className="pt-4 flex justify-end">
							<button
								type="button"
								onClick={() => navigate(-1)}
								className="px-6 py-3 rounded-xl font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-colors mr-3 shadow-sm"
							>
								Cancel
							</button>
							<button
								type="submit"
								className="flex items-center px-6 py-3 rounded-xl font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm"
							>
								<Save className="w-5 h-5 mr-2" />
								Save Item
							</button>
						</div>
					</div>
				</div>
			</form>
		</div>
	);
};
