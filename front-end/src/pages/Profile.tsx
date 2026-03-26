import { useEffect, useRef, useState } from "react";
import {
	User,
	Camera,
	Save,
	KeyRound,
	Ruler,
	Palette,
	ChevronRight,
	Eye,
	EyeOff,
	CheckCircle2,
} from "lucide-react";
import {
	profileApi,
	type UserProfile,
	type UpdateProfilePayload,
	type BodyMeasurements,
	type StylePreferences,
} from "../api/endpoints/profile/profile";

// ── Constants ────────────────────────────────────────────────────────────────
const STYLE_OPTIONS = [
	"Casual",
	"Streetwear",
	"Office / Business",
	"Formal",
	"Sporty / Athletic",
	"Minimalist",
	"Bohemian",
	"Vintage",
];

const COLOR_OPTIONS = [
	{ label: "Black", hex: "#1a1a1a" },
	{ label: "White", hex: "#f8f8f8" },
	{ label: "Navy", hex: "#1e3a5f" },
	{ label: "Grey", hex: "#6b7280" },
	{ label: "Beige", hex: "#d5b99b" },
	{ label: "Olive", hex: "#6b7028" },
	{ label: "Burgundy", hex: "#6d1414" },
	{ label: "Blush", hex: "#e8a0a0" },
	{ label: "Sky Blue", hex: "#7ec8e3" },
	{ label: "Forest", hex: "#2d6a4f" },
	{ label: "Camel", hex: "#c19a6b" },
	{ label: "Lavender", hex: "#b39ddb" },
];

// ── Sidebar nav labels ───────────────────────────────────────────────────────
type Section = "basic" | "measurements" | "style" | "password";

const SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
	{
		id: "basic",
		label: "Basic Information",
		icon: <User className="w-4 h-4" />,
	},
	{
		id: "measurements",
		label: "Body Measurements",
		icon: <Ruler className="w-4 h-4" />,
	},
	{
		id: "style",
		label: "Style Preferences",
		icon: <Palette className="w-4 h-4" />,
	},
	{
		id: "password",
		label: "Change Password",
		icon: <KeyRound className="w-4 h-4" />,
	},
];

