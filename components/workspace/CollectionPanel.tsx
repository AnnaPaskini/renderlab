"use client";

import { IconDotsVertical, IconUpload } from "@tabler/icons-react";
import { useEffect, useState, type DragEvent } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { createClient } from "../../lib/supabaseBrowser";
import { useCollections, type Collection } from "../../lib/useCollections";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { ActionsPanel } from "./ActionsPanel";
import { uploadReferenceImageOnce } from "./uploadReferenceImageOnce";

type TemplateLike = {
	id?: string;
	name?: string;
	title?: string;
	style?: string;
	scenario?: string;
	details?: string;
	prompt?: string;
	createdAt?: string;
	addedAt?: string;
	source?: string;
};

type GenerationResult = {
	templateName: string;
	imageUrl: string;
	templateId: string;
	prompt: string;
};

const CUSTOM_TEMPLATES_STORAGE = "RenderAI_customTemplates";

const ensureTemplateId = (template: TemplateLike) => {
	if (template.id && typeof template.id === "string") return template.id;
	if (template.createdAt && typeof template.createdAt === "string") return template.createdAt;
	const base = template.name || template.title || "template";
	const suffix = template.style || template.scenario || Math.random().toString(36).slice(2, 8);
	return `${base}-${suffix}`.replace(/\s+/g, "-");
};

const readTemplatesFromStorage = (): TemplateLike[] => {
	try {
		const raw = localStorage.getItem(CUSTOM_TEMPLATES_STORAGE);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.map((template) => ({
			...template,
			id: ensureTemplateId(template),
		}));
	} catch (error) {
		console.error("Failed to load templates from storage", error);
		return [];
	}
};

const prepareTemplateForCollection = (template: TemplateLike) => ({
	...template,
	id: ensureTemplateId(template),
	addedAt: new Date().toISOString(),
	source: template.source ?? "imported",
});

// Leonardo-style Dialog Component с Portal
function LeonardoDialog({
	open,
	onClose,
	title,
	children,
	footer,
}: {
	open: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
}) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!open || !mounted) return null;

	const dialog = (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
			{/* Backdrop */}
			<div
				className="absolute inset-0"
				onClick={onClose}
			/>

			{/* Dialog - Apple Style */}
			<div
				className="rounded-2xl p-8 w-full max-w-md relative animate-in zoom-in-95 duration-200 bg-gray-900/95 backdrop-blur-xl border border-white/10 shadow-2xl"
			>
				<h3 className="text-xl font-semibold mb-6 text-white">{title}</h3>
				<div className="space-y-6">{children}</div>
				{footer && <div className="mt-8 flex justify-between gap-3">{footer}</div>}
			</div>
		</div>
	);

	// Рендерим в document.body через Portal
	return createPortal(dialog, document.body);
}

