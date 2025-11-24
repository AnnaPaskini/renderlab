'use client';

import { ImagePreviewModal } from '@/components/common/ImagePreviewModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ImageUploadPanel } from '@/components/workspace/ImageUploadPanel';
import { ModelSelector } from '@/components/workspace/prompt-builder/ModelSelector';
import { createClient } from '@/lib/supabaseBrowser';
import { uploadImageToStorage } from '@/lib/utils/uploadToStorage';
import { Check, ChevronDown, FileText, Layers, Sparkles, Upload, Zap } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface Collection {
    id: string;
    title: string;
    templates: any[];
    created_at: string;
}

interface GeneratedResult {
    templateId: string;
    templateName: string;
    imageUrl: string;
    prompt: string;
    model: string;
    saved?: boolean;
    imageRecordId?: string;
}

function RenderLabSkeletonRow({ count }: { count: number }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="rl-skeleton"
                    style={{
                        width: "100%",
                        paddingBottom: "100%", // square
                    }}
                />
            ))}
        </div>
    );
}

export default function BatchStudioPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const collectionIdFromUrl = searchParams.get('collection');

    const [referenceImage, setReferenceImage] = useState<string | null>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
    const [allCollections, setAllCollections] = useState<Collection[]>([]);
    const [isLoadingCollections, setIsLoadingCollections] = useState(true);

    const [selectedModel, setSelectedModel] = useState<string>('nano-banana');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const [generatedResults, setGeneratedResults] = useState<GeneratedResult[]>([]);
    const [templateStatuses, setTemplateStatuses] = useState<
        Record<string, 'pending' | 'generating' | 'done' | 'error'>
    >({});

    const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
    const [abortController, setAbortController] = useState<AbortController | null>(null);
    const [modalImage, setModalImage] = useState<string | null>(null);

    const [progress, setProgress] = useState(0);
    const [fakeInterval, setFakeInterval] = useState<NodeJS.Timeout | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);
    const skeletonRef = useRef<HTMLDivElement | null>(null);
    const generateBtnRef = useRef<HTMLButtonElement | null>(null);

    // Fetch collections on mount
    useEffect(() => {
        const fetchCollections = async () => {
            try {
                setIsLoadingCollections(true);
                const supabase = createClient();
                const {
                    data: { user },
                    error: authError,
                } = await supabase.auth.getUser();

                if (authError || !user) {
                    console.error('❌ Not authenticated');
                    router.push('/login');
                    return;
                }

                const { data, error } = await supabase
                    .from('collections')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('❌ Failed to load collections:', error);
                    toast.error('Failed to load collections');
                    setAllCollections([]);
                    return;
                }

                console.log('✅ Loaded collections:', data?.length || 0);
                setAllCollections(data || []);

                // Auto-select collection from URL if present
                if (collectionIdFromUrl && data) {
                    const matchedCollection = data.find((c) => c.id === collectionIdFromUrl);
                    if (matchedCollection) {
                        setSelectedCollection(matchedCollection);
                        console.log('✅ Auto-selected collection from URL:', matchedCollection.title);
                    } else {
                        console.warn('⚠️ Collection from URL not found:', collectionIdFromUrl);
                        toast.error('Collection not found');
                    }
                }
            } catch (error) {
                console.error('Failed to fetch collections:', error);
                toast.error('Failed to load collections');
            } finally {
                setIsLoadingCollections(false);
            }
        };

        fetchCollections();
    }, [collectionIdFromUrl, router]);

    // Initialize template statuses when collection changes
    useEffect(() => {
        if (selectedCollection && selectedCollection.templates) {
            const statuses: Record<string, 'pending'> = {};
            selectedCollection.templates.forEach((t: any) => {
                statuses[t.id] = 'pending';
            });
            setTemplateStatuses(statuses);
        }
    }, [selectedCollection]);

    // Auto-scroll to results when generation completes
    useEffect(() => {
        if (generatedResults.length > 0) {
            setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 150);
        }
    }, [generatedResults]);

    // Auto-scroll to skeleton when generation starts
    useEffect(() => {
        if (isGenerating && skeletonRef.current) {
            skeletonRef.current.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }
    }, [isGenerating]);

    // Auto-scroll to Generate button when collection is selected OR when image is uploaded
    useEffect(() => {
        if ((selectedCollection || referenceImage) && !isGenerating && generateBtnRef.current) {
            generateBtnRef.current.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }
    }, [selectedCollection, referenceImage, isGenerating]);

    const handleClearReference = () => {
        setReferenceImage(null);
        setUploadedFile(null);
    };

    const resetProgressState = () => {
        setIsGenerating(false);
        setProgress(0);
        setAbortController(null);
        if (fakeInterval) {
            clearInterval(fakeInterval);
            setFakeInterval(null);
        }
    };

    const handleGenerate = async () => {
        if (!referenceImage || !uploadedFile || !selectedCollection) {
            if (!referenceImage || !uploadedFile) {
                toast.error('Reference image required');
            } else if (!selectedCollection) {
                toast.error('Please select a collection');
            }
            return;
        }

        setIsUploading(true);
        // clean progress before new run
        setProgress(0);
        if (fakeInterval) {
            clearInterval(fakeInterval);
            setFakeInterval(null);
        }

        try {
            // Get authenticated user
            const supabase = createClient();
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                console.error('❌ Not authenticated');
                toast.error('Authentication required');
                return;
            }

            // Step 1: Upload reference image to Supabase Storage
            console.log('🔵 [UPLOAD] Starting reference image upload...');
            const uploadedImageUrl = await uploadImageToStorage(
                uploadedFile,
                user.id,
                'batch',
                `batch-reference-${Date.now()}.png`,
            );

            if (!uploadedImageUrl) {
                console.error('❌ [UPLOAD] Failed to upload reference image');
                toast.error('Failed to upload reference image');
                return;
            }

            console.log('✅ [UPLOAD] Reference image uploaded:', uploadedImageUrl);

            // Step 2: Call generation API with streaming
            setIsUploading(false);

            const controller = new AbortController();
            setAbortController(controller);

            setIsGenerating(true);
            setProgress(0);
            setGeneratedResults([]);
            setSelectedImages(new Set());

            // Имитация прогресса
            let current = 0;
            const speed = 0.35; // скорость заполнения (можно менять)

            const interval = setInterval(() => {
                // увеличиваем постепенно, но замедляем в конце
                current += (1 - current) * speed;
                setProgress(current * 100);

                // останавливаем на 95%, последние 5% — после API ответа
                if (current > 0.95) {
                    clearInterval(interval);
                }
            }, 300);

            setFakeInterval(interval);

            // Prepare templates payload
            const templatesPayload = selectedCollection.templates.map((t: any, index: number) => ({
                id: t.id,
                name: t.name || t.title || `Template ${index + 1}`,
                prompt: t.prompt || '',
                model: t.model || t.aiModel || 'flux-dev',
            }));

            console.log('🔵 [GENERATION] Starting batch generation...', {
                templates: templatesPayload.length,
                baseImageUrl: uploadedImageUrl,
                model: selectedModel,
            });

            const response = await fetch('/api/generate/collection-preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: selectedModel,
                    templates: templatesPayload,
                    baseImageUrl: uploadedImageUrl,
                    collectionId: selectedCollection.id,
                    collectionName: selectedCollection.title,
                }),
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error(`Generation API failed: ${response.status}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';

            if (!reader) {
                throw new Error('No response stream available');
            }

            try {
                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        buffer += decoder.decode();
                        break;
                    }

                    if (!value) continue;

                    buffer += decoder.decode(value, { stream: true });
                    const parts = buffer.split('\n');

                    // Process all complete lines
                    for (let i = 0; i < parts.length - 1; i++) {
                        const line = parts[i].trim();
                        if (!line) continue;

                        let data = null;
                        try {
                            data = JSON.parse(line);
                        } catch (err) {
                            console.warn("Bad client chunk skipped");
                            continue;
                        }

                        try {

                            if (data.type === 'progress') {
                                console.log('🔵 [PROGRESS]', data);

                                setTemplateStatuses((prev) => ({
                                    ...prev,
                                    [data.templateId]: data.status,
                                }));

                                if (data.status === 'done') {
                                    toast.success(`✓ ${data.templateName}`);
                                } else if (data.status === 'error') {
                                    toast.error(`✗ ${data.templateName}: ${data.error || 'Failed'}`);
                                }
                            }

                            if (data.type === 'complete') {
                                console.log('✅ [COMPLETE]', data);

                                const validResults = data.results.filter((result: any) => {
                                    if (!result.templateId || !result.templateName || !result.imageUrl) {
                                        console.warn('⚠️ Invalid image data, skipping:', result);
                                        return false;
                                    }
                                    return true;
                                });

                                setGeneratedResults(validResults);

                                const allIds = new Set<string>(
                                    validResults.map((r: GeneratedResult) => r.templateId),
                                );
                                setSelectedImages(allIds);

                                toast.success(`Batch complete! ${validResults.length} images generated`);

                                if (fakeInterval) clearInterval(fakeInterval);
                                setProgress(100);

                                setTimeout(() => {
                                    setIsGenerating(false);
                                    setProgress(0);
                                }, 600);
                                await reader.cancel();
                                break;
                            }
                        } catch (processingError) {
                            console.warn('Error processing batch event:', processingError);
                        }
                    }

                    buffer = parts[parts.length - 1];
                }

                // Trailing buffer
                const trailing = buffer.trim();
                if (trailing) {
                    let data = null;
                    try {
                        data = JSON.parse(trailing);
                    } catch (err) {
                        console.warn("Bad client chunk skipped");
                        data = null;
                    }

                    if (data) {
                        try {

                            if (data.type === 'complete') {
                                console.log('✅ [COMPLETE] (from trailing buffer)', data);

                                const validResults = data.results.filter((result: any) => {
                                    if (!result.templateId || !result.templateName || !result.imageUrl) {
                                        console.warn('⚠️ Invalid image data, skipping:', result);
                                        return false;
                                    }
                                    return true;
                                });

                                setGeneratedResults(validResults);

                                const allIds = new Set<string>(
                                    validResults.map((r: GeneratedResult) => r.templateId),
                                );
                                setSelectedImages(allIds);

                                toast.success(`Batch complete! ${validResults.length} images generated`);
                                if (fakeInterval) clearInterval(fakeInterval);
                                setProgress(100);

                                setTimeout(() => {
                                    setIsGenerating(false);
                                    setProgress(0);
                                }, 600);
                            }
                        } catch (processingError) {
                            console.warn('Error processing trailing batch event:', processingError);
                        }
                    }
                }
            } finally {
                reader.releaseLock();
            }
        } catch (error: any) {
            if (error?.name === 'AbortError') {
                toast.info('Generation stopped by user');
                console.log('🛑 Generation aborted');
            } else {
                console.error('Generation error:', error);
                toast.error(error instanceof Error ? error.message : 'Generation failed');
            }
        } finally {
            setIsUploading(false);
            setAbortController(null);
        }
    };

    const handleStop = () => {
        if (abortController) {
            abortController.abort();
            toast.info('Stopping generation...');

            if (fakeInterval) {
                clearInterval(fakeInterval);
                setFakeInterval(null);
            }
            setIsGenerating(false);
            setProgress(0);
            setTemplateStatuses((prev) => {
                const reset: Record<string, 'pending'> = {};
                for (const key in prev) reset[key] = 'pending';
                return reset;
            });
            setGeneratedResults([]);
            setAbortController(null);
        }
    };

    const handleDownloadSelected = async () => {
        const selectedIds = new Set(selectedImages);
        const selected = generatedResults.filter((r) => selectedIds.has(r.templateId));

        if (selected.length === 0) {
            toast.error('No images selected');
            return;
        }

        toast.info(`Downloading ${selected.length} image${selected.length > 1 ? 's' : ''}...`);

        const cleanCollectionTitle = (selectedCollection?.title || 'batch')
            .replace(/[^a-z0-9_\-]+/gi, '_')
            .toLowerCase();

        let successCount = 0;

        for (let i = 0; i < selected.length; i++) {
            const result = selected[i];

            if (!result.imageUrl || !result.templateName) {
                console.warn('⚠️ Skipping invalid image data during download:', result);
                toast.error('Invalid image data, skipping...');
                continue;
            }

            try {
                const cleanTemplateName = result.templateName
                    .replace(/[^a-z0-9_\-]+/gi, '_')
                    .toLowerCase();

                const cleanModel = result.model.replace(/[^a-z0-9_\-]+/gi, '_').toLowerCase();

                const response = await fetch(result.imageUrl);
                if (!response.ok) {
                    throw new Error(`Failed to fetch image: ${response.status}`);
                }

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = `${cleanCollectionTitle}-${cleanTemplateName}-${cleanModel}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                successCount++;
            } catch (error) {
                console.error(`Failed to download ${result.templateName}:`, error);
                toast.error(`Failed to download ${result.templateName}`);
            }
        }

        if (successCount > 0) {
            toast.success(`Downloaded ${successCount} image${successCount > 1 ? 's' : ''} successfully`);
        }
    };

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-8 pt-32 pb-12">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                        <Zap className="w-8 h-8 text-[--rl-accent]" />
                        Batch Studio
                    </h1>
                    <p className="text-neutral-400">Generate multiple images from collections in batch</p>
                </div>

                {/* Main Content */}
                <div className="space-y-8">
                    {/* Step 1: Upload Reference Image */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Upload className="w-5 h-5 text-[--rl-accent]" />
                            <h2 className="text-xl font-semibold text-white">Step 1: Upload Reference Image</h2>
                        </div>
                        <ImageUploadPanel
                            image={referenceImage}
                            onImageChange={setReferenceImage}
                            onClearImage={handleClearReference}
                            onFileChange={setUploadedFile}
                        />
                    </div>

                    {/* Step 2: Select Collection & Model */}
                    <div className="space-y-4">
                        <div className="flex items
-center gap-3">
                            <Layers className="w-5 h-5 text-[--rl-accent]" />
                            <h2 className="text-xl font-semibold text-white">Step 2: Select Collection & Model</h2>
                        </div>

                        <div className="w-full max-w-md space-y-6">
                            {/* Model Selection */}
                            <div>
                                <ModelSelector value={selectedModel} onChange={setSelectedModel} disabled={isGenerating} />
                            </div>

                            {/* Collection Selection */}
                            <div>
                                {isLoadingCollections ? (
                                    <div className="flex items-center justify-center p-8">
                                        <div className="flex items-center gap-2">
                                            <div className="rl-skeleton" style={{ width: '8px', height: '8px' }} />
                                            <div className="rl-skeleton" style={{ width: '8px', height: '8px' }} />
                                            <div className="rl-skeleton" style={{ width: '8px', height: '8px' }} />
                                            <span className="text-sm text-neutral-400 ml-2">Loading collections...</span>
                                        </div>
                                    </div>
                                ) : allCollections.length === 0 ? (
                                    <Card className="bg-[#1a1a1a] border border-white/10 p-6">
                                        <p className="text-center text-neutral-400">
                                            No collections yet. Create one first in the{' '}
                                            <a href="/custom?tab=collections" className="text-[--rl-accent] hover:underline">
                                                Collections page
                                            </a>
                                            .
                                        </p>
                                    </Card>
                                ) : (
                                    <div className="space-y-4">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-between bg-[#262626] border-white/10 hover:bg-[#2a2a2a] hover:border-white/20"
                                                >
                                                    <span className="text-white">
                                                        {selectedCollection ? selectedCollection.title : 'Select Collection'}
                                                    </span>
                                                    <ChevronDown className="w-4 h-4 text-neutral-400" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] bg-[#262626] border-white/10">
                                                {allCollections.map((collection) => (
                                                    <DropdownMenuItem
                                                        key={collection.id}
                                                        onClick={() => {
                                                            setSelectedCollection(collection);
                                                            console.log('✅ Selected collection:', collection.title);
                                                        }}
                                                        className="text-white hover:bg-[#2a2a2a] cursor-pointer"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{collection.title}</span>
                                                            <span className="text-xs text-neutral-400">
                                                                {collection.templates?.length || 0} templates
                                                            </span>
                                                        </div>
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Templates Preview */}
                    {selectedCollection && selectedCollection.templates && selectedCollection.templates.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-[--rl-accent]" />
                                <h2 className="text-xl font-semibold text-white">
                                    Templates in collection: {selectedCollection.templates.length}
                                </h2>
                            </div>

                            <div
                                className="grid justify-start"
                                style={{
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                                    rowGap: '24px',
                                    columnGap: '24px',
                                }}
                            >
                                {selectedCollection.templates.map((template: any, index: number) => {
                                    const status = templateStatuses[template.id] || 'pending';

                                    return (
                                        <Card
                                            key={template.id || index}
                                            className={`p-4 border-2 transition-all ${status === 'generating'
                                                ? 'border-orange-500 bg-orange-500/10'
                                                : status === 'done'
                                                    ? 'border-green-500 bg-green-500/10'
                                                    : status === 'error'
                                                        ? 'border-red-500 bg-red-500/10'
                                                        : 'border-gray-700 bg-[#1a1a1a] hover:border-gray-600'
                                                }`}
                                        >
                                            <div className="flex flex-col items-center text-center space-y-3">
                                                <div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center ${status === 'generating'
                                                        ? 'bg-orange-500/20'
                                                        : status === 'done'
                                                            ? 'bg-green-500/20'
                                                            : status === 'error'
                                                                ? 'bg-red-500/20'
                                                                : 'bg-gray-500/20'
                                                        }`}
                                                >
                                                    <FileText
                                                        className={`w-4 h-4 ${status === 'generating'
                                                            ? 'text-orange-500'
                                                            : status === 'done'
                                                                ? 'text-green-500'
                                                                : status === 'error'
                                                                    ? 'text-red-500'
                                                                    : 'text-gray-400'
                                                            }`}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="font-medium text-white text-sm">
                                                        {(template.name && template.name.trim()) ||
                                                            (template.title && template.title.trim()) ||
                                                            `Template ${index + 1}`}
                                                    </h3>
                                                    <div className="flex items-center justify-center gap-1">
                                                        {status === 'pending' && (
                                                            <>
                                                                <div className="w-2 h-2 bg-gray-500 rounded-full" />
                                                                <span className="text-xs text-gray-400">Pending</span>
                                                            </>
                                                        )}
                                                        {status === 'generating' && (
                                                            <>
                                                                <div className="rl-skeleton" style={{ width: '8px', height: '8px' }} />
                                                                <span className="text-xs text-orange-500">Generating...</span>
                                                            </>
                                                        )}
                                                        {status === 'done' && (
                                                            <span className="text-xs text-green-500">✓</span>
                                                        )}
                                                        {status === 'error' && (
                                                            <span className="text-xs text-red-500">✗</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {selectedCollection && selectedCollection.templates && selectedCollection.templates.length === 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-white">Templates in collection</h2>
                            <Card className="bg-[#1a1a1a] border border-white/10 p-6">
                                <p className="text-center text-neutral-400">
                                    This collection has no templates. Add templates in the{' '}
                                    <a href="/custom?tab=collections" className="text-[--rl-accent] hover:underline">
                                        Collections page
                                    </a>
                                    .
                                </p>
                            </Card>
                        </div>
                    )}

                    {/* Generate Collection Button */}
                    <div className="mt-8 flex flex-col items-center gap-4">
                        {(() => {
                            const canGenerate = Boolean(referenceImage && uploadedFile && selectedCollection && selectedCollection.templates?.length);

                            let helperText = '';
                            if (!referenceImage || !uploadedFile) {
                                helperText = 'Upload a reference image to generate';
                            } else if (!selectedCollection) {
                                helperText = 'Select a collection to generate';
                            } else if (!selectedCollection.templates || selectedCollection.templates.length === 0) {
                                helperText = 'Selected collection has no templates';
                            }

                            return (
                                <>
                                    <button
                                        ref={generateBtnRef}
                                        onClick={handleGenerate}
                                        disabled={!canGenerate || isGenerating || isUploading}
                                        className={`w-full max-w-md py-4 px-8 text-lg font-semibold flex items-center justify-center gap-3 rounded-xl group ${canGenerate && !isGenerating && !isUploading
                                            ? 'text-white'
                                            : 'bg-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.45)] border border-[rgba(255,255,255,0.12)] shadow-[inset_0_0_6px_rgba(0,0,0,0.25)] cursor-not-allowed'
                                            }`}
                                        style={
                                            canGenerate && !isGenerating && !isUploading
                                                ? {
                                                    background: 'linear-gradient(180deg, #FF8050 0%, #FF6340 100%)',
                                                    boxShadow:
                                                        '0 4px 12px rgba(0,0,0,0.32), 0 2px 8px rgba(255,98,64,0.30)',
                                                    transition:
                                                        'transform 0.15s ease-out, box-shadow 0.2s ease-out, background 0.2s ease-out',
                                                    transform: 'translateY(0)',
                                                }
                                                : undefined
                                        }
                                        onMouseEnter={(e) => {
                                            if (canGenerate && !isGenerating && !isUploading) {
                                                e.currentTarget.style.background =
                                                    'linear-gradient(180deg, #FF6E3A 0%, #FF3E1F 100%)';
                                                e.currentTarget.style.boxShadow =
                                                    '0 4px 12px rgba(0,0,0,0.32), 0 0 6px rgba(255,120,70,0.35), inset 0 1px 1px rgba(255,255,255,0.22)';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (canGenerate && !isGenerating && !isUploading) {
                                                e.currentTarget.style.background =
                                                    'linear-gradient(180deg, #FF8050 0%, #FF6340 100%)';
                                                e.currentTarget.style.boxShadow =
                                                    '0 4px 12px rgba(0,0,0,0.32), 0 2px 8px rgba(255,98,64,0.30)';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                            }
                                        }}
                                    >
                                        <Sparkles className="w-5 h-5" />
                                        {isGenerating ? 'Generating...' : isUploading ? 'Uploading...' : 'Generate Collection'}
                                    </button>

                                    {helperText && (
                                        <p className="text-sm text-[var(--rl-accent)] text-center max-w-md">{helperText}</p>
                                    )}
                                </>
                            );
                        })()}
                    </div>

                    {/* Active Progress Bar */}
                    {isGenerating && (
                        <div className="w-full h-1 bg-neutral-900 rounded overflow-hidden">
                            <div
                                className="h-full transition-[width] duration-300"
                                style={{
                                    width: `${progress}%`,
                                    background: "linear-gradient(180deg, #FF8050 0%, #FF6340 100%)"
                                }}
                            />
                        </div>
                    )}

                    {/* Results Section */}
                    {(generatedResults.length > 0 || isGenerating) && (
                        <div ref={scrollRef} className="mt-8 space-y-6">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-semibold text-white">
                                    Generated Images ({generatedResults.length})
                                </h3>

                                <div className="flex flex-col items-end">
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                const allIds = new Set<string>(
                                                    generatedResults.map((r) => r.templateId),
                                                );
                                                setSelectedImages(allIds);
                                            }}
                                            className="text-sm text-gray-400 hover:text-white transition"
                                        >
                                            Select All
                                        </button>

                                        <button
                                            onClick={() => setSelectedImages(new Set())}
                                            className="text-sm text-gray-400 hover:text-white transition"
                                        >
                                            Deselect All
                                        </button>
                                    </div>

                                    {generatedResults.length > 0 && (
                                        <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                                            <Check className="w-4 h-4 text-green-500" />
                                            Auto-saved to History
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Skeleton Placeholder */}
                            <div ref={skeletonRef}>
                                {isGenerating && (
                                    <RenderLabSkeletonRow count={selectedCollection?.templates?.length || 4} />
                                )}
                            </div>

                            {/* Results Grid */}
                            <div
                                className="grid justify-start"
                                style={{
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                                    rowGap: '24px',
                                    columnGap: '24px',
                                }}
                            >
                                {generatedResults.map((result) => (
                                    <ResultCard
                                        key={result.templateId}
                                        result={result}
                                        isSelected={selectedImages.has(result.templateId)}
                                        onToggle={() => {
                                            setSelectedImages((prev) => {
                                                const newSet = new Set(prev);
                                                if (newSet.has(result.templateId)) newSet.delete(result.templateId);
                                                else newSet.add(result.templateId);
                                                return newSet;
                                            });
                                        }}
                                        onImageClick={(imageUrl) => setModalImage(imageUrl)}
                                    />
                                ))}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={handleDownloadSelected}
                                    disabled={selectedImages.size === 0}
                                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed rounded-lg font-medium transition"
                                >
                                    Download Selected ({selectedImages.size})
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Image Preview Modal */}
            <ImagePreviewModal imageUrl={modalImage} onClose={() => setModalImage(null)} />
        </div>
    );
}

// ResultCard Component
interface ResultCardProps {
    result: GeneratedResult;
    isSelected: boolean;
    onToggle: () => void;
    onImageClick: (imageUrl: string) => void;
}

function ResultCard({ result, isSelected, onToggle, onImageClick }: ResultCardProps) {
    if (!result || !result.imageUrl || !result.templateName) {
        return null;
    }

    return (
        <Card
            className="relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={onToggle}
        >
            {/* Checkbox */}
            <div className="absolute top-3 left-3 z-10">
                <div
                    className={`
          w-6 h-6 rounded border-2 flex items-center justify-center transition-all
          ${isSelected
                            ? 'bg-gray-500 border-gray-500'
                            : 'bg-black/50 border-white/30 group-hover:border-white/50'
                        }
        `}
                >
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>
            </div>

            {/* Image */}
            <img
                src={result.imageUrl}
                alt={result.templateName}
                className="w-full aspect-square object-cover"
                onClick={(e) => {
                    e.stopPropagation();
                    onImageClick(result.imageUrl);
                }}
            />

            {/* Overlay with info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <p className="text-sm font-medium text-white">{result.templateName}</p>
            </div>

            {/* Selected overlay */}
            {isSelected && (
                <div className="absolute inset-0 border-4 border-orange-500/50 pointer-events-none" />
            )}
        </Card>
    );
}
