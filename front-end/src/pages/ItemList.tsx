import { useEffect, useState, useRef } from "react";
import { Heart, MapPin, Plus, Download, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { customInstance } from "../services/api";
import { useStore } from "../store/useStore";
import toast from 'react-hot-toast';
import { UploadZone } from "../components/UploadZone";
import { Sparkles } from "lucide-react";

import { useItemsControllerFindAll, useItemsControllerAutoDetect } from "../api/endpoints/items/items";

type ItemData = {
	_id: string;
	name: string;
	status?: string;
	images?: string[];
	favorite?: boolean;
	category?: { name: string };
	location?: { name: string };
};

export const ItemList = () => {
	const [items, setItems] = useState<ItemData[]>([]);
	const [importing, setImporting] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const toggleFavorite = useStore((state) => state.toggleFavorite);
	const navigate = useNavigate();
	const [showUploadZone, setShowUploadZone] = useState(false);

	const [page, setPage] = useState(1);
	const limit = 10;

	const { data: queryData, refetch, isLoading, isFetching } = useItemsControllerFindAll({ 
		page: page as any, 
		limit: limit as any 
	});

	const autoDetectMutation = useItemsControllerAutoDetect();

	useEffect(() => {
		if (queryData) {
			const res = queryData as any;
			if (res.data) {
				setItems(res.data);
			} else if (Array.isArray(res)) {
				// Fallback if backend hasn't been updated yet
				setItems(res);
			}
		}
	}, [queryData]);

	useEffect(() => {
		const token = localStorage.getItem("token");
		if (!token) return;
		import('socket.io-client').then(({ io }) => {
			const socket = io(import.meta.env.VITE_API_URL || "http://localhost:3000", {
				extraHeaders: { Authorization: `Bearer ${token}` }
			});

			socket.on("itemCompleted", () => {
				refetch();
			});
			
			socket.on("itemFailed", () => {
				refetch();
			});

			return () => {
				socket.disconnect();
			};
		});
	}, []);

	const handleDownloadTemplate = async () => {
		try {
			const response = await customInstance<Blob>({
				url: '/items/export-template',
				method: 'GET',
				responseType: 'blob'
			});
			const url = window.URL.createObjectURL(new Blob([response as any]));
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', 'wardrobe-import-template.xlsx');
			document.body.appendChild(link);
			link.click();
			link.parentNode?.removeChild(link);
		} catch (error) {
			console.error("Export failed", error);
			toast.error("Failed to download template");
		}
	}

	const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setImporting(true);
		try {
			const formData = new FormData();
			formData.append('file', file);
			
			const res = await customInstance<any>({
				url: '/items/import',
				method: 'POST',
				data: formData,
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			});
			
			if ((res as any).errors?.length > 0) {
				toast.error(`Import completed with errors.\nImported: ${(res as any).imported}\nFailed: ${(res as any).failed}`, { duration: 6000 });
			} else {
				toast.success(`Import complete! Imported: ${(res as any).imported}`);
			}
			refetch();
		} catch (err: any) {
			console.error("Import failed", err);
			toast.error("Failed to import items. " + (err.response?.data?.message || err.message));
		} finally {
			setImporting(false);
			if (fileInputRef.current) fileInputRef.current.value = '';
		}
	}

	const handleAiUpload = async (file: File) => {
		await autoDetectMutation.mutateAsync({ data: { file } as any }); 
		refetch(); // refresh grid to show 'Analyzing...' skeleton
	};

	return (
		<div className="relative min-h-[calc(100vh-8rem)]">
			<div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h2 className="text-3xl font-bold text-gray-900 tracking-tight">
						Your Wardrobe
					</h2>
					<p className="text-gray-500 mt-2">
						Manage all your clothing items and accessories here.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<button
						onClick={handleDownloadTemplate}
						className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 shadow-sm transition-colors text-sm font-medium"
					>
						<Download className="w-4 h-4 mr-2" />
						Tải mẫu Excel
					</button>
					<button
						onClick={() => setShowUploadZone(true)}
						className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-colors text-sm font-medium shadow-sm"
					>
						<Sparkles className="w-4 h-4 mr-2" />
						AI Auto-Detect
					</button>
					<button
						onClick={() => fileInputRef.current?.click()}
						disabled={importing}
						className="flex items-center px-4 py-2 bg-primary-50 border border-primary-100 text-primary-700 rounded-xl hover:bg-primary-100 transition-colors text-sm font-medium disabled:opacity-50"
					>
						<Upload className="w-4 h-4 mr-2" />
						{importing ? "Đang nhập..." : "Nhập từ Excel"}
					</button>
					<input 
						type="file" 
						ref={fileInputRef} 
						className="hidden" 
						accept=".xlsx, .xls, .csv" 
						onChange={handleImport} 
					/>
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-20">
				{items.map((item) => (
					<div
						key={item._id}
						className={`bg-surface rounded-2xl shadow-soft hover:shadow-soft-lg transform hover:-translate-y-1 transition-all duration-300 overflow-hidden group border border-gray-100 ${item.status === 'processing' ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
						onClick={() => {
							if (item.status !== 'processing') {
								navigate(`/item/${item._id}`);
							}
						}}
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
							{item.status === 'processing' && (
								<div className="absolute inset-0 bg-white/40 backdrop-blur-md flex items-center justify-center flex-col z-20">
									<Sparkles className="w-8 h-8 text-indigo-500 animate-pulse mb-2" />
									<span className="text-white bg-black/60 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">Analyzing...</span>
								</div>
							)}
							<button
								className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors z-30"
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
				{items.length === 0 && !isLoading && !isFetching && (
					<div className="col-span-full py-12 text-center text-gray-500">
						No items in your wardrobe yet. Click the + button to add
						one!
					</div>
				)}
				{isLoading && (
					<div className="col-span-full py-12 text-center text-gray-400 animate-pulse">
						Loading items...
					</div>
				)}
			</div>

			{/* Pagination Controls */}
			{queryData && (queryData as any).totalPages > 1 && (
				<div className="flex justify-center items-center gap-4 pb-24">
					<button 
						disabled={page === 1}
						onClick={() => setPage(p => Math.max(1, p - 1))}
						className="px-4 py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-50 font-medium text-sm text-gray-700 transition"
					>
						Previous
					</button>
					<span className="text-sm font-medium text-gray-500">
						Page {page} of {(queryData as any).totalPages}
					</span>
					<button 
						disabled={page >= (queryData as any).totalPages}
						onClick={() => setPage(p => p + 1)}
						className="px-4 py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-50 font-medium text-sm text-gray-700 transition"
					>
						Next
					</button>
				</div>
			)}

			<button
				onClick={() => navigate("/add")}
				className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-primary-200 z-40"
			>
				<Plus className="w-6 h-6" />
			</button>

			{showUploadZone && (
				<UploadZone
					onClose={() => setShowUploadZone(false)}
					onUpload={handleAiUpload}
				/>
			)}
		</div>
	);
};
