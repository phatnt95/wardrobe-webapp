import React, { useState, useRef } from "react";
import { UploadCloud, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface UploadZoneProps {
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onClose, onUpload }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processUpload(file);
    }
  };

  const processUpload = async (file: File) => {
    setIsUploading(true);
    try {
      await onUpload(file);
      toast.success("AI is processing your image in the background!", { icon: "✨" });
      onClose(); // Instantly close modal upon acknowledgment
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      await processUpload(file);
    } else {
      toast.error("Please insert a valid image file");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">AI Auto-Detect</h3>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`w-full h-48 rounded-xl border-2 border-dashed ${
              isUploading ? 'border-primary-300 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            } transition-colors flex flex-col items-center justify-center cursor-pointer`}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-3" />
                <p className="text-primary-700 font-medium">Uploading...</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-gray-700 font-medium font-semibold mb-1">Click to upload or drag & drop</p>
                <p className="text-gray-400 text-sm">PNG, JPG, JPEG up to 10MB</p>
              </>
            )}
            <input
              type="file"
              className="hidden"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
