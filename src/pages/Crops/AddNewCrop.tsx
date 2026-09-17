import React, { useMemo, useRef, useState, FC } from "react";
import { useTranslation } from "react-i18next";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { ServerSetting } from './../../helperComponents/ServerSetting';
import { Notification } from './../../helperComponents/Notification';
import { useAuthToken } from './../../Hooks/useAuthToken';
import { CROP_TYPE_SELECT_OPTIONS } from '../../constants/cropTypes';
import IconArrowRight from "../../components/Icon/IconArrowRight";

const card =
    'rounded-2xl border border-white-light bg-white/95 p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800/80 dark:bg-[#0b1724]/90 dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.65)] dark:backdrop-blur-xl relative dark:overflow-hidden';
const inputBase =
    'form-input w-full rounded-2xl border bg-white/80 px-4 py-2.5 text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-[#07121c] dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-2 dark:focus:ring-emerald-500 dark:focus:border-emerald-500';
const inputOk = 'border-gray-300 focus:border-primary dark:border-slate-800';
const inputError = 'border-red-400 focus:border-red-500 dark:border-red-500/70';
const labelCls = 'mb-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300 dark:uppercase dark:tracking-wider dark:text-xs';
const errorCls = 'mt-1 block text-sm text-red-500 dark:text-red-400';

interface FormData {
    cropName: string;
    cropType: string;
    cropImage: File | string;
    cropStatus: string;
}

interface FormErrors {
    cropName?: string;
    cropType?: string;
    cropImage?: string;
}

/* =========================================================
   Reusable Image Crop Modal (no external library required)
   - Drag to reposition
   - Slider to zoom IN and OUT (minimize)
   - Outputs a square-cropped JPEG Blob
   (Same component/behavior as used on the Profile and
   CreateUserShopOwner pages.)
   ========================================================= */

const CROP_SIZE = 280;   // px, size of the crop viewport shown to the user
const OUTPUT_SIZE = 500; // px, size of the final cropped image
const MIN_ZOOM = 0.5;    // allows shrinking the image below "cover" fit
const MAX_ZOOM = 3;

interface ImageCropModalProps {
    imageSrc: string;
    round?: boolean;
    title?: string;
    onCancel: () => void;
    onConfirm: (blob: Blob) => void;
}

