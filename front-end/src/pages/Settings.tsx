import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useMatch } from 'react-router-dom';
import { Settings2, Map, Tag, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { getItems } from '../api/endpoints/items/items';
import { getLocations } from '../api/endpoints/locations/locations';
import { CreateLocationDtoType } from '../api/model/createLocationDtoType';

const {
    itemsControllerFindAllAttributes,
    itemsControllerCreateAttribute,
    itemsControllerUpdateAttribute,
    itemsControllerRemoveAttribute,
} = getItems();

const {
    locationsControllerFindAll,
    locationsControllerCreate,
    locationsControllerUpdate,
    locationsControllerRemove,
} = getLocations();

// ─── Shared Types ──────────────────────────────────────────────────────────────

type MetaItem = { _id: string; name: string };
type LocationItem = { _id: string; name: string; parent: string | null; type: string; path?: string };

const NODE_TYPE_OPTIONS = [
    'LOCATION', 'HOUSE', 'ROOM', 'CABINET', 'SHELF', 'BOX', 'CLOSET', 'SECTION', 'DRESSER', 'DRAWER',
];

const TYPE_COLORS: Record<string, string> = {
    LOCATION: 'bg-blue-50 text-blue-600',
    HOUSE:    'bg-purple-50 text-purple-600',
    ROOM:     'bg-indigo-50 text-indigo-600',
    CABINET:  'bg-amber-50 text-amber-700',
    SHELF:    'bg-yellow-50 text-yellow-700',
    BOX:      'bg-orange-50 text-orange-600',
    CLOSET:   'bg-teal-50 text-teal-600',
    SECTION:  'bg-green-50 text-green-700',
    DRESSER:  'bg-rose-50 text-rose-600',
    DRAWER:   'bg-pink-50 text-pink-600',
};

// ─── Shared Inline Modal ───────────────────────────────────────────────────────

interface ModalProps {
    isOpen: boolean;
    title: string;
    value: string;
    onChange: (v: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
    confirmLabel?: string;
    loading?: boolean;
}

const InlineModal: React.FC<ModalProps> = ({
    isOpen, title, value, onChange, onConfirm, onCancel, confirmLabel = 'Save', loading = false,
}) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4 animate-[fadeInUp_0.2s_ease]">
                <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                <input
                    autoFocus
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') onConfirm(); if (e.key === 'Escape') onCancel(); }}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm text-gray-800 bg-gray-50"
                    placeholder="Enter name..."
                />
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading || !value.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                    >
                        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Settings Shell ────────────────────────────────────────────────────────────

export const Settings = () => {
    const isSettingsRoot = useMatch('/settings');

    const subNav = [
        { path: '/settings/locations', label: 'Locations', icon: <Map className="w-4 h-4" /> },
        { path: '/settings/attributes', label: 'Attributes', icon: <Tag className="w-4 h-4" /> },
    ];

    return (
        <div className="max-w-5xl mx-auto pb-12">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h2>
                <p className="text-gray-500 mt-1">Manage your app metadata and storage locations.</p>
            </div>

            {/* Sub-nav tabs */}
            <div className="flex gap-2 mb-8 border-b border-gray-100 pb-0">
                {subNav.map(({ path, label, icon }) => (
                    <NavLink
                        key={path}
                        to={path}
                        className={({ isActive }) =>
                            `flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                                isActive
                                    ? 'border-primary-600 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                            }`
                        }
                    >
                        {icon} {label}
                    </NavLink>
                ))}
            </div>

            {/* Default landing: redirect hint */}
            {isSettingsRoot && (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-3">
                    <Settings2 className="w-10 h-10 opacity-30" />
                    <p className="text-sm">Select a section above to get started.</p>
                </div>
            )}

            <Outlet />
        </div>
    );
};

// ─── LocationManager ───────────────────────────────────────────────────────────

interface LocationModalState {
    mode: 'add' | 'edit';
    id?: string;
    name: string;
    type: string;
    parentId: string;
}

export const LocationManager = () => {
    const [locations, setLocations] = useState<LocationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<LocationModalState | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchLocations = () => {
        setLoading(true);
        setError(null);
        locationsControllerFindAll().then((rawRes: unknown) => {
            const res = rawRes as LocationItem[];
            if (Array.isArray(res)) {
                setLocations(res);
            } else {
                setError('Unexpected response from server.');
            }
        }).catch(() => {
            setError('Failed to load locations. Please try again.');
        }).finally(() => setLoading(false));
    };

    useEffect(() => { fetchLocations(); }, []);

    const openAdd = () => setModal({ mode: 'add', name: '', type: 'LOCATION', parentId: '' });
    const openEdit = (item: LocationItem) => setModal({
        mode: 'edit',
        id: item._id,
        name: item.name,
        type: item.type,
        parentId: item.parent ?? '',
    });
    const closeModal = () => setModal(null);

    const handleConfirm = async () => {
        if (!modal || !modal.name.trim()) return;
        setSaving(true);
        try {
            const dto = {
                name: modal.name.trim(),
                type: modal.type as CreateLocationDtoType,
                ...(modal.parentId ? { parent: modal.parentId } : {}),
            };
            if (modal.mode === 'add') {
                await locationsControllerCreate(dto);
            } else if (modal.mode === 'edit' && modal.id) {
                await locationsControllerUpdate(modal.id, dto);
            }
            closeModal();
            fetchLocations();
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Delete "${name}"? This action cannot be undone.`)) return;
        await locationsControllerRemove(id);
        fetchLocations();
    };

    const getParentName = (parentId: string | null) => {
        if (!parentId) return null;
        return locations.find(l => l._id === parentId)?.name ?? null;
    };

    return (
        <div>
            {/* Extended location modal */}
            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4 animate-[fadeInUp_0.2s_ease]">
                        <h3 className="text-lg font-semibold text-gray-800">
                            {modal.mode === 'add' ? 'Add New Location' : 'Edit Location'}
                        </h3>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</label>
                            <input
                                autoFocus
                                type="text"
                                value={modal.name}
                                onChange={e => setModal(m => m ? { ...m, name: e.target.value } : m)}
                                onKeyDown={e => { if (e.key === 'Enter') handleConfirm(); if (e.key === 'Escape') closeModal(); }}
                                className="px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm text-gray-800 bg-gray-50"
                                placeholder="e.g. Main Wardrobe"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</label>
                            <select
                                value={modal.type}
                                onChange={e => setModal(m => m ? { ...m, type: e.target.value } : m)}
                                className="px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm text-gray-800 bg-gray-50"
                            >
                                {NODE_TYPE_OPTIONS.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Parent (optional)</label>
                            <select
                                value={modal.parentId}
                                onChange={e => setModal(m => m ? { ...m, parentId: e.target.value } : m)}
                                className="px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm text-gray-800 bg-gray-50"
                            >
                                <option value="">— None (root) —</option>
                                {locations
                                    .filter(l => l._id !== modal.id)
                                    .map(l => (
                                        <option key={l._id} value={l._id}>{l.name}</option>
                                    ))}
                            </select>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-100 transition-colors">Cancel</button>
                            <button
                                onClick={handleConfirm}
                                disabled={saving || !modal.name.trim()}
                                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                            >
                                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                {modal.mode === 'add' ? 'Add' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-50 text-primary-600 rounded-xl">
                            <Map className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Storage Locations</h3>
                            <p className="text-xs text-gray-400">{locations.length} location{locations.length !== 1 ? 's' : ''} total</p>
                        </div>
                    </div>
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Add Location
                    </button>
                </div>

                {error && (
                    <div className="mx-6 mt-4 px-4 py-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center h-40 text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                ) : locations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
                        <Map className="w-8 h-8 opacity-30" />
                        <p className="text-sm">No locations yet. Add one to get started.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-50">
                        {locations.map(item => {
                            const parentName = getParentName(item.parent);
                            const typeColor = TYPE_COLORS[item.type] ?? 'bg-gray-100 text-gray-500';
                            return (
                                <li key={item._id} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors group">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {parentName && (
                                            <span className="text-xs text-gray-400 font-mono shrink-0">↳</span>
                                        )}
                                        <div className="min-w-0">
                                            <span className="text-sm text-gray-800 font-medium block truncate">{item.name}</span>
                                            {parentName && (
                                                <span className="text-xs text-gray-400 truncate block">in {parentName}</span>
                                            )}
                                        </div>
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${typeColor}`}>
                                            {item.type}
                                        </span>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                                        <button
                                            onClick={() => openEdit(item)}
                                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item._id, item.name)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
};


// ─── AttributeCrudTable ────────────────────────────────────────────────────────

interface AttributeCrudTableProps {
    attributeType: string;
    items: MetaItem[];
    onRefresh: () => void;
}

const AttributeCrudTable: React.FC<AttributeCrudTableProps> = ({ attributeType, items, onRefresh }) => {
    const [modal, setModal] = useState<{ mode: 'add' | 'edit'; id?: string } | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [saving, setSaving] = useState(false);

    const openAdd = () => { setInputValue(''); setModal({ mode: 'add' }); };
    const openEdit = (id: string, name: string) => { setInputValue(name); setModal({ mode: 'edit', id }); };
    const closeModal = () => { setModal(null); setInputValue(''); };

    const handleConfirm = async () => {
        if (!inputValue.trim()) return;
        setSaving(true);
        try {
            if (modal?.mode === 'add') {
                await itemsControllerCreateAttribute(attributeType, { name: inputValue.trim() });
            } else if (modal?.mode === 'edit' && modal.id) {
                await itemsControllerUpdateAttribute(attributeType, modal.id, { name: inputValue.trim() });
            }
            closeModal();
            onRefresh();
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Delete "${name}"?`)) return;
        await itemsControllerRemoveAttribute(attributeType, id);
        onRefresh();
    };

    return (
        <div className="pt-4">
            <InlineModal
                isOpen={!!modal}
                title={modal?.mode === 'add' ? `Add ${attributeType}` : `Edit ${attributeType}`}
                value={inputValue}
                onChange={setInputValue}
                onConfirm={handleConfirm}
                onCancel={closeModal}
                confirmLabel={modal?.mode === 'add' ? 'Add' : 'Save'}
                loading={saving}
            />

            <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" /> Add
                </button>
            </div>

            <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden max-h-72 overflow-y-auto">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-28 text-gray-400 gap-1">
                        <Tag className="w-6 h-6 opacity-30" />
                        <p className="text-xs">No {attributeType.toLowerCase()} entries yet.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {items.map(item => (
                            <li key={item._id} className="flex items-center justify-between px-4 py-2.5 bg-white hover:bg-gray-50 transition-colors group">
                                <span className="text-sm text-gray-800">{item.name}</span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEdit(item._id, item.name)}
                                        className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item._id, item.name)}
                                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

// ─── AttributeManager ─────────────────────────────────────────────────────────

const ATTRIBUTE_TYPES = [
    'Category', 'Brand', 'Size', 'Style', 'SeasonCode',
    'Neckline', 'Occasion', 'SleeveLength', 'Shoulder',
];

export const AttributeManager = () => {
    const [activeTab, setActiveTab] = useState(ATTRIBUTE_TYPES[0]);
    const [attributes, setAttributes] = useState<Record<string, MetaItem[]>>({});
    const [loading, setLoading] = useState(true);

    const fetchAttributes = () => {
        setLoading(true);
        itemsControllerFindAllAttributes().then((rawRes: unknown) => {
            const res = rawRes as Record<string, MetaItem[]>;
            if (res && typeof res === 'object') setAttributes(res);
        }).finally(() => setLoading(false));
    };

    useEffect(() => { fetchAttributes(); }, []);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                <div className="p-2 bg-primary-50 text-primary-600 rounded-xl">
                    <Tag className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900">Item Attributes</h3>
                    <p className="text-xs text-gray-400">Manage classification values per category</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto border-b border-gray-100 no-scrollbar px-4 pt-2">
                {ATTRIBUTE_TYPES.map(type => (
                    <button
                        key={type}
                        onClick={() => setActiveTab(type)}
                        className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors mr-1 ${
                            activeTab === type
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                        }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="px-6 pb-6">
                {loading ? (
                    <div className="flex items-center justify-center h-40 text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                ) : (
                    <AttributeCrudTable
                        key={activeTab}
                        attributeType={activeTab}
                        items={attributes[activeTab] || []}
                        onRefresh={fetchAttributes}
                    />
                )}
            </div>
        </div>
    );
};
