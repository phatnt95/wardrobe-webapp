import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, ArrowLeft, Image as ImageIcon, Loader2 } from "lucide-react";
import { useStore, type Item } from "../store/useStore";
import { getItems } from "../api/endpoints/items/items";
import { getLocations } from "../api/endpoints/locations/locations";
import toast from "react-hot-toast";

const { itemsControllerFindAllAttributes, itemsControllerCreate } = getItems();
const { locationsControllerGetLocationsTree } = getLocations();

type LocationNode = {
	_id: string;
	name: string;
	children: LocationNode[];
};

export const AddItem = () => {
	const navigate = useNavigate();
	const addItem = useStore((state) => state.addItem);

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [color, setColor] = useState("");
	const [category, setCategory] = useState("");
	const [brand, setBrand] = useState("");
	const [neckline, setNeckline] = useState("");
	const [occasion, setOccasion] = useState("");
	const [seasonCode, setSeasonCode] = useState("");
	const [sleeveLength, setSleeveLength] = useState("");
	const [style, setStyle] = useState("");
	const [shoulder, setShoulder] = useState("");
	const [size, setSize] = useState("");
	const [file, setFile] = useState<File | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	const fileInputRef = React.useRef<HTMLInputElement>(null);

	const [locL1, setLocL1] = useState("");
	const [locL2, setLocL2] = useState("");
	const [locL3, setLocL3] = useState("");
	const [locL4, setLocL4] = useState("");

	type MetaList = { _id: string; name: string }[];
	const [categories, setCategories] = useState<MetaList>([]);
	const [brands, setBrands] = useState<MetaList>([]);
	const [necklines, setNecklines] = useState<MetaList>([]);
	const [occasions, setOccasions] = useState<MetaList>([]);
	const [seasonCodes, setSeasonCodes] = useState<MetaList>([]);
	const [sleeveLengths, setSleeveLengths] = useState<MetaList>([]);
	const [styles, setStyles] = useState<MetaList>([]);
	const [shoulders, setShoulders] = useState<MetaList>([]);
	const [sizes, setSizes] = useState<MetaList>([]);

	const [locationsTree, setLocationsTree] = useState<LocationNode[]>([]);

	useEffect(() => {
		itemsControllerFindAllAttributes().then((res: unknown) => {
			const data = res as {
				Category?: MetaList;
				Brand?: MetaList;
				Neckline?: MetaList;
				Occasion?: MetaList;
				SeasonCode?: MetaList;
				SleeveLength?: MetaList;
				Style?: MetaList;
				Shoulder?: MetaList;
				Size?: MetaList;
			};
			if (data) {
				if (data.Category) setCategories(data.Category);
				if (data.Brand) setBrands(data.Brand);
				if (data.Neckline) setNecklines(data.Neckline);
				if (data.Occasion) setOccasions(data.Occasion);
				if (data.SeasonCode) setSeasonCodes(data.SeasonCode);
				if (data.SleeveLength) setSleeveLengths(data.SleeveLength);
				if (data.Style) setStyles(data.Style);
				if (data.Shoulder) setShoulders(data.Shoulder);
				if (data.Size) setSizes(data.Size);
			}
		});
		locationsControllerGetLocationsTree().then((res: unknown) => {
			console.log("res: ", res);

			if (res) {
				setLocationsTree(res as LocationNode[]);
			}
		});
	}, []);

	const getL2Options = () =>
		locationsTree.find((l) => l._id === locL1)?.children || [];
	const getL3Options = () =>
		getL2Options().find((l) => l._id === locL2)?.children || [];
	const getL4Options = () =>
		getL3Options().find((l) => l._id === locL3)?.children || [];

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		const finalLocation = locL4 || locL3 || locL2 || locL1;

		console.log("handleSave: ", {
			name,
			description,
			price: 0,
			location: finalLocation,
			brand: brand || undefined,
			category: category || undefined,
			color: color || undefined,
			size: size || undefined,
			style: style || undefined,
			seasonCode: seasonCode || undefined,
			neckline: neckline || undefined,
			occasion: occasion || undefined,
			sleeveLength: sleeveLength || undefined,
			shoulder: shoulder || undefined,
			file: file || undefined,
		});

		setIsSaving(true);
		try {
			const res = await itemsControllerCreate({
				name,
				description,
				price: 0,
				location: finalLocation,
				brand: brand || undefined,
				category: category || undefined,
				color: color || undefined,
				size: size || undefined,
				style: style || undefined,
				seasonCode: seasonCode || undefined,
				neckline: neckline || undefined,
				occasion: occasion || undefined,
				sleeveLength: sleeveLength || undefined,
				shoulder: shoulder || undefined,
				file: file || undefined,
			});

			console.log("res: ", res);

			addItem(res as unknown as Item);
			toast.success("Item saved!");
			navigate("/");
		} catch (error) {
			console.error("Failed to create item", error);
			toast.error("Failed to save item. See console for details.");
		} finally {
			setIsSaving(false);
		}
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
									<input
										type="file"
										ref={fileInputRef}
										className="hidden"
										accept="image/*"
										onChange={(e) => {
											if (
												e.target.files &&
												e.target.files.length > 0
											) {
												setFile(e.target.files[0]);
											}
										}}
									/>
									<div
										onClick={() =>
											fileInputRef.current?.click()
										}
										className="w-full h-48 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50 text-gray-500 hover:bg-gray-100 hover:border-primary-400 transition-colors cursor-pointer overflow-hidden"
									>
										{file ? (
											<img
												src={URL.createObjectURL(file)}
												alt="Preview"
												className="w-full h-full object-cover"
											/>
										) : (
											<>
												<ImageIcon className="w-8 h-8 mb-2 text-gray-400" />
												<span className="text-sm">
													Click to upload image
												</span>
											</>
										)}
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

								<div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
											{categories.map((cat) => (
												<option
													key={cat._id}
													value={cat._id}
												>
													{cat.name}
												</option>
											))}
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
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Brand
										</label>
										<select
											value={brand}
											onChange={(e) =>
												setBrand(e.target.value)
											}
											className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
										>
											<option value="">
												Select Brand
											</option>
											{brands.map((b) => (
												<option
													key={b._id}
													value={b._id}
												>
													{b.name}
												</option>
											))}
										</select>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Size
										</label>
										<select
											value={size}
											onChange={(e) =>
												setSize(e.target.value)
											}
											className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
										>
											<option value="">
												Select Size
											</option>
											{sizes.map((s) => (
												<option
													key={s._id}
													value={s._id}
												>
													{s.name}
												</option>
											))}
										</select>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Occasion
										</label>
										<select
											value={occasion}
											onChange={(e) =>
												setOccasion(e.target.value)
											}
											className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
										>
											<option value="">
												Select Occasion
											</option>
											{occasions.map((o) => (
												<option
													key={o._id}
													value={o._id}
												>
													{o.name}
												</option>
											))}
										</select>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Season
										</label>
										<select
											value={seasonCode}
											onChange={(e) =>
												setSeasonCode(e.target.value)
											}
											className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
										>
											<option value="">
												Select Season
											</option>
											{seasonCodes.map((s) => (
												<option
													key={s._id}
													value={s._id}
												>
													{s.name}
												</option>
											))}
										</select>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Style
										</label>
										<select
											value={style}
											onChange={(e) =>
												setStyle(e.target.value)
											}
											className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
										>
											<option value="">
												Select Style
											</option>
											{styles.map((s) => (
												<option
													key={s._id}
													value={s._id}
												>
													{s.name}
												</option>
											))}
										</select>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Neckline
										</label>
										<select
											value={neckline}
											onChange={(e) =>
												setNeckline(e.target.value)
											}
											className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
										>
											<option value="">
												Select Neckline
											</option>
											{necklines.map((n) => (
												<option
													key={n._id}
													value={n._id}
												>
													{n.name}
												</option>
											))}
										</select>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Sleeve Length
										</label>
										<select
											value={sleeveLength}
											onChange={(e) =>
												setSleeveLength(e.target.value)
											}
											className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
										>
											<option value="">
												Select Sleeve Length
											</option>
											{sleeveLengths.map((s) => (
												<option
													key={s._id}
													value={s._id}
												>
													{s.name}
												</option>
											))}
										</select>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Shoulder
										</label>
										<select
											value={shoulder}
											onChange={(e) =>
												setShoulder(e.target.value)
											}
											className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
										>
											<option value="">
												Select Shoulder
											</option>
											{shoulders.map((s) => (
												<option
													key={s._id}
													value={s._id}
												>
													{s.name}
												</option>
											))}
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
										onChange={(e) => {
											setLocL1(e.target.value);
											setLocL2("");
											setLocL3("");
											setLocL4("");
										}}
										className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
									>
										<option value="">
											Select Location
										</option>
										{locationsTree.map((loc) => (
											<option
												key={loc._id}
												value={loc._id}
											>
												{loc.name}
											</option>
										))}
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Cabinet (Level 2)
									</label>
									<select
										value={locL2}
										onChange={(e) => {
											setLocL2(e.target.value);
											setLocL3("");
											setLocL4("");
										}}
										className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white disabled:bg-gray-50"
										disabled={!locL1}
									>
										<option value="">Select Cabinet</option>
										{getL2Options().map((loc) => (
											<option
												key={loc._id}
												value={loc._id}
											>
												{loc.name}
											</option>
										))}
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Shelf (Level 3)
									</label>
									<select
										value={locL3}
										onChange={(e) => {
											setLocL3(e.target.value);
											setLocL4("");
										}}
										className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white disabled:bg-gray-50"
										disabled={!locL2}
									>
										<option value="">Select Shelf</option>
										{getL3Options().map((loc) => (
											<option
												key={loc._id}
												value={loc._id}
											>
												{loc.name}
											</option>
										))}
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
										{getL4Options().map((loc) => (
											<option
												key={loc._id}
												value={loc._id}
											>
												{loc.name}
											</option>
										))}
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
								disabled={isSaving}
								className="flex items-center px-6 py-3 rounded-xl font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
							>
								{isSaving ? (
									<Loader2 className="w-5 h-5 mr-2 animate-spin" />
								) : (
									<Save className="w-5 h-5 mr-2" />
								)}
								{isSaving ? "Saving..." : "Save Item"}
							</button>
						</div>
					</div>
				</div>
			</form>
		</div>
	);
};