const ImageCropModal: FC<ImageCropModalProps> = ({ imageSrc, round = false, title, onCancel, onConfirm }) => {
    const { t } = useTranslation();
    const imgRef = useRef<HTMLImageElement>(null);
    const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

    const baseScale = useMemo(() => {
        if (!naturalSize.width || !naturalSize.height) return 1;
        return Math.max(CROP_SIZE / naturalSize.width, CROP_SIZE / naturalSize.height);
    }, [naturalSize]);

    const scale = baseScale * zoom;

    const clampPosition = (pos: { x: number; y: number }, currentScale: number) => {
        const displayedWidth = naturalSize.width * currentScale;
        const displayedHeight = naturalSize.height * currentScale;

        let x: number;
        if (displayedWidth <= CROP_SIZE) {
            x = (CROP_SIZE - displayedWidth) / 2;
        } else {
            const minX = CROP_SIZE - displayedWidth;
            x = Math.min(0, Math.max(pos.x, minX));
        }

        let y: number;
        if (displayedHeight <= CROP_SIZE) {
            y = (CROP_SIZE - displayedHeight) / 2;
        } else {
            const minY = CROP_SIZE - displayedHeight;
            y = Math.min(0, Math.max(pos.y, minY));
        }

        return { x, y };
    };

    const onImgLoad = () => {
        if (!imgRef.current) return;
        const { naturalWidth, naturalHeight } = imgRef.current;
        setNaturalSize({ width: naturalWidth, height: naturalHeight });
        const initialScale = Math.max(CROP_SIZE / naturalWidth, CROP_SIZE / naturalHeight);
        const displayedWidth = naturalWidth * initialScale;
        const displayedHeight = naturalHeight * initialScale;
        setPosition({
            x: (CROP_SIZE - displayedWidth) / 2,
            y: (CROP_SIZE - displayedHeight) / 2,
        });
        setZoom(1);
    };

    const startDrag = (clientX: number, clientY: number) => {
        setIsDragging(true);
        dragRef.current = { startX: clientX, startY: clientY, startPosX: position.x, startPosY: position.y };
    };

    const moveDrag = (clientX: number, clientY: number) => {
        if (!isDragging) return;
        const dx = clientX - dragRef.current.startX;
        const dy = clientY - dragRef.current.startY;
        setPosition(clampPosition({ x: dragRef.current.startPosX + dx, y: dragRef.current.startPosY + dy }, scale));
    };

    const endDrag = () => setIsDragging(false);

    const handleZoomChange = (newZoom: number) => {
        setZoom(newZoom);
        setPosition((prev) => clampPosition(prev, baseScale * newZoom));
    };

    const handleConfirm = () => {
        if (!naturalSize.width || !naturalSize.height || !imgRef.current) return;

        const cropX = -position.x / scale;
        const cropY = -position.y / scale;
        const cropSizeOnImage = CROP_SIZE / scale;

        const canvas = document.createElement('canvas');
        canvas.width = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

        const sxClipped = Math.max(cropX, 0);
        const syClipped = Math.max(cropY, 0);
        const sxEnd = Math.min(cropX + cropSizeOnImage, naturalSize.width);
        const syEnd = Math.min(cropY + cropSizeOnImage, naturalSize.height);
        const swClipped = sxEnd - sxClipped;
        const shClipped = syEnd - syClipped;

        if (swClipped > 0 && shClipped > 0) {
            const outScale = OUTPUT_SIZE / cropSizeOnImage;
            const dx = (sxClipped - cropX) * outScale;
            const dy = (syClipped - cropY) * outScale;
            const dw = swClipped * outScale;
            const dh = shClipped * outScale;

            ctx.drawImage(
                imgRef.current,
                sxClipped, syClipped, swClipped, shClipped,
                dx, dy, dw, dh
            );
        }

        canvas.toBlob((blob) => {
            if (blob) onConfirm(blob);
        }, 'image/jpeg', 0.92);
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm bg-white dark:bg-[#0b1724] rounded-2xl border border-[#ebedf2] dark:border-slate-800/80 shadow-xl dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.65)] p-5 sm:p-6">
                <h5 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white text-center">
                    {title || t('crop_image')}
                </h5>

                <div
                    className="relative mx-auto overflow-hidden bg-gray-100 dark:bg-[#07121c] select-none touch-none"
                    style={{
                        width: CROP_SIZE,
                        height: CROP_SIZE,
                        borderRadius: round ? '50%' : '12px',
                        cursor: isDragging ? 'grabbing' : 'grab',
                    }}
                    onMouseDown={(e) => { e.preventDefault(); startDrag(e.clientX, e.clientY); }}
                    onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
                    onMouseUp={endDrag}
                    onMouseLeave={endDrag}
                    onTouchStart={(e) => { const t0 = e.touches[0]; startDrag(t0.clientX, t0.clientY); }}
                    onTouchMove={(e) => { const t0 = e.touches[0]; moveDrag(t0.clientX, t0.clientY); }}
                    onTouchEnd={endDrag}
                >
                    <img
                        ref={imgRef}
                        src={imageSrc}
                        onLoad={onImgLoad}
                        alt="Crop preview"
                        draggable={false}
                        style={{
                            position: 'absolute',
                            left: position.x,
                            top: position.y,
                            width: naturalSize.width * scale,
                            height: naturalSize.height * scale,
                            maxWidth: 'none',
                        }}
                    />
                    {!round && <div className="pointer-events-none absolute inset-0 border-2 border-white/70 dark:border-emerald-500/40 rounded-xl" />}
                </div>

                <div className="flex items-center gap-3 mt-4">
                    <span className="text-xs text-gray-500 dark:text-slate-400">−</span>
                    <input
                        type="range"
                        min={MIN_ZOOM}
                        max={MAX_ZOOM}
                        step={0.01}
                        value={zoom}
                        onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                        className="w-full accent-green-600 dark:accent-emerald-500"
                    />
                    <span className="text-xs text-gray-500 dark:text-slate-400">+</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 text-center mt-1">
                    {t('drag_to_reposition_zoom_to_resize')}
                </p>

                <div className="flex gap-2 mt-6 justify-end">
                    <button type="button" onClick={onCancel} className="btn btn-outline-secondary rounded-xl flex-1 sm:flex-none dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/60">
                        {t('cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="btn shadow-none !bg-[#16a34a] !text-white !border-[#16a34a] hover:!bg-[#15803d] rounded-xl flex-1 sm:flex-none dark:!bg-emerald-500 dark:!border-emerald-500 dark:hover:!bg-emerald-400 dark:!text-[#04090f] dark:shadow-[0_0_25px_-4px_rgba(16,185,129,0.35)]"
                    >
                        {t('save_crop')}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ========================================================= */

const AddNewCrop = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { token } = useAuthToken();
    const [formData, setFormData] = useState<FormData>({
        cropName: "",
        cropType: "",
        cropImage: "",
        cropStatus: "",
    });
    const [previewImage, setPreviewImage] = useState("");
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);

    const [cropModal, setCropModal] = useState<{ open: boolean; imageSrc: string } | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleImageChange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setCropModal({ open: true, imageSrc: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const handleCropCancel = () => setCropModal(null);

    const handleCropConfirm = (blob: Blob) => {
        setCropModal(null);

        const croppedFile = new File([blob], 'crop.jpg', { type: 'image/jpeg' });
        setFormData((prevData) => ({
            ...prevData,
            cropImage: croppedFile,
        }));
        setPreviewImage(URL.createObjectURL(blob));
        setErrors((prev) => ({ ...prev, cropImage: undefined }));
    };

    const handleSubmit = async () => {
        let newErrors: FormErrors = {};
        if (!formData.cropName.trim()) newErrors.cropName = "Crop name is required.";
        if (!formData.cropType.trim()) newErrors.cropType = "Crop type is required.";
        if (!formData.cropImage) newErrors.cropImage = "Crop image is required.";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);

        const formDataApi = new FormData();
        formDataApi.append("cropName", formData.cropName);
        formDataApi.append("cropType", formData.cropType);
        formDataApi.append("cropImage", formData.cropImage);
        formDataApi.append("cropStatus", formData.cropStatus);

        try {
            const response = await axios.post(`${ServerSetting.serUrl}/api/addcrop`, formDataApi, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            Notification({ text: response.data.message, color: 'success' });
            navigate("/viewcrops");
            setFormData({
                cropName: "",
                cropType: "",
                cropImage: "",
                cropStatus: '0',
            });
            setPreviewImage("");
            setErrors({});
        } catch (error) {
            console.error("API Error:", error);
            alert("Failed to add crop. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={() => navigate('/viewcrops')}
                    className="inline-flex items-center gap-2 rounded-2xl border-2 border-green-600 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 dark:hover:border-emerald-500/50"
                >
                    <IconArrowRight className="w-4 h-4 rtl:rotate-180" />
                    {t('back_to_all_crops')}
                </button>
            </div>

            <div className={`${card} mx-auto max-w-md`}>
                {/* Subtle top glow accent within card (dark mode only) */}
                <div className="pointer-events-none absolute top-0 left-1/2 hidden h-[2px] w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent dark:block"></div>
                <div className="relative z-10 space-y-5">
                    <div className="text-center">
                        <h1 className="text-xl font-bold text-success sm:text-2xl dark:text-white">
                            {t('add_new_crop_page')}
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{t('add_new_crop_desc')}</p>
                    </div>

                    {/* Crop Image */}
                    <div className="text-center">
                        <label htmlFor="cropImage" className="group inline-block cursor-pointer">
                            {previewImage ? (
                                <img
                                    src={previewImage}
                                    alt="Crop Preview"
                                    className="mx-auto h-28 w-28 rounded-full border-2 border-gray-300 object-cover shadow-sm transition-transform duration-300 group-hover:scale-105 dark:border-emerald-500/40 dark:shadow-[0_0_25px_-4px_rgba(16,185,129,0.35)] md:h-32 md:w-32"
                                />
                            ) : (
                                <div className="mx-auto flex h-28 w-28 flex-col items-center justify-center gap-1 rounded-full border-2 border-dashed border-gray-300 bg-gray-100 text-xs font-medium text-gray-500 transition-colors group-hover:border-primary/50 dark:border-emerald-500/40 dark:bg-[#07121c]/60 dark:text-slate-400 dark:group-hover:border-emerald-400 dark:group-hover:bg-emerald-950/20 md:h-32 md:w-32">
                                    <span className="text-2xl">🌾</span>
                                    {t('form_upload_image')}
                                </div>
                            )}
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            id="cropImage"
                            onChange={handleImageChange}
                            className="hidden"
                        />
                        {errors.cropImage && (
                            <span className={errorCls}>{errors.cropImage}</span>
                        )}
                    </div>

                    {/* Crop Name */}
                    <div className="flex flex-col">
                        <label htmlFor="cropName" className={labelCls}>
                            {t('form_crop_name')}
                        </label>
                        <input
                            id="cropName"
                            name="cropName"
                            type="text"
                            placeholder={t('form_enter_crop_name')}
                            className={`${inputBase} ${errors.cropName ? inputError : inputOk}`}
                            value={formData.cropName}
                            onChange={handleChange}
                        />
                        {errors.cropName && (
                            <span className={errorCls}>{errors.cropName}</span>
                        )}
                    </div>

                    {/* Crop Type */}
                    <div className="flex flex-col">
                        <label htmlFor="cropType" className={labelCls}>
                            {t('form_crop_type')}
                        </label>
                        <select
                            id="cropType"
                            name="cropType"
                            className={`form-select ${inputBase} ${errors.cropType ? inputError : inputOk}`}
                            value={formData.cropType}
                            onChange={handleChange}
                        >
                            <option value="">{t('form_select_type')}</option>
                            {CROP_TYPE_SELECT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        {errors.cropType && (
                            <span className={errorCls}>{errors.cropType}</span>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2 text-center">
                        <button
                            type="button"
                            className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-success px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-success/90 dark:bg-emerald-500 dark:font-bold dark:tracking-wide dark:text-[#04090f] dark:shadow-[0_0_25px_-4px_rgba(16,185,129,0.35)] dark:hover:bg-emerald-400 dark:hover:shadow-[0_0_35px_-5px_rgba(16,185,129,0.45)] dark:active:scale-[0.99] ${loading ? "cursor-not-allowed opacity-50" : ""
                                }`}
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading && (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white dark:border-[#04090f] border-t-transparent" />
                            )}
                            {loading ? t('btn_saving_crop') : t('btn_save_crop_details')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Image crop modal */}
            {cropModal?.open && (
                <ImageCropModal
                    imageSrc={cropModal.imageSrc}
                    round={true}
                    title={t('crop_image')}
                    onCancel={handleCropCancel}
                    onConfirm={handleCropConfirm}
                />
            )}
        </div>
    );
};

export default AddNewCrop;