export function CollectionsPanel() {
	const {
		collections,
		createCollection,
		addTemplate,
		removeTemplate,
		deleteCollection,
		duplicateCollection,
		renameCollection,
	} = useCollections();

	const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [newCollectionTitle, setNewCollectionTitle] = useState("");
	const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
	const [templateOptions, setTemplateOptions] = useState<TemplateLike[]>([]);
	const [templateSelection, setTemplateSelection] = useState<TemplateLike | null>(null);
	const [removeTemplateId, setRemoveTemplateId] = useState<string | null>(null);
	const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
	const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
	const [renameDraft, setRenameDraft] = useState("");
	const [duplicateTargetId, setDuplicateTargetId] = useState<string | null>(null);
	const [duplicateDraft, setDuplicateDraft] = useState("");
	const [isDropActive, setIsDropActive] = useState(false);

	// Generation states
	const [isGenerationDialogOpen, setIsGenerationDialogOpen] = useState(false);
	const [referenceImage, setReferenceImage] = useState<string | null>(null);
	const [isGenerating, setIsGenerating] = useState(false);
	const [generationResults, setGenerationResults] = useState<GenerationResult[]>([]);
	const [currentGenerating, setCurrentGenerating] = useState(0);
	const [allTemplates, setAllTemplates] = useState<TemplateLike[]>([]);

	// Validation helpers
	const isCollectionNameExists = (name: string, excludeId?: string): boolean => {
		const trimmedName = name.trim().toLowerCase();
		return collections.some(collection =>
			collection.title.toLowerCase() === trimmedName &&
			collection.id !== excludeId
		);
	};

	const generateUniqueCollectionName = (baseName: string): string => {
		let name = baseName.trim();
		let counter = 1;

		while (isCollectionNameExists(name)) {
			counter++;
			name = `${baseName.trim()} ${counter}`;
		}

		return name;
	};

	const handleSaveCollection = () => {
		toast.success("Collection saved successfully!", {
			description: "Your changes have been saved",
			duration: 3000,
		});
	};

	const activeCollection =
		selectedCollectionId && collections.some((collection) => collection.id === selectedCollectionId)
			? (collections.find((collection) => collection.id === selectedCollectionId) as Collection)
			: null;

	const openRenameDialog = (collection: Collection) => {
		setRenameTargetId(collection.id);
		setRenameDraft(collection.title);
	};

	const handleRenameSubmit = async () => {
		if (!renameTargetId) return;
		const trimmed = renameDraft.trim();
		if (!trimmed) return;

		if (isCollectionNameExists(trimmed, renameTargetId)) {
			toast.error("Collection name already exists", {
				description: "Please choose a different name",
			});
			return;
		}

		const shouldKeepSelection = selectedCollectionId === renameTargetId;
		await renameCollection(renameTargetId, trimmed);
		setRenameTargetId(null);
		setRenameDraft("");

		toast.success("Collection renamed!", {
			description: `Renamed to "${trimmed}"`,
		});

		if (shouldKeepSelection) setSelectedCollectionId(renameTargetId);
	};

	const openDuplicateDialog = (collection: Collection) => {
		const baseTitle = collection.title?.trim() || "Untitled Collection";
		setDuplicateTargetId(collection.id);
		setDuplicateDraft(`${baseTitle} - Copy`);
	};

	const handleDuplicateSubmit = async () => {
		if (!duplicateTargetId) return;
		const trimmed = duplicateDraft.trim();
		if (!trimmed) return;

		// Generate unique name if duplicate exists
		const uniqueName = generateUniqueCollectionName(trimmed);

		const newId = await duplicateCollection(duplicateTargetId, uniqueName);
		setDuplicateTargetId(null);
		setDuplicateDraft("");

		const message = uniqueName !== trimmed
			? `Created "${uniqueName}" (name was adjusted to avoid duplicate)`
			: `Created "${uniqueName}"`;

		toast.success("Collection duplicated!", {
			description: message,
		});

		if (newId) setSelectedCollectionId(newId);
	};

	const handleCreateCollection = async () => {
		const trimmed = newCollectionTitle.trim();
		if (!trimmed) return;

		if (isCollectionNameExists(trimmed)) {
			toast.error("Collection name already exists", {
				description: "Please choose a different name",
			});
			return;
		}

		const newId = await createCollection(trimmed);
		setIsCreateOpen(false);
		setNewCollectionTitle("");
		if (newId) setSelectedCollectionId(newId);

		toast.success("Collection created!", {
			description: `"${trimmed}" is ready to use`,
		});
	};

	const handleOpenTemplatePicker = () => {
		// Use templates loaded from Supabase instead of localStorage
		setTemplateOptions(allTemplates);
		setTemplateSelection(null);
		setIsTemplatePickerOpen(true);
	};

	const handleAddTemplate = () => {
		if (!selectedCollectionId) return;
		handleOpenTemplatePicker();
	};

	const handleAddTemplateToCollection = async () => {
		if (!selectedCollectionId || !templateSelection) return;

		// Check template limit
		const currentCollection = collections.find(c => c.id === selectedCollectionId);
		if (currentCollection && (currentCollection.templates?.length ?? 0) >= 5) {
			toast.error("Collection limit reached", {
				description: "Maximum 5 templates per collection",
			});
			return;
		}

		await addTemplate(selectedCollectionId, prepareTemplateForCollection(templateSelection));
		setIsTemplatePickerOpen(false);

		toast.success("Template added!", {
			description: templateSelection.name || templateSelection.title || "Template added to collection",
		});

		setTemplateSelection(null);
	};

	const handleTemplateDrop = async (event: DragEvent<HTMLDivElement>) => {
		if (!selectedCollectionId) return;
		event.preventDefault();
		setIsDropActive(false);

		const payload = event.dataTransfer.getData("template");
		if (!payload) return;

		try {
			const parsed = JSON.parse(payload) as TemplateLike;

			// Check template limit
			const currentCollection = collections.find(c => c.id === selectedCollectionId);
			if (currentCollection && (currentCollection.templates?.length ?? 0) >= 5) {
				toast.error("Collection limit reached", {
					description: "Maximum 5 templates per collection",
				});
				return;
			}

			await addTemplate(selectedCollectionId, prepareTemplateForCollection(parsed));

			toast.success("Template added!", {
				description: "Dropped into collection",
			});
		} catch (error) {
			console.error("Failed to parse dropped template", error);
			toast.error("Failed to add template");
		}
	};

	const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = "copy";
		setIsDropActive(true);
	};

	const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
		setIsDropActive(false);
	};

	const handleDragEnd = () => {
		setIsDropActive(false);
	};

	const handleRemoveTemplate = async () => {
		if (!selectedCollectionId || !removeTemplateId) return;
		await removeTemplate(selectedCollectionId, removeTemplateId);
		setRemoveTemplateId(null);

		toast.success("Template removed from collection");
	};

	const handleDeleteCollection = async () => {
		if (!deleteTargetId) return;
		const collection = collections.find(c => c.id === deleteTargetId);
		await deleteCollection(deleteTargetId);
		if (selectedCollectionId === deleteTargetId) setSelectedCollectionId(null);
		setDeleteTargetId(null);

		toast.success("Collection deleted", {
			description: collection?.title || "Collection has been removed",
		});
	};

	const closeDetailView = () => {
		setSelectedCollectionId(null);
		setTemplateSelection(null);
		setIsTemplatePickerOpen(false);
	};

	// === LOAD TEMPLATES FROM SUPABASE ===
	const loadTemplatesFromSupabase = async () => {
		try {
			const supabase = createClient();
			const { data: { user }, error: authError } = await supabase.auth.getUser();

			if (authError || !user) {
				console.log('⚠️ No user logged in, skipping template load');
				setAllTemplates([]);
				return;
			}

			const { data, error } = await supabase
				.from('templates')
				.select('*')
				.eq('user_id', user.id)
				.order('created_at', { ascending: false });

			if (error) {
				console.error('❌ Failed to load templates:', error);
				throw error;
			}

			console.log('✅ Loaded templates from Supabase:', data?.length || 0);
			setAllTemplates(data || []);
		} catch (error) {
			console.error('Failed to load templates:', error);
			setAllTemplates([]);
		}
	};

	// Load templates on mount
	useEffect(() => {
		loadTemplatesFromSupabase();
	}, []);

	// === HANDLE IMAGE UPLOAD ===
	const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith('image/')) {
			toast.error('Please upload an image file');
			return;
		}

		const reader = new FileReader();
		reader.onload = (e) => {
			const result = e.target?.result as string;
			setReferenceImage(result);
		};
		reader.readAsDataURL(file);
	};

	// === BATCH GENERATION LOGIC ===
	const handleBatchGenerate = async () => {
		if (!referenceImage) {
			toast.error('Upload reference image first');
			return;
		}

		try {
			setIsGenerating(true);
			setGenerationResults([]);

			// Get user id for upload
			const supabase = createClient();
			const { data: { user }, error: authError } = await supabase.auth.getUser();
			if (authError || !user) {
				toast.error('User not authenticated');
				return;
			}

			// Upload reference image ONCE
			const uploadedImageUrl = await uploadReferenceImageOnce(referenceImage, user.id);
			if (!uploadedImageUrl) {
				toast.error('Failed to upload reference image');
				return;
			}

			const templateIds = activeCollection?.templates || [];
			const templateDetails = allTemplates.filter(t =>
				templateIds.some(ct => ct.id === t.id)
			);

			console.log(`Starting sequential generation for ${templateDetails.length} templates`);

			let successCount = 0;

			// SEQUENTIAL - one at a time
			for (let i = 0; i < templateDetails.length; i++) {
				const template = templateDetails[i];
				setCurrentGenerating(i + 1);

				console.log(`[${i + 1}/${templateDetails.length}] Generating: ${template.name}`);



				let retries = 1;
				let success = false;
				for (let attempt = 0; attempt <= retries; attempt++) {
					try {
						console.log(`⏰ [${i + 1}] START: ${Date.now()} (attempt ${attempt + 1})`);
						console.log(`📸 Reference image size: ${referenceImage.length} chars`);

						const startTime = Date.now();
						const response = await fetch('/api/generate', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								prompt: template.prompt || '',
								model: 'nano-banana',
								imageUrl: uploadedImageUrl, // Use uploaded URL
							}),
						});

						const duration = Date.now() - startTime;
						console.log(`⏱️ [${i + 1}] Request took: ${duration}ms`);

						if (!response.ok) {
							const errorText = await response.text();
							console.error(`❌ [${i + 1}] API ERROR:`, {
								status: response.status,
								statusText: response.statusText,
								body: errorText,
								duration: `${duration}ms`
							});
							throw new Error(`Generation failed: ${response.status}`);
						}

						const result = await response.json();
						console.log(`✅ [${i + 1}] SUCCESS in ${duration}ms:`, result);

						const imageUrl = result.output?.imageUrl;
						if (!imageUrl) {
							console.error(`No imageUrl in response for ${template.name}:`, result);
							throw new Error('No image URL in response');
						}

						// Add to results
						setGenerationResults(prev => [...prev, {
							templateName: template.name || 'Untitled',
							imageUrl: imageUrl,
							templateId: template.id || '',
							prompt: template.prompt || '',
						}]);

						successCount++;
						console.log(`✓ Success [${i + 1}/${templateDetails.length}]: ${template.name}`);
						toast.success(`Generated ${i + 1}/${templateDetails.length}`);

						// Small delay between generations to avoid rate limits
						if (i < templateDetails.length - 1) {
							await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
						}

						success = true;
						break; // Success, exit retry loop
					} catch (error) {
						if (attempt === retries) {
							console.error(`✗ Failed [${i + 1}/${templateDetails.length}]: ${template.name}`, error);
							toast.error(`Failed: ${template.name}`);
						} else {
							console.log(`Retry ${attempt + 1}/${retries + 1}...`);
							await new Promise(r => setTimeout(r, 3000));
						}
					}
				}
			}

			toast.success(`Batch complete: ${successCount}/${templateDetails.length} succeeded`);

		} catch (error) {
			console.error('Batch generation error:', error);
			toast.error('Batch generation failed');
		} finally {
			setIsGenerating(false);
			setCurrentGenerating(0);
		}
	};

	// === SAVE TO HISTORY ===
	const handleSaveToHistory = async () => {
		try {
			const supabase = createClient();
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) {
				toast.error('Please log in to save to history');
				return;
			}

			if (generationResults.length === 0) {
				toast.error('No results to save');
				return;
			}

			console.log(`💾 Saving ${generationResults.length} results to history`);

			for (const result of generationResults) {
				const { error } = await supabase.from('history').insert({
					user_id: user.id,
					image_url: result.imageUrl,
					prompt: result.prompt,
					model: 'leonardo-phoenix-1.0',
					reference_image: referenceImage,
					collection_id: activeCollection?.id || null,
					created_at: new Date().toISOString(),
				});

				if (error) {
					console.error('Failed to save to history:', error);
					throw error;
				}
			}

			toast.success('Saved to history', {
				description: `${generationResults.length} images saved`,
			});

		} catch (error) {
			console.error('Save to history failed:', error);
			toast.error('Failed to save to history');
		}
	};

	// === DOWNLOAD ALL ===
	const handleDownloadAll = async () => {
		try {
			for (let i = 0; i < generationResults.length; i++) {
				const result = generationResults[i];
				const response = await fetch(result.imageUrl);
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `${result.templateName.replace(/\s+/g, '-')}-${i + 1}.png`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				window.URL.revokeObjectURL(url);

				// Small delay between downloads
				await new Promise(resolve => setTimeout(resolve, 500));
			}

			toast.success('All images downloaded');
		} catch (error) {
			console.error('Download failed:', error);
			toast.error('Failed to download images');
		}
	};

	// === OPEN GENERATION DIALOG ===
	const handleOpenGenerationDialog = () => {
		setIsGenerationDialogOpen(true);
		setReferenceImage(null);
		setGenerationResults([]);
		setCurrentGenerating(0);
	};

	const renderCollectionMenu = (collection: Collection) => (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					aria-label="Collection options"
					className="p-2 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
					onClick={(event) => event.stopPropagation()}
				>
					<IconDotsVertical size={16} stroke={1.5} />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuItem
					onSelect={(event) => {
						event.preventDefault();
						openDuplicateDialog(collection);
					}}
				>
					Duplicate
				</DropdownMenuItem>
				<DropdownMenuItem
					onSelect={(event) => {
						event.preventDefault();
						event.stopPropagation();
						openRenameDialog(collection);
					}}
				>
					Rename
				</DropdownMenuItem>
				<DropdownMenuItem
					className="text-red-600 focus:text-red-600"
					onSelect={(event) => {
						event.preventDefault();
						event.stopPropagation();
						setDeleteTargetId(collection.id);
					}}
				>
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);

	return (
		<>
			{activeCollection ? (
				<div
					className={`flex h-full flex-col gap-4 overflow-auto transition-colors ${isDropActive ? "rl-drop-active" : ""
						}`}
					onDrop={handleTemplateDrop}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDragEnd={handleDragEnd}
				>
					<div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-6 dark:border-neutral-800">
						<div>
							<h2 className="text-lg font-semibold leading-none text-neutral-900 dark:text-neutral-100">
								{activeCollection?.title || "Untitled Collection"}
							</h2>
							<div className="text-xs text-purple-400/70 mt-2">
								{(activeCollection.templates?.length ?? 0)}/5 templates
							</div>
						</div>
						<ActionsPanel
							onDuplicate={() => {
								if (activeCollection) {
									openDuplicateDialog(activeCollection);
								}
							}}
							onRename={() => {
								if (activeCollection) {
									openRenameDialog(activeCollection);
								}
							}}
							onSave={handleSaveCollection}
							onAddTemplate={handleAddTemplate}
							onDelete={() => {
								if (activeCollection) {
									setDeleteTargetId(activeCollection.id);
								}
							}}
							onBack={closeDetailView}
							onGenerate={handleOpenGenerationDialog}
						/>
					</div>
					<div className="flex-1 space-y-3 overflow-auto pr-1">
						{(activeCollection.templates?.length ?? 0) === 0 ? (
							<div className="py-10 text-center text-sm text-purple-400/70">
								{isDropActive ? "Release to add template" : "No templates in this collection yet."}
							</div>
						) : (
							activeCollection.templates?.map((template) => (
								<Card key={template.id} className="p-4 transition hover:shadow-md">
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0 flex-1">
											<div className="truncate font-medium text-gray-900 dark:text-gray-100">
												{template.name || template.title || "Untitled template"}
											</div>
											{template.style || template.scenario ? (
												<div className="text-sm text-purple-400/70">
													{template.style || template.scenario}
												</div>
											) : null}
											<div className="mt-2 text-xs text-purple-400/70">
												{template.addedAt
													? `Added ${new Date(template.addedAt).toLocaleDateString()}`
													: template.createdAt
														? `Created ${new Date(template.createdAt).toLocaleDateString()}`
														: "No timestamp"}
											</div>
										</div>

										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<button
													type="button"
													aria-label="Template options"
													className="p-2 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
												>
													<IconDotsVertical size={16} stroke={1.5} />
												</button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													className="text-red-600 focus:text-red-600"
													onSelect={(event) => {
														event.preventDefault();
														event.stopPropagation();
														if (template.id) setRemoveTemplateId(template.id);
													}}
												>
													Remove from collection
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</Card>
							))
						)}
					</div>
				</div>
			) : (
				<div className="flex h-full flex-col gap-4 overflow-auto">
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-lg font-semibold leading-none text-gray-900 dark:text-gray-100">My Collections</h2>
						<Button
							onClick={() => setIsCreateOpen(true)}
							className="rl-btn rl-btn-primary h-9"
						>
							+ New Collection
						</Button>
					</div>

					<div className="grid flex-1 grid-cols-1 gap-4 pr-1 sm:grid-cols-2">
						{collections.length === 0 ? (
							<div className="col-span-full py-12 text-center text-sm text-purple-400/70">
								Create your first collection to organize templates.
							</div>
						) : (
							collections.map((collection) => (
								<div
									key={collection.id}
									role="button"
									tabIndex={0}
									className={`rl-item-selectable flex items-start justify-between gap-2 ${selectedCollectionId === collection.id ? "selected" : ""
										}`}
									onClick={() => setSelectedCollectionId(collection.id)}
									onKeyDown={(event) => {
										if (event.key === "Enter" || event.key === " ") {
											event.preventDefault();
											setSelectedCollectionId(collection.id);
										}
									}}
								>
									<div className="min-w-0 flex-1">
										<div className="truncate font-medium text-gray-900 dark:text-gray-100">
											{collection.title}
										</div>
										<div className="mt-1 text-xs text-purple-400/70">
											{(collection.templates?.length ?? 0)} templates
										</div>
									</div>
									{renderCollectionMenu(collection)}
								</div>
							))
						)}
					</div>
				</div>
			)}

			{/* Leonardo Style Dialogs */}
			<LeonardoDialog
				open={isCreateOpen}
				onClose={() => setIsCreateOpen(false)}
				title="Create collection"
				footer={
					<>
						<button
							onClick={() => setIsCreateOpen(false)}
							className="rl-btn rl-btn-secondary"
						>
							Cancel
						</button>
						<button
							onClick={handleCreateCollection}
							disabled={!newCollectionTitle.trim()}
							className="rl-btn rl-btn-primary"
						>
							Create
						</button>
					</>
				}
			>
				<div className="space-y-2">
					<label className="text-sm font-medium text-purple-400/70">
						Collection Name
					</label>
					<Input
						value={newCollectionTitle}
						onChange={(event) => setNewCollectionTitle(event.target.value)}
						placeholder="e.g., Summer Campaign"
						className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white placeholder-purple-400/50 focus:ring-2 focus:ring-purple-500 transition-all duration-200"
						autoFocus
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								event.preventDefault();
								handleCreateCollection();
							}
						}}
					/>
				</div>
			</LeonardoDialog>

			<LeonardoDialog
				open={!!duplicateTargetId}
				onClose={() => setDuplicateTargetId(null)}
				title="Duplicate collection"
				footer={
					<>
						<button
							onClick={() => {
								setDuplicateTargetId(null);
								setDuplicateDraft("");
							}}
							className="rl-btn rl-btn-secondary"
						>
							Cancel
						</button>
						<button
							onClick={handleDuplicateSubmit}
							disabled={!duplicateDraft.trim()}
							className="rl-btn rl-btn-primary"
						>
							Save
						</button>
					</>
				}
			>
				<div className="space-y-2">
					<label className="text-sm font-medium text-purple-400/70">
						Collection Name
					</label>
					<Input
						value={duplicateDraft}
						onChange={(event) => setDuplicateDraft(event.target.value)}
						placeholder="New collection name"
						className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white placeholder-purple-400/50 focus:ring-2 focus:ring-purple-500 transition-all duration-200"
						autoFocus
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								event.preventDefault();
								handleDuplicateSubmit();
							}
						}}
					/>
				</div>
			</LeonardoDialog>

			<LeonardoDialog
				open={!!renameTargetId}
				onClose={() => setRenameTargetId(null)}
				title="Rename collection"
				footer={
					<>
						<button
							onClick={() => {
								setRenameTargetId(null);
								setRenameDraft("");
							}}
							className="rl-btn rl-btn-secondary"
						>
							Cancel
						</button>
						<button
							onClick={handleRenameSubmit}
							disabled={!renameDraft.trim() || isCollectionNameExists(renameDraft.trim(), renameTargetId || undefined)}
							className="rl-btn rl-btn-primary"
						>
							Rename
						</button>
					</>
				}
			>
				<div className="space-y-2">
					<label className="text-sm font-medium text-purple-400/70">
						Collection Name
					</label>
					<Input
						value={renameDraft}
						onChange={(event) => setRenameDraft(event.target.value)}
						placeholder="New name"
						className={`w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-purple-400/50 focus:ring-2 focus:ring-purple-500 transition-all duration-200 ${renameDraft.trim() && isCollectionNameExists(renameDraft.trim(), renameTargetId || undefined)
							? "text-red-400 border-red-500/50 focus:border-red-500"
							: ""
							}`}
						autoFocus
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								event.preventDefault();
								handleRenameSubmit();
							}
						}}
					/>
				</div>
			</LeonardoDialog>

			<LeonardoDialog
				open={!!deleteTargetId}
				onClose={() => setDeleteTargetId(null)}
				title="Delete this collection?"
				footer={
					<>
						<button
							onClick={() => setDeleteTargetId(null)}
							className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 transition rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
						>
							Cancel
						</button>
						<button
							onClick={handleDeleteCollection}
							className="px-6 py-2 text-sm font-medium bg-[var(--rl-accent)] text-white rounded-lg transition shadow-lg shadow-[var(--rl-accent)]/30"
						>
							Delete
						</button>
					</>
				}
			>
				<div
					tabIndex={0}
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.preventDefault();
							handleDeleteCollection();
						} else if (event.key === "Escape") {
							event.preventDefault();
							setDeleteTargetId(null);
						}
					}}
					className="focus:outline-none"
				>
					<p className="text-purple-400/70 text-sm">
						This action cannot be undone. All templates in this collection will be removed.
					</p>
				</div>
			</LeonardoDialog>

			<LeonardoDialog
				open={!!removeTemplateId}
				onClose={() => setRemoveTemplateId(null)}
				title="Remove template from collection?"
				footer={
					<>
						<button
							onClick={() => setRemoveTemplateId(null)}
							className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 transition rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
						>
							Cancel
						</button>
						<button
							onClick={handleRemoveTemplate}
							className="px-6 py-2 text-sm font-medium bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition shadow-lg shadow-red-500/30"
						>
							Remove
						</button>
					</>
				}
			>
				<div
					tabIndex={0}
					autoFocus
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.preventDefault();
							handleRemoveTemplate();
						} else if (event.key === "Escape") {
							event.preventDefault();
							setRemoveTemplateId(null);
						}
					}}
					className="focus:outline-none"
				>
					<p className="text-purple-400/70 text-sm">
						The template will be removed from this collection only.
					</p>
				</div>
			</LeonardoDialog>

			<LeonardoDialog
				open={isTemplatePickerOpen}
				onClose={() => setIsTemplatePickerOpen(false)}
				title="Select a template"
				footer={
					<>
						<button
							onClick={() => setIsTemplatePickerOpen(false)}
							className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 transition rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
						>
							Cancel
						</button>
						<button
							onClick={handleAddTemplateToCollection}
							disabled={!templateSelection}
							className="rl-btn-primary"
						>
							Add template
						</button>
					</>
				}
			>
				{templateOptions.length === 0 ? (
					<div className="py-8 text-center text-sm text-purple-400/70">
						No saved templates available.
					</div>
				) : (
					<div className="space-y-3 max-h-96 overflow-y-auto pr-2">
						{templateOptions.map((template) => {
							const isActive = templateSelection?.id === template.id;
							return (
								<button
									key={template.id}
									type="button"
									onClick={() => setTemplateSelection(template)}
									className={`rl-item-selectable w-full text-left px-4 py-3 rounded-lg transition-colors duration-200
										${isActive ? "bg-[#ff6b35] text-white font-semibold" : "bg-neutral-800 text-white hover:bg-neutral-700"}
										border border-transparent hover:border-[#ff6b35] focus:outline-none focus:ring-2 focus:ring-[#ff6b35]`}
								>
									<div className="font-medium">
										{template.name || template.title || "Untitled template"}
									</div>
									{template.style || template.scenario ? (
										<div className="text-sm text-purple-400/70 mt-1">
											{template.style || template.scenario}
										</div>
									) : null}
									{template.details ? (
										<div className="mt-2 line-clamp-2 text-xs text-purple-400/70">
											{template.details}
										</div>
									) : null}
								</button>
							);
						})}
					</div>
				)}
			</LeonardoDialog>

			{/* Generation Dialog */}
			<LeonardoDialog
				open={isGenerationDialogOpen}
				onClose={() => !isGenerating && setIsGenerationDialogOpen(false)}
				title={`Generate Collection: ${activeCollection?.title || 'Untitled'}`}
			>
				<div className="space-y-6">
					{/* Reference Image Upload */}
					{!referenceImage ? (
						<div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-[#ff6b35] transition-colors cursor-pointer">
							<input
								type="file"
								accept="image/*"
								onChange={handleImageUpload}
								className="hidden"
								id="reference-image-upload"
								disabled={isGenerating}
							/>
							<label htmlFor="reference-image-upload" className="cursor-pointer">
								<IconUpload size={48} className="mx-auto mb-3 text-purple-400/30" />
								<p className="text-sm text-purple-400/70 mb-1">Upload reference image</p>
								<p className="text-xs text-purple-400/70">Click or drag to upload</p>
							</label>
						</div>
					) : (
						<div className="relative">
							<img
								src={referenceImage}
								alt="Reference"
								className="w-full h-48 object-cover rounded-lg"
							/>
							{!isGenerating && (
								<button
									onClick={() => setReferenceImage(null)}
									className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded px-3 py-1 text-sm"
								>
									Remove
								</button>
							)}
						</div>
					)}

					{/* Templates Preview */}
					{referenceImage && (
						<div>
							<p className="text-sm text-purple-400/70 mb-3">
								Templates in collection: <span className="text-white font-medium">{activeCollection?.templates?.length || 0}</span>
							</p>
							<div className="space-y-2 max-h-48 overflow-y-auto pr-2">
								{allTemplates
									.filter(t => activeCollection?.templates?.some(ct => ct.id === t.id))
									.map((t, idx) => (
										<div
											key={t.id}
											className={`p-3 rounded-lg transition-colors ${isGenerating && idx < currentGenerating
												? 'bg-green-900/30 border border-green-500/50'
												: isGenerating && idx === currentGenerating - 1
													? 'bg-[#ff6b35]/20 border border-[#ff6b35]'
													: 'bg-neutral-800/50 border border-neutral-700'
												}`}
										>
											<div className="flex items-center justify-between">
												<span className="text-sm text-white">{t.name || t.title || 'Untitled'}</span>
												{isGenerating && idx < currentGenerating && (
													<span className="text-xs text-green-400">Done</span>
												)}
												{isGenerating && idx === currentGenerating - 1 && (
													<span className="text-xs text-[#ff6b35]">Generating...</span>
												)}
											</div>
										</div>
									))}
							</div>
						</div>
					)}

					{/* Progress Bar */}
					{isGenerating && (
						<div className="space-y-2">
							<div className="flex justify-between text-sm">
								<span className="text-purple-400/70">
									Generating {currentGenerating}/{activeCollection?.templates?.length || 0}...
								</span>
								<span className="text-[#ff6b35] font-medium">
									{Math.round((currentGenerating / (activeCollection?.templates?.length || 1)) * 100)}%
								</span>
							</div>
							<div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
								<div
									className="bg-gradient-to-r from-[#ff6b35] to-[#ff8c42] h-2.5 rounded-full transition-all duration-500 ease-out"
									style={{
										width: `${(currentGenerating / (activeCollection?.templates?.length || 1)) * 100}%`
									}}
								/>
							</div>
						</div>
					)}

					{/* Results Grid */}
					{generationResults.length > 0 && (
						<div>
							<p className="text-sm text-purple-400/70 mb-3">Generated Images ({generationResults.length})</p>
							<div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
								{generationResults.map((result, i) => (
									<div key={i} className="space-y-2">
										<img
											src={result.imageUrl}
											alt={result.templateName}
											className="w-full h-32 object-cover rounded-lg border border-neutral-700"
										/>
										<p className="text-xs text-purple-400/70 truncate">{result.templateName}</p>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Action Buttons */}
					<div className="flex gap-3 pt-4 border-t border-neutral-700">
						{!isGenerating && generationResults.length === 0 && (
							<>
								<button
									onClick={() => setIsGenerationDialogOpen(false)}
									className="flex-1 px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-neutral-800 transition rounded-lg border border-neutral-700"
								>
									Cancel
								</button>
								<button
									onClick={handleBatchGenerate}
									disabled={!referenceImage || (activeCollection?.templates?.length || 0) === 0}
									className="flex-1 px-4 py-2 text-sm font-medium bg-gradient-to-r from-[#ff6b35] to-[#ff8c42] text-white rounded-lg hover:from-[#ff8c42] hover:to-[#ff6b35] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#ff6b35]/30"
								>
									Generate Collection
								</button>
							</>
						)}

						{generationResults.length > 0 && !isGenerating && (
							<>
								<button
									onClick={() => setIsGenerationDialogOpen(false)}
									className="flex-1 px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-neutral-800 transition rounded-lg border border-neutral-700"
								>
									Close
								</button>
								<button
									onClick={handleDownloadAll}
									className="flex-1 px-4 py-2 text-sm font-medium text-white bg-neutral-700 hover:bg-neutral-600 transition rounded-lg"
								>
									Download All
								</button>
								<button
									onClick={handleSaveToHistory}
									className="flex-1 px-4 py-2 text-sm font-medium bg-gradient-to-r from-[#ff6b35] to-[#ff8c42] text-white rounded-lg hover:from-[#ff8c42] hover:to-[#ff6b35] transition shadow-lg shadow-[#ff6b35]/30"
								>
									Save to History
								</button>
							</>
						)}

						{isGenerating && (
							<div className="flex-1 text-center py-2 text-sm text-purple-400/70">
								Generation in progress...
							</div>
						)}
					</div>
				</div>
			</LeonardoDialog>
		</>
	);
}