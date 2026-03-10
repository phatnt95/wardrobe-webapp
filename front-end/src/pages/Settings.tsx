import React from 'react';
import { Settings2, Tag, Palette, Map, Plus, Edit2, Trash2 } from 'lucide-react';

export const Settings = () => {
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

                    <div className="space-y-6">
                        <SettingSection title="Categories" icon={<Tag className="w-4 h-4 mr-2" />} items={['Shirt', 'Pants', 'Jacket']} />
                        <SettingSection title="Colors" icon={<Palette className="w-4 h-4 mr-2" />} items={['Black', 'White', 'Blue', 'Red']} />
                    </div>
                </div>

                {/* Location Configuration */}
                <div className="bg-surface p-6 rounded-2xl shadow-soft border border-gray-100">
                    <div className="flex items-center mb-6 pb-4 border-b border-gray-100">
                        <div className="p-2 bg-primary-50 text-primary-600 rounded-lg mr-3">
                            <Map className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">Location Structure</h3>
                    </div>

                    <div className="space-y-6">
                        <SettingSection title="Locations (L1)" items={['Ha Noi', 'Ho Chi Minh']} />
                        <SettingSection title="Cabinets (L2)" items={['Cabinet A', 'Cabinet B']} />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper component for Settings Sections
const SettingSection = ({ title, icon, items }: { title: string, icon?: React.ReactNode, items: string[] }) => {
    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-700 flex items-center">
                    {icon} {title}
                </h4>
                <button className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center bg-primary-50 hover:bg-primary-100 px-3 py-1 rounded-full transition-colors">
                    <Plus className="w-4 h-4 mr-1" /> Add
                </button>
            </div>
            <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                <ul className="divide-y divide-gray-100">
                    {items.map((item, idx) => (
                        <li key={idx} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors">
                            <span className="text-sm text-gray-800">{item}</span>
                            <div className="flex space-x-2">
                                <button className="p-1 text-gray-400 hover:text-primary-600 transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
