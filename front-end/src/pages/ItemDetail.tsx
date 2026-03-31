import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, ArrowLeft, Image as ImageIcon, Pencil, Loader2 } from "lucide-react";
import { getItems } from "../api/endpoints/items/items";
import { getLocations } from "../api/endpoints/locations/locations";
import toast from "react-hot-toast";

const { itemsControllerFindAllAttributes, itemsControllerFindOne, itemsControllerUpdate } = getItems();
const { locationsControllerGetLocationsTree } = getLocations();

type LocationNode = {
	_id: string;
	name: string;
	children: LocationNode[];
};
type MetaList = { _id: string; name: string }[];

type ItemAPIResponse = {
	name?: string;
	description?: string;
	color?: string;
	category?: { _id: string } | string;
	brand?: { _id: string } | string;
	neckline?: { _id: string } | string;
	occasion?: { _id: string } | string;
	seasonCode?: { _id: string } | string;
	sleeveLength?: { _id: string } | string;
	style?: { _id: string } | string;
	shoulder?: { _id: string } | string;
	size?: { _id: string } | string;
	images?: string[];
	location?: { _id: string; path?: string } | string;
};

export const ItemDetail = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

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
	const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

	const fileInputRef = React.useRef<HTMLInputElement>(null);

	const [locL1, setLocL1] = useState("");
	const [locL2, setLocL2] = useState("");
	const [locL3, setLocL3] = useState("");
	const [locL4, setLocL4] = useState("");

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
		if (!id) return;

		itemsControllerFindOne(id).then((rawRes: unknown) => {
			const res = rawRes as ItemAPIResponse;
			if (res) {
				setName(res.name || "");
				setDescription(res.description || "");
				setColor(res.color || "");
				setCategory(typeof res.category === 'object' ? res.category?._id : res.category || "");
				setBrand(typeof res.brand === 'object' ? res.brand?._id : res.brand || "");
				setNeckline(typeof res.neckline === 'object' ? res.neckline?._id : res.neckline || "");
				setOccasion(typeof res.occasion === 'object' ? res.occasion?._id : res.occasion || "");
				setSeasonCode(typeof res.seasonCode === 'object' ? res.seasonCode?._id : res.seasonCode || "");
				setSleeveLength(typeof res.sleeveLength === 'object' ? res.sleeveLength?._id : res.sleeveLength || "");
				setStyle(typeof res.style === 'object' ? res.style?._id : res.style || "");
				setShoulder(typeof res.shoulder === 'object' ? res.shoulder?._id : res.shoulder || "");
				setSize(typeof res.size === 'object' ? res.size?._id : res.size || "");

				if (res.images && res.images.length > 0) {
					setExistingImageUrl(res.images[0]);
				}

				if (res.location && typeof res.location === 'object' && res.location._id) {
					if (res.location.path) {
						const parts = res.location.path.split('/');
						if (parts[0]) setLocL1(parts[0]);
						if (parts[1]) setLocL2(parts[1]);
						if (parts[2]) setLocL3(parts[2]);
						if (parts[3]) setLocL4(parts[3]);
					} else {
						setLocL1(res.location._id);
					}
				} else if (typeof res.location === 'string') {
					setLocL1(res.location);
				}
			}
		});
	}, [id]);

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
			if (res) {
				setLocationsTree(res as LocationNode[]);
			}
		});
	}, []);

	const getL2Options = () => locationsTree.find((l) => l._id === locL1)?.children || [];
	const getL3Options = () => getL2Options().find((l) => l._id === locL2)?.children || [];
	const getL4Options = () => getL3Options().find((l) => l._id === locL3)?.children || [];

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!id) return;

		const finalLocation = locL4 || locL3 || locL2 || locL1;

		setIsSaving(true);
		try {
			await itemsControllerUpdate(id, {
				name,
				description,
				price: 0,
				location: finalLocation || undefined,
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

			toast.success("Item updated!");
			setIsEditing(false);
		} catch (error) {
			console.error("Failed to update item", error);
			toast.error("Failed to update item. See console for details.");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="max-w-5xl mx-auto pb-12">
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center">
					<button
						onClick={() => navigate(-1)}
						className="mr-4 p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
					>
						<ArrowLeft className="w-5 h-5" />
					</button>
					<div>
						<h2 className="text-3xl font-bold text-gray-900 tracking-tight">
							Item Details
						</h2>
						<p className="text-gray-500 mt-1">
							{isEditing ? "Edit item details below." : "View complete metadata for your item."}
						</p>
					</div>
				</div>
				{!isEditing && (
					<button
						onClick={() => setIsEditing(true)}
						className="p-2 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
					>
						<Pencil className="w-5 h-5" />
					</button>
				)}
			</div>

			<form onSubmit={handleSave}>
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
					<div className="lg:col-span-7 space-y-6">
						<div className="bg-surface p-6 rounded-2xl shadow-soft border border-gray-100">
							<h3 className="text-lg font-semibold text-gray-900 mb-5 pb-3 border-b border-gray-100">
								Item Information
							</h3>

							<div className="space-y-5">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Item Photo
									</label>
									<input
										type="file"
										ref={fileInputRef}
										className="hidden"
										accept="image/*"
										disabled={!isEditing}
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
										onClick={() => isEditing && fileInputRef.current?.click()}
										className={`w-full h-48 rounded-xl border-2 ${isEditing ? 'border-dashed border-gray-300 hover:bg-gray-100 hover:border-primary-400 cursor-pointer' : 'border-solid border-gray-200'} flex flex-col items-center justify-center bg-gray-50 text-gray-500 transition-colors overflow-hidden`}
									>
										{file ? (
											<img
												src={URL.createObjectURL(file)}
												alt="Preview"
												className="w-full h-full object-cover"
											/>
										) : existingImageUrl ? (
											<img
												src={existingImageUrl}
												alt="Existing Preview"
												className="w-full h-full object-cover"
											/>
										) : (
											<>
												<ImageIcon className="w-8 h-8 mb-2 text-gray-400" />
												<span className="text-sm">
													{isEditing ? "Click to upload image" : "No image available"}
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
										disabled={!isEditing}
										onChange={(e) =>
											setName(e.target.value)
										}
										className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-600"
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
											disabled={!isEditing}
											onChange={(e) =>
												setCategory(e.target.value)
											}
											className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-600"
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
											disabled={!isEditing}
											onChange={(e) =>
												setColor(e.target.value)
											}
											className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-600"
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
											disabled={!isEditing}
											onChange={(e) =>
												setBrand(e.target.value)
											}
											className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-600"
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
											disabled={!isEditing}
											onChange={(e) =>
												setSize(e.target.value)
											}
											className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-600"
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
											disabled={!isEditing}
											onChange={(e) =>
												setOccasion(e.target.value)
											}
											className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-600"
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
											disabled={!isEditing}
											onChange={(e) =>
												setSeasonCode(e.target.value)
											}
											className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-600"
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
											disabled={!isEditing}
											onChange={(e) =>
												setStyle(e.target.value)
											}
											className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-600"
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
											disabled={!isEditing}
											onChange={(e) =>
												setNeckline(e.target.value)
											}
											className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-600"
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
											disabled={!isEditing}
											onChange={(e) =>
												setSleeveLength(e.target.value)
											}
											className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-600"
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
											disabled={!isEditing}
											onChange={(e) =>
												setShoulder(e.target.value)
											}
											className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-600"
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
										disabled={!isEditing}
										onChange={(e) =>
											setDescription(e.target.value)
										}
										className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none disabled:bg-gray-50 disabled:text-gray-600"
									/>
								</div>
							</div>
						</div>
					</div>

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
										disabled={!isEditing}
										onChange={(e) => {
											setLocL1(e.target.value);
											setLocL2("");
											setLocL3("");
											setLocL4("");
										}}
										className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-600"
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
										disabled={!isEditing || !locL1}
										onChange={(e) => {
											setLocL2(e.target.value);
											setLocL3("");
											setLocL4("");
										}}
										className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-600"
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
										disabled={!isEditing || !locL2}
										onChange={(e) => {
											setLocL3(e.target.value);
											setLocL4("");
										}}
										className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-600"
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
										disabled={!isEditing || !locL3}
										onChange={(e) =>
											setLocL4(e.target.value)
										}
										className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-600"
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

						{isEditing && (
							<div className="pt-4 flex justify-end">
								<button
									type="button"
									onClick={() => setIsEditing(false)}
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
									{isSaving ? "Saving..." : "Save Changes"}
								</button>
							</div>
						)}
					</div>
				</div>
			</form>
		</div>
	);
};
