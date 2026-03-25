import React, { useEffect, useState } from 'react';
import { Settings2, Tag, Map, Plus, Edit2, Trash2 } from 'lucide-react';
import { getItems } from '../api/endpoints/items/items';
import { getLocations } from '../api/endpoints/locations/locations';

const {
    itemsControllerFindAllAttributes,
    itemsControllerCreateAttribute,
    itemsControllerUpdateAttribute,
    itemsControllerRemoveAttribute
} = getItems();

const {
    locationsControllerFindAll,
    locationsControllerCreate,
    locationsControllerUpdate,
    locationsControllerRemove
} = getLocations();

type MetaItem = { _id: string; name: string };
type LocationItem = { _id: string; name: string; parent: string | null };

export const Settings = () => {
    const attributeTypes = ['Category', 'Brand', 'Size', 'Style', 'SeasonCode', 'Neckline', 'Occasion', 'SleeveLength', 'Shoulder'];
    
    const [activeTab, setActiveTab] = useState(attributeTypes[0]);
    const [attributes, setAttributes] = useState<Record<string, MetaItem[]>>({});
    const [locations, setLocations] = useState<LocationItem[]>([]);

    const fetchAll = () => {
        itemsControllerFindAllAttributes().then((rawRes: unknown) => {
            const res = rawRes as Record<string, MetaItem[]>;
            if (res) setAttributes(res);
        });
        locationsControllerFindAll().then((rawRes: unknown) => {
            const res = rawRes as LocationItem[];
            if (res) setLocations(res);
        });
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const handleCreateLocation = async () => {
        const name = window.prompt("Enter new L1 Location name:");
        if (name) {
            await locationsControllerCreate({ name });
            fetchAll();
        }
    };

    const handleEditLocation = async (id: string, current: string) => {
        const name = window.prompt("Edit Location name:", current);
        if (name && name !== current) {
            await locationsControllerUpdate(id, { name });
            fetchAll();
        }
    };

    const handleDeleteLocation = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this location?")) {
            await locationsControllerRemove(id);
            fetchAll();
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-12">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h2>
                <p className="text-gray-500 mt-2">Manage your app metadata and attributes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Attributes Configuration */}
                <div className="bg-surface p-6 rounded-2xl shadow-soft border border-gray-100">
                    <div className="flex items-center mb-6 pb-4 border-b border-gray-100">
                        <div className="p-2 bg-primary-50 text-primary-600 rounded-lg mr-3">
                            <Settings2 className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">Item Attributes</h3>
                    </div>

                    <div className="flex space-x-2 overflow-x-auto pb-2 mb-6 border-b border-gray-100 no-scrollbar">
                        {attributeTypes.map(type => (
                            <button
                                key={type}
                                onClick={() => setActiveTab(type)}
                                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeTab === type ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    <div>
                        <SettingSection 
                            type={activeTab}
                            title={activeTab} 
                            icon={<Tag className="w-4 h-4 mr-2" />} 
                            items={attributes[activeTab] || []} 
                            onRefresh={fetchAll}
                        />
                    </div>
                </div>

                {/* Location Configuration */}
                <div className="bg-surface p-6 rounded-2xl shadow-soft border border-gray-100">
                    <div className="flex items-center mb-6 pb-4 border-b border-gray-100">
                        <div className="p-2 bg-primary-50 text-primary-600 rounded-lg mr-3">
                            <Map className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">Locations Base (L1)</h3>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-gray-700 flex items-center">Root Locations</h4>
                                <button onClick={handleCreateLocation} className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center bg-primary-50 hover:bg-primary-100 px-3 py-1 rounded-full transition-colors relative z-0">
                                    <Plus className="w-4 h-4 mr-1" /> Add
                                </button>
                            </div>
                            <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden max-h-96 overflow-y-auto">
                                <ul className="divide-y divide-gray-100">
                                    {(locations || []).filter(l => !l.parent).map((item) => (
                                        <li key={item._id} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors">
                                            <span className="text-sm text-gray-800">{item.name}</span>
                                            <div className="flex space-x-2">
                                                <button onClick={() => handleEditLocation(item._id, item.name)} className="p-1 text-gray-400 hover:text-primary-600 transition-colors relative z-0">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteLocation(item._id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors relative z-0">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                    {(!locations || locations.filter(l => !l.parent).length === 0) && (
                                        <li className="px-4 py-3 text-sm text-gray-500 text-center">No locations available</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SettingSection = ({ type, title, icon, items, onRefresh }: { type: string, title: string, icon?: React.ReactNode, items: MetaItem[], onRefresh: () => void }) => {
    
    const handleAdd = async () => {
        const name = window.prompt(`Enter new ${title} name:`);
        if (name) {
            await itemsControllerCreateAttribute(type, { name });
            onRefresh();
        }
    };

    const handleEdit = async (id: string, current: string) => {
        const name = window.prompt(`Edit ${title} name:`, current);
        if (name && name !== current) {
            await itemsControllerUpdateAttribute(type, id, { name });
            onRefresh();
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm(`Are you sure you want to delete this ${title}?`)) {
            await itemsControllerRemoveAttribute(type, id);
            onRefresh();
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-3 mt-5">
                <h4 className="font-medium text-gray-700 flex items-center">
                    {icon} {title}
                </h4>
                <button onClick={handleAdd} className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center bg-primary-50 hover:bg-primary-100 px-3 py-1 rounded-full transition-colors relative z-0">
                    <Plus className="w-4 h-4 mr-1" /> Add
                </button>
            </div>
            <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden max-h-64 overflow-y-auto">
                <ul className="divide-y divide-gray-100">
                    {items && items.map((item) => (
                        <li key={item._id} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors">
                            <span className="text-sm text-gray-800">{item.name}</span>
                            <div className="flex space-x-2">
                                <button onClick={() => handleEdit(item._id, item.name)} className="p-1 text-gray-400 hover:text-primary-600 transition-colors relative z-0">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(item._id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors relative z-0">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </li>
                    ))}
                    {(!items || items.length === 0) && (
                        <li className="px-4 py-3 text-sm text-gray-500 text-center">No items available</li>
                    )}
                </ul>
            </div>
        </div>
    );
};