// ── Toast helper ─────────────────────────────────────────────────────────────
const Toast = ({ message }: { message: string }) => (
	<div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl animate-fade-in">
		<CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
		{message}
	</div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
export const ProfilePage = () => {
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [activeSection, setActiveSection] = useState<Section>("basic");
	const [saving, setSaving] = useState(false);
	const [toast, setToast] = useState("");

	const showToast = (msg: string) => {
		setToast(msg);
		setTimeout(() => setToast(""), 3000);
	};

	useEffect(() => {
		profileApi.getProfile().then(setProfile).catch(console.error);
	}, []);

	return (
		<div className="max-w-5xl mx-auto pb-12">
			{/* Header */}
			<div className="mb-6">
				<h2 className="text-3xl font-bold text-gray-900 tracking-tight">
					My Profile
				</h2>
				<p className="text-gray-500 mt-1">
					Manage your personal information and preferences.
				</p>
			</div>

			<div className="flex flex-col md:flex-row gap-6">
				{/* ── Sidebar nav ─── */}
				<aside className="md:w-56 flex-shrink-0">
					{/* Avatar card */}
					<AvatarCard profile={profile} onUpdate={setProfile} />

					{/* Nav */}
					<nav className="mt-4 bg-surface rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
						{SECTIONS.map((s) => (
							<button
								key={s.id}
								onClick={() => setActiveSection(s.id)}
								className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors text-left
                  ${
						activeSection === s.id
							? "bg-primary-50 text-primary-700 border-r-2 border-primary-600"
							: "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
					}`}
							>
								{s.icon}
								{s.label}
								<ChevronRight
									className={`w-3.5 h-3.5 ml-auto transition-opacity ${activeSection === s.id ? "opacity-100" : "opacity-0"}`}
								/>
							</button>
						))}
					</nav>
				</aside>

				{/* ── Content panel ── */}
				<div className="flex-1 min-w-0">
					{activeSection === "basic" && profile && (
						<BasicInfoSection
							profile={profile}
							saving={saving}
							setSaving={setSaving}
							onUpdate={(p) => {
								setProfile(p);
								showToast("Profile updated!");
							}}
						/>
					)}
					{activeSection === "measurements" && profile && (
						<MeasurementsSection
							profile={profile}
							saving={saving}
							setSaving={setSaving}
							onUpdate={(p) => {
								setProfile(p);
								showToast("Measurements saved!");
							}}
						/>
					)}
					{activeSection === "style" && profile && (
						<StyleSection
							profile={profile}
							saving={saving}
							setSaving={setSaving}
							onUpdate={(p) => {
								setProfile(p);
								showToast("Style preferences saved!");
							}}
						/>
					)}
					{activeSection === "password" && (
						<PasswordSection
							saving={saving}
							setSaving={setSaving}
							onSuccess={() =>
								showToast("Password changed successfully!")
							}
						/>
					)}
				</div>
			</div>

			{toast && <Toast message={toast} />}
		</div>
	);
};

// ── Avatar Card ──────────────────────────────────────────────────────────────
const AvatarCard = ({
	profile,
	onUpdate,
}: {
	profile: UserProfile | null;
	onUpdate: (p: UserProfile) => void;
}) => {
	const ref = useRef<HTMLInputElement>(null);
	const [uploading, setUploading] = useState(false);

	const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setUploading(true);
		try {
			const updated = await profileApi.uploadAvatar(file);
			onUpdate(updated);
		} catch (err) {
			console.error("Avatar upload failed", err);
		} finally {
			setUploading(false);
		}
	};

	const initials = profile
		? `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase() ||
			"U"
		: "…";

	return (
		<div className="bg-surface p-5 rounded-2xl shadow-soft border border-gray-100 flex flex-col items-center">
			<div
				className="relative group cursor-pointer"
				onClick={() => ref.current?.click()}
			>
				{profile?.avatarUrl ? (
					<img
						src={profile.avatarUrl}
						alt="Avatar"
						className="w-20 h-20 rounded-full object-cover ring-4 ring-primary-100"
					/>
				) : (
					<div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center ring-4 ring-primary-50">
						<span className="text-2xl font-bold text-primary-600">
							{initials}
						</span>
					</div>
				)}
				<div
					className={`absolute inset-0 rounded-full bg-black/40 flex items-center justify-center
          transition-opacity ${uploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
				>
					<Camera className="w-6 h-6 text-white" />
				</div>
			</div>
			<input
				ref={ref}
				type="file"
				className="hidden"
				accept="image/*"
				onChange={handleFile}
			/>

			<p className="mt-3 font-semibold text-gray-900 text-center truncate w-full text-sm">
				{profile
					? `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim() ||
						"—"
					: "…"}
			</p>
			<p className="text-xs text-gray-500 truncate w-full text-center">
				{profile?.email}
			</p>
			<p
				className="text-xs text-primary-500 mt-2 cursor-pointer hover:underline"
				onClick={() => ref.current?.click()}
			>
				{uploading ? "Uploading…" : "Change photo"}
			</p>
		</div>
	);
};

// ── Basic Info Section ───────────────────────────────────────────────────────
const BasicInfoSection = ({
	profile,
	saving,
	setSaving,
	onUpdate,
}: {
	profile: UserProfile;
	saving: boolean;
	setSaving: (v: boolean) => void;
	onUpdate: (p: UserProfile) => void;
}) => {
	const [form, setForm] = useState({
		firstName: profile.firstName ?? "",
		lastName: profile.lastName ?? "",
		phone: profile.phone ?? "",
		dateOfBirth: profile.dateOfBirth
			? profile.dateOfBirth.slice(0, 10)
			: "",
		bio: profile.bio ?? "",
	});

	const set =
		(k: keyof typeof form) =>
		(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
			setForm((prev) => ({ ...prev, [k]: e.target.value }));

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		try {
			const updated = await profileApi.updateProfile(form);
			onUpdate(updated);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="bg-surface p-6 rounded-2xl shadow-soft border border-gray-100">
			<h3 className="text-lg font-semibold text-gray-900 mb-5 pb-3 border-b border-gray-100">
				Basic Information
			</h3>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<Field label="First Name">
						<input
							value={form.firstName}
							onChange={set("firstName")}
							placeholder="John"
							className={inputClass}
						/>
					</Field>
					<Field label="Last Name">
						<input
							value={form.lastName}
							onChange={set("lastName")}
							placeholder="Doe"
							className={inputClass}
						/>
					</Field>
				</div>
				<Field label="Phone Number">
					<input
						value={form.phone}
						onChange={set("phone")}
						type="tel"
						placeholder="+84 901 234 567"
						className={inputClass}
					/>
				</Field>
				<Field label="Date of Birth">
					<input
						value={form.dateOfBirth}
						onChange={set("dateOfBirth")}
						type="date"
						className={inputClass}
					/>
				</Field>
				<Field label="Bio">
					<textarea
						value={form.bio}
						onChange={set("bio")}
						rows={3}
						placeholder="Tell us a little about yourself…"
						className={`${inputClass} resize-none`}
					/>
				</Field>
				<div className="flex justify-end pt-2">
					<SaveButton saving={saving} />
				</div>
			</form>
		</div>
	);
};

// ── Measurements Section ─────────────────────────────────────────────────────
const MeasurementsSection = ({
	profile,
	saving,
	setSaving,
	onUpdate,
}: {
	profile: UserProfile;
	saving: boolean;
	setSaving: (v: boolean) => void;
	onUpdate: (p: UserProfile) => void;
}) => {
	const [form, setForm] = useState<BodyMeasurements>(
		profile.measurements ?? {},
	);

	const set =
		(k: keyof BodyMeasurements) =>
		(e: React.ChangeEvent<HTMLInputElement>) =>
			setForm((prev) => ({
				...prev,
				[k]: e.target.value === "" ? undefined : Number(e.target.value),
			}));

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		try {
			const updated = await profileApi.updateProfile({
				measurements: form,
			} as UpdateProfilePayload);
			onUpdate(updated);
		} finally {
			setSaving(false);
		}
	};

	const numInput = (
		label: string,
		key: keyof BodyMeasurements,
		unit: string,
	) => (
		<Field label={`${label} (${unit})`} key={key}>
			<div className="relative">
				<input
					type="number"
					min={0}
					placeholder="—"
					value={form[key] ?? ""}
					onChange={set(key)}
					className={`${inputClass} pr-12`}
				/>
				<span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
					{unit}
				</span>
			</div>
		</Field>
	);

	return (
		<div className="bg-surface p-6 rounded-2xl shadow-soft border border-gray-100">
			<h3 className="text-lg font-semibold text-gray-900 mb-1 ">
				Body Measurements
			</h3>
			<p className="text-sm text-gray-500 mb-5 pb-3 border-b border-gray-100">
				Used to suggest well-fitting outfits for your body type.
			</p>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="grid grid-cols-2 gap-4">
					{numInput("Height", "height", "cm")}
					{numInput("Weight", "weight", "kg")}
				</div>
				<div className="grid grid-cols-3 gap-4">
					{numInput("Chest", "chest", "cm")}
					{numInput("Waist", "waist", "cm")}
					{numInput("Hips", "hips", "cm")}
				</div>
				<div className="flex justify-end pt-2">
					<SaveButton saving={saving} />
				</div>
			</form>
		</div>
	);
};

// ── Style Preferences Section ─────────────────────────────────────────────────
const StyleSection = ({
	profile,
	saving,
	setSaving,
	onUpdate,
}: {
	profile: UserProfile;
	saving: boolean;
	setSaving: (v: boolean) => void;
	onUpdate: (p: UserProfile) => void;
}) => {
	const [prefs, setPrefs] = useState<StylePreferences>({
		favoriteStyles: profile.stylePreferences?.favoriteStyles ?? [],
		colorPalette: profile.stylePreferences?.colorPalette ?? [],
	});

	const toggleStyle = (s: string) =>
		setPrefs((prev) => ({
			...prev,
			favoriteStyles: prev.favoriteStyles.includes(s)
				? prev.favoriteStyles.filter((x) => x !== s)
				: [...prev.favoriteStyles, s],
		}));

	const toggleColor = (hex: string) =>
		setPrefs((prev) => ({
			...prev,
			colorPalette: prev.colorPalette.includes(hex)
				? prev.colorPalette.filter((x) => x !== hex)
				: [...prev.colorPalette, hex],
		}));

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		try {
			const updated = await profileApi.updateProfile({
				stylePreferences: prefs,
			} as UpdateProfilePayload);
			onUpdate(updated);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="bg-surface p-6 rounded-2xl shadow-soft border border-gray-100">
			<h3 className="text-lg font-semibold text-gray-900 mb-5 pb-3 border-b border-gray-100">
				Style Preferences
			</h3>
			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Favorite styles */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-3">
						Favorite Styles
					</label>
					<div className="flex flex-wrap gap-2">
						{STYLE_OPTIONS.map((s) => {
							const active = prefs.favoriteStyles.includes(s);
							return (
								<button
									key={s}
									type="button"
									onClick={() => toggleStyle(s)}
									className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
										active
											? "bg-primary-600 border-primary-600 text-white shadow-sm"
											: "bg-white border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600"
									}`}
								>
									{s}
								</button>
							);
						})}
					</div>
				</div>

				{/* Color palette */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-3">
						Personal Color Palette
					</label>
					<div className="flex flex-wrap gap-3">
						{COLOR_OPTIONS.map(({ label, hex }) => {
							const active = prefs.colorPalette.includes(hex);
							return (
								<button
									key={hex}
									type="button"
									title={label}
									onClick={() => toggleColor(hex)}
									className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center ${
										active
											? "border-primary-600 scale-110 shadow-md"
											: "border-white shadow-sm hover:scale-105"
									}`}
									style={{ backgroundColor: hex }}
								>
									{active && (
										<svg
											className="w-4 h-4"
											fill="none"
											viewBox="0 0 24 24"
										>
											<path
												stroke={
													hex === "#f8f8f8"
														? "#333"
														: "white"
												}
												strokeWidth={2.5}
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M5 13l4 4L19 7"
											/>
										</svg>
									)}
								</button>
							);
						})}
					</div>
					{prefs.colorPalette.length > 0 && (
						<p className="mt-2 text-xs text-gray-500">
							{prefs.colorPalette.length} color
							{prefs.colorPalette.length > 1 ? "s" : ""} selected
						</p>
					)}
				</div>

				<div className="flex justify-end pt-2">
					<SaveButton saving={saving} />
				</div>
			</form>
		</div>
	);
};

// ── Change Password Section ───────────────────────────────────────────────────
const PasswordSection = ({
	saving,
	setSaving,
	onSuccess,
}: {
	saving: boolean;
	setSaving: (v: boolean) => void;
	onSuccess: () => void;
}) => {
	const [form, setForm] = useState({
		oldPassword: "",
		newPassword: "",
		confirm: "",
	});
	const [show, setShow] = useState({
		old: false,
		new: false,
		confirm: false,
	});
	const [error, setError] = useState("");

	const set =
		(k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
			setForm((prev) => ({ ...prev, [k]: e.target.value }));
			setError("");
		};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (form.newPassword !== form.confirm) {
			setError("New passwords do not match.");
			return;
		}
		if (form.newPassword.length < 6) {
			setError("New password must be at least 6 characters.");
			return;
		}
		setSaving(true);
		try {
			await profileApi.changePassword({
				oldPassword: form.oldPassword,
				newPassword: form.newPassword,
			});
			setForm({ oldPassword: "", newPassword: "", confirm: "" });
			onSuccess();
		} catch {
			setError("Old password is incorrect. Please try again.");
		} finally {
			setSaving(false);
		}
	};

	const pwdInput = (
		label: string,
		key: keyof typeof form,
		showKey: keyof typeof show,
	) => (
		<Field label={label}>
			<div className="relative">
				<input
					type={show[showKey] ? "text" : "password"}
					value={form[key]}
					onChange={set(key)}
					placeholder="••••••••"
					className={`${inputClass} pr-10`}
					required
				/>
				<button
					type="button"
					tabIndex={-1}
					onClick={() =>
						setShow((p) => ({ ...p, [showKey]: !p[showKey] }))
					}
					className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
				>
					{show[showKey] ? (
						<EyeOff className="w-4 h-4" />
					) : (
						<Eye className="w-4 h-4" />
					)}
				</button>
			</div>
		</Field>
	);

	return (
		<div className="bg-surface p-6 rounded-2xl shadow-soft border border-gray-100">
			<h3 className="text-lg font-semibold text-gray-900 mb-1">
				Change Password
			</h3>
			<p className="text-sm text-gray-500 mb-5 pb-3 border-b border-gray-100">
				You must provide your current password before setting a new one.
			</p>
			<form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
				{pwdInput("Current Password", "oldPassword", "old")}
				{pwdInput("New Password", "newPassword", "new")}
				{pwdInput("Confirm New Password", "confirm", "confirm")}
				{error && (
					<p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
						{error}
					</p>
				)}
				<div className="flex justify-end pt-2">
					<SaveButton saving={saving} label="Change Password" />
				</div>
			</form>
		</div>
	);
};

// ── Shared helpers ───────────────────────────────────────────────────────────
const inputClass =
	"w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white";

const Field = ({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) => (
	<div>
		<label className="block text-sm font-medium text-gray-700 mb-1">
			{label}
		</label>
		{children}
	</div>
);

const SaveButton = ({
	saving,
	label = "Save Changes",
}: {
	saving: boolean;
	label?: string;
}) => (
	<button
		type="submit"
		disabled={saving}
		className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700
      text-white text-sm font-medium disabled:opacity-60 transition-colors shadow-sm"
	>
		<Save className="w-4 h-4" />
		{saving ? "Saving…" : label}
	</button>
);
