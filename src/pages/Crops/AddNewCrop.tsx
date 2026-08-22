import React, { useMemo, useRef, useState, FC } from "react";
import { useTranslation } from "react-i18next";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { ServerSetting } from './../../helperComponents/ServerSetting';
import { Notification } from './../../helperComponents/Notification';
import { useAuthToken } from './../../Hooks/useAuthToken';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';
import { CROP_TYPE_SELECT_OPTIONS } from '../../constants/cropTypes';
import IconArrowRight from "../../components/Icon/IconArrowRight";

const card =
    'rounded-[2rem] border border-white-light bg-white/95 p-6 shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-[#0b1526]/85';
const iconBadge =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/20';
const inputBase =
    'form-input w-full rounded-2xl border bg-white/80 px-4 py-2.5 text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-white/5 dark:text-white';
const inputOk = 'border-gray-300 focus:border-primary dark:border-white/10 dark:focus:border-primary';
const inputError = 'border-red-400 focus:border-red-500 dark:border-red-500/70';
const labelCls = 'mb-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200';
const errorCls = 'mt-1 block text-sm text-red-500';

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

    // baseScale = the scale at which the image fully COVERS the crop viewport (zoom = 1 reference point)
    const baseScale = useMemo(() => {
        if (!naturalSize.width || !naturalSize.height) return 1;
        return Math.max(CROP_SIZE / naturalSize.width, CROP_SIZE / naturalSize.height);
    }, [naturalSize]);

    const scale = baseScale * zoom;

    // Clamps drag position. When the image is LARGER than the viewport it behaves as before
    // (can't reveal empty edges). When the image is SMALLER than the viewport (minimized/zoomed out),
    // it gets centered instead of being pinned to a corner.
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

        // Source rectangle (in ORIGINAL image pixel coordinates) that corresponds to the crop viewport
        const cropX = -position.x / scale;
        const cropY = -position.y / scale;
        const cropSizeOnImage = CROP_SIZE / scale;

        const canvas = document.createElement('canvas');
        canvas.width = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Fill background first (matters when image is minimized and doesn't cover the whole crop area)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

        // Clip the source rect against the actual image bounds so we never pass
        // negative/oversized values into drawImage (which breaks on some browsers).
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
            <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl border border-[#ebedf2] dark:border-[#191e3a] shadow-xl p-5 sm:p-6">
                <h5 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white text-center">
                    {title || t('crop_image')}
                </h5>

                <div
                    className="relative mx-auto overflow-hidden bg-gray-100 dark:bg-white/5 select-none touch-none"
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
                    {!round && <div className="pointer-events-none absolute inset-0 border-2 border-white/70 rounded-xl" />}
                </div>

                <div className="flex items-center gap-3 mt-4">
                    <span className="text-xs text-gray-500 dark:text-gray-400">−</span>
                    <input
                        type="range"
                        min={MIN_ZOOM}
                        max={MAX_ZOOM}
                        step={0.01}
                        value={zoom}
                        onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                        className="w-full accent-green-600"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">+</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                    {t('drag_to_reposition_zoom_to_resize')}
                </p>

                <div className="flex gap-2 mt-6 justify-end">
                    <button type="button" onClick={onCancel} className="btn btn-outline-secondary rounded-xl flex-1 sm:flex-none">
                        {t('cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="btn shadow-none !bg-[#16a34a] !text-white !border-[#16a34a] hover:!bg-[#15803d] rounded-xl flex-1 sm:flex-none"
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

    // ---- Image crop state ----
    const [cropModal, setCropModal] = useState<{ open: boolean; imageSrc: string } | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    // Opens the crop modal instead of directly using the picked file.
    const handleImageChange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setCropModal({ open: true, imageSrc: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
        e.target.value = ''; // reset so re-selecting the same file re-triggers onChange
    };

    const handleCropCancel = () => setCropModal(null);

    // Runs after the user confirms the crop — the cropped blob becomes the crop image.
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
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-green-600 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-600 hover:text-white dark:border-green-700 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-700 dark:hover:text-white"
            >
                <IconArrowRight className="w-4 h-4 rtl:rotate-180"/>
                {t('back_to_all_crops')}
            </button>
            </div>

            <div className={`${card} mx-auto max-w-md`}>
                <div className="space-y-5">
                    <div className="text-center">
                        <h1 className="text-xl font-bold text-success sm:text-2xl">{t('add_new_crop_page')}</h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('add_new_crop_desc')}</p>
                    </div>

                    {/* Crop Image */}
                    <div className="text-center">
                        <label htmlFor="cropImage" className="group inline-block cursor-pointer">
                            {previewImage ? (
                                <img
                                    src={previewImage}
                                    alt="Crop Preview"
                                    className="mx-auto h-28 w-28 rounded-full border-2 border-gray-300 object-cover shadow-sm transition-transform duration-300 group-hover:scale-105 dark:border-white/10 md:h-32 md:w-32"
                                />
                            ) : (
                                <div className="mx-auto flex h-28 w-28 flex-col items-center justify-center gap-1 rounded-full border-2 border-dashed border-gray-300 bg-gray-100 text-xs font-medium text-gray-500 transition-colors group-hover:border-primary/50 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 md:h-32 md:w-32">
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
                            className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-success px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-success/90 ${loading ? "cursor-not-allowed opacity-50" : ""
                                }`}
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading && (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
