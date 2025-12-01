"use client";

import { IconDotsVertical } from "@tabler/icons-react";
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
import { RenderLabButton } from "../ui/RenderLabButton";
import { ActionsPanel } from "./ActionsPanel";

type TemplateLike = {
	id?: string;
	name?: string;
	title?: string;
	style?: string;
	scenario?: string;
	details?: string;
	prompt?: string;
	model?: string;
	createdAt?: string;
	addedAt?: string;
	source?: string;
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

			{/* Dialog - RenderLab Dark Style */}
			<div
				className="rounded-2xl p-8 w-full max-w-md relative animate-in zoom-in-95 duration-200 bg-[#1a1a1a] border border-white/10 shadow-2xl"
			>
				<h3 className="text-xl font-semibold mb-6 text-white">{title}</h3>
				<div className="space-y-6">{children}</div>
				{footer && <div className="mt-8 flex justify-end gap-3">{footer}</div>}
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
		if (currentCollection && (currentCollection.templates?.length ?? 0) >= 10) {
			toast.error("Collection limit reached", {
				description: "Maximum 10 templates per collection",
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
			if (currentCollection && (currentCollection.templates?.length ?? 0) >= 10) {
				toast.error("Collection limit reached", {
					description: "Maximum 10 templates per collection",
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
			<DropdownMenuContent className="bg-[var(--rl-panel)] text-[var(--rl-text)] border-[var(--rl-border)]">
				<DropdownMenuItem
					className="hover:bg-[var(--rl-panel-hover)]"
					onSelect={(event) => {
						event.preventDefault();
						openDuplicateDialog(collection);
					}}
				>
					Duplicate
				</DropdownMenuItem>
				<DropdownMenuItem
					className="hover:bg-[var(--rl-panel-hover)]"
					onSelect={(event) => {
						event.preventDefault();
						event.stopPropagation();
						openRenameDialog(collection);
					}}
				>
					Rename
				</DropdownMenuItem>
				<DropdownMenuItem
					className="text-[var(--rl-error)] hover:bg-[var(--rl-panel-hover)] focus:text-[var(--rl-error)]"
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
					<div className="flex items-center justify-between px-4 py-3">
						<button onClick={closeDetailView} className="text-sm opacity-70 hover:opacity-100">
							← Back
						</button>

						<div className="text-center flex-1">
							<h2 className="text-lg font-medium">{activeCollection?.title || "Untitled Collection"}</h2>
							<p className="text-xs opacity-60">
								{(activeCollection.templates?.length ?? 0)}/10 templates
							</p>
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
						/>
					</div>

					<div className="flex-1 space-y-3 overflow-auto pr-1">
						{(activeCollection.templates?.length ?? 0) === 0 ? (
							<div className="py-10 text-center text-sm text-white/70">
								{isDropActive ? "Release to add template" : "No templates in this collection yet."}
							</div>
						) : (
							activeCollection.templates?.map((template) => (
								<Card key={template.id} className="rl-card p-4 transition hover:shadow-md">
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0 flex-1">
											<div className="truncate font-medium text-gray-900 dark:text-gray-100">
												{template.name || template.title || "Untitled template"}
											</div>
											{template.style || template.scenario ? (
												<div className="text-sm text-white/70">
													{template.style || template.scenario}
												</div>
											) : null}
											<div className="mt-2 text-xs text-white/70">
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
											<DropdownMenuContent align="end" className="bg-[var(--rl-panel)] text-[var(--rl-text)] border-[var(--rl-border)]">
												<DropdownMenuItem
													className="text-[var(--rl-error)] hover:bg-[var(--rl-panel-hover)] focus:text-[var(--rl-error)]"
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
							<div className="col-span-full py-12 text-center text-sm text-white/70">
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
										<div className="mt-1 text-xs text-white/70">
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
							className="px-6 py-2.5 text-sm font-medium bg-[#2a2a2a] text-white rounded-xl hover:bg-[#3a3a3a] transition-all"
						>
							Cancel
						</button>
						<RenderLabButton
							onClick={handleCreateCollection}
							disabled={!newCollectionTitle.trim()}
							variant="gradient"
						>
							Create
						</RenderLabButton>
					</>
				}
			>
				<div className="space-y-2">
					<label className="text-sm font-medium text-white/70">
						Collection Name
					</label>
					<Input
						value={newCollectionTitle}
						onChange={(event) => setNewCollectionTitle(event.target.value)}
						placeholder="e.g., Summer Campaign"
						className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-[#ff6b35]/50 focus:border-[#ff6b35] transition-all duration-200"
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
							className="px-6 py-2.5 text-sm font-medium bg-[#2a2a2a] text-white rounded-xl hover:bg-[#3a3a3a] transition-all"
						>
							Cancel
						</button>
						<RenderLabButton
							onClick={handleDuplicateSubmit}
							disabled={!duplicateDraft.trim()}
							variant="gradient"
						>
							Save
						</RenderLabButton>
					</>
				}
			>
				<div className="space-y-2">
					<label className="text-sm font-medium text-white/70">
						Collection Name
					</label>
					<Input
						value={duplicateDraft}
						onChange={(event) => setDuplicateDraft(event.target.value)}
						placeholder="New collection name"
						className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-[#ff6b35]/50 focus:border-[#ff6b35] transition-all duration-200"
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
							className="px-6 py-2.5 text-sm font-medium bg-[#2a2a2a] text-white rounded-xl hover:bg-[#3a3a3a] transition-all"
						>
							Cancel
						</button>
						<RenderLabButton
							onClick={handleRenameSubmit}
							disabled={!renameDraft.trim() || isCollectionNameExists(renameDraft.trim(), renameTargetId || undefined)}
							variant="gradient"
						>
							Rename
						</RenderLabButton>
					</>
				}
			>
				<div className="space-y-2">
					<label className="text-sm font-medium text-white/70">
						Collection Name
					</label>
					<Input
						value={renameDraft}
						onChange={(event) => setRenameDraft(event.target.value)}
						placeholder="New name"
						className={`w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-[#ff6b35]/50 focus:border-[#ff6b35] transition-all duration-200 ${renameDraft.trim() && isCollectionNameExists(renameDraft.trim(), renameTargetId || undefined)
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
							className="px-6 py-2.5 text-sm font-medium bg-[#2a2a2a] text-white rounded-xl hover:bg-[#3a3a3a] transition-all"
						>
							Cancel
						</button>
						<button
							onClick={handleDeleteCollection}
							className="px-6 py-2.5 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all"
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
					<p className="text-white/70 text-sm">
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
							className="px-6 py-2.5 text-sm font-medium bg-[#2a2a2a] text-white rounded-xl hover:bg-[#3a3a3a] transition-all"
						>
							Cancel
						</button>
						<button
							onClick={handleRemoveTemplate}
							className="px-6 py-2.5 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all"
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
					<p className="text-white/70 text-sm">
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
							className="px-6 py-2.5 text-sm font-medium bg-[#2a2a2a] text-white rounded-xl hover:bg-[#3a3a3a] transition-all"
						>
							Cancel
						</button>
						<RenderLabButton
							onClick={handleAddTemplateToCollection}
							disabled={!templateSelection}
							variant="gradient"
						>
							Add template
						</RenderLabButton>
					</>
				}
			>
				{templateOptions.length === 0 ? (
					<div className="py-8 text-center text-sm text-white/70">
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
										<div className="text-sm text-white/70 mt-1">
											{template.style || template.scenario}
										</div>
									) : null}
									{template.details ? (
										<div className="mt-2 line-clamp-2 text-xs text-white/70">
											{template.details}
										</div>
									) : null}
								</button>
							);
						})}
					</div>
				)}
			</LeonardoDialog>
		</>
	);
}