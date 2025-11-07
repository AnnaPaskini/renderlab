"use client";

import { useState, useEffect, type DragEvent } from "react";
import { createPortal } from "react-dom";
import { IconDotsVertical } from "@tabler/icons-react";
import { Button } from "../ui/button";
import { ActionsPanel } from "./ActionsPanel";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useCollections, type Collection } from "../../lib/useCollections";
import { toast } from "sonner";

type TemplateLike = {
	id?: string;
	name?: string;
	title?: string;
	style?: string;
	scenario?: string;
	details?: string;
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
		<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/40 backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* Dialog */}
			<div className="relative w-full max-w-md rounded-xl bg-white dark:bg-gray-900 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
				<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
				<div className="space-y-4">{children}</div>
				{footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
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

	const handleRenameSubmit = () => {
		if (!renameTargetId) return;
		const trimmed = renameDraft.trim();
		if (!trimmed) return;

		const shouldKeepSelection = selectedCollectionId === renameTargetId;
		renameCollection(renameTargetId, trimmed);
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

	const handleDuplicateSubmit = () => {
		if (!duplicateTargetId) return;
		const trimmed = duplicateDraft.trim();
		if (!trimmed) return;

		const newId = duplicateCollection(duplicateTargetId, trimmed);
		setDuplicateTargetId(null);
		setDuplicateDraft("");

		toast.success("Collection duplicated!", {
			description: `Created "${trimmed}"`,
		});

		if (newId) setSelectedCollectionId(newId);
	};

	const handleCreateCollection = () => {
		const trimmed = newCollectionTitle.trim();
		if (!trimmed) return;

		const newId = createCollection(trimmed);
		setIsCreateOpen(false);
		setNewCollectionTitle("");
		setSelectedCollectionId(newId);

		toast.success("Collection created!", {
			description: `"${trimmed}" is ready to use`,
		});
	};

	const handleOpenTemplatePicker = () => {
		const options = readTemplatesFromStorage();
		setTemplateOptions(options);
		setTemplateSelection(null);
		setIsTemplatePickerOpen(true);
	};

	const handleAddTemplate = () => {
		if (!selectedCollectionId) return;
		handleOpenTemplatePicker();
	};

	const handleAddTemplateToCollection = () => {
		if (!selectedCollectionId || !templateSelection) return;
		addTemplate(selectedCollectionId, prepareTemplateForCollection(templateSelection));
		setIsTemplatePickerOpen(false);
		
		toast.success("Template added!", {
			description: templateSelection.name || templateSelection.title || "Template added to collection",
		});
		
		setTemplateSelection(null);
	};

	const handleTemplateDrop = (event: DragEvent<HTMLDivElement>) => {
		if (!selectedCollectionId) return;
		event.preventDefault();
		setIsDropActive(false);

		const payload = event.dataTransfer.getData("template");
		if (!payload) return;

		try {
			const parsed = JSON.parse(payload) as TemplateLike;
			addTemplate(selectedCollectionId, prepareTemplateForCollection(parsed));
			
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
		if (event.currentTarget === event.target) setIsDropActive(false);
	};

	const handleRemoveTemplate = () => {
		if (!selectedCollectionId || !removeTemplateId) return;
		removeTemplate(selectedCollectionId, removeTemplateId);
		setRemoveTemplateId(null);
		
		toast.success("Template removed from collection");
	};

	const handleDeleteCollection = () => {
		if (!deleteTargetId) return;
		const collection = collections.find(c => c.id === deleteTargetId);
		deleteCollection(deleteTargetId);
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

	const renderCollectionMenu = (collection: Collection) => (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					aria-label="Collection options"
					className="inline-flex items-center justify-center rounded-full p-1.5 text-gray-400 transition hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
					onClick={(event) => event.stopPropagation()}
				>
					<IconDotsVertical size={16} stroke={1.5} />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-40">
				<DropdownMenuItem
					onSelect={(event) => {
						event.preventDefault();
						event.stopPropagation();
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
					className={`flex h-full flex-col gap-4 overflow-auto transition-colors ${
						isDropActive ? "bg-blue-50 dark:bg-blue-950/20" : ""
					}`}
					onDrop={handleTemplateDrop}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
				>
					<div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-5 dark:border-neutral-800">
						<h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
							{activeCollection?.title || "Untitled Collection"}
						</h2>
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
							<div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
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
												<div className="text-sm text-gray-500 dark:text-gray-400">
													{template.style || template.scenario}
												</div>
											) : null}
											<div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
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
													className="inline-flex items-center justify-center rounded-full p-1.5 text-gray-400 transition hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">My Collections</h2>
						<Button
							onClick={() => setIsCreateOpen(true)}
							className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/30"
						>
							+ New Collection
						</Button>
					</div>

					<div className="grid flex-1 grid-cols-1 gap-4 pr-1 sm:grid-cols-2">
						{collections.length === 0 ? (
							<div className="col-span-full py-12 text-center text-sm text-gray-500 dark:text-gray-400">
								Create your first collection to organize templates.
							</div>
						) : (
							collections.map((collection) => (
								<div
									key={collection.id}
									role="button"
									tabIndex={0}
									className={`flex cursor-pointer items-start justify-between gap-2 rounded-lg border p-4 transition hover:border-gray-400 hover:shadow ${
										selectedCollectionId === collection.id
											? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
											: "border-gray-200 dark:border-gray-700"
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
										<div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
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
							className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition rounded-lg"
						>
							Cancel
						</button>
						<button
							onClick={handleCreateCollection}
							disabled={!newCollectionTitle.trim()}
							className="px-6 py-2 text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-purple-500/30"
						>
							Create
						</button>
					</>
				}
			>
				<Input
					value={newCollectionTitle}
					onChange={(event) => setNewCollectionTitle(event.target.value)}
					placeholder="Collection name"
					className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20"
					autoFocus
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.preventDefault();
							handleCreateCollection();
						}
					}}
				/>
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
							className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition rounded-lg"
						>
							Cancel
						</button>
						<button
							onClick={handleDuplicateSubmit}
							disabled={!duplicateDraft.trim()}
							className="px-6 py-2 text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-purple-500/30"
						>
							Save
						</button>
					</>
				}
			>
				<Input
					value={duplicateDraft}
					onChange={(event) => setDuplicateDraft(event.target.value)}
					placeholder="New collection name"
					className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20"
					autoFocus
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.preventDefault();
							handleDuplicateSubmit();
						}
					}}
				/>
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
							className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition rounded-lg"
						>
							Cancel
						</button>
						<button
							onClick={handleRenameSubmit}
							disabled={!renameDraft.trim()}
							className="px-6 py-2 text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-purple-500/30"
						>
							Rename
						</button>
					</>
				}
			>
				<Input
					value={renameDraft}
					onChange={(event) => setRenameDraft(event.target.value)}
					placeholder="New name"
					className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20"
					autoFocus
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.preventDefault();
							handleRenameSubmit();
						}
					}}
				/>
			</LeonardoDialog>

			<LeonardoDialog
				open={!!deleteTargetId}
				onClose={() => setDeleteTargetId(null)}
				title="Delete this collection?"
				footer={
					<>
						<button
							onClick={() => setDeleteTargetId(null)}
							className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition rounded-lg"
						>
							Cancel
						</button>
						<button
							onClick={handleDeleteCollection}
							className="px-6 py-2 text-sm font-medium bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition shadow-lg shadow-red-500/30"
						>
							Delete
						</button>
					</>
				}
			>
				<p className="text-gray-600 dark:text-gray-300 text-sm">
					This action cannot be undone. All templates in this collection will be removed.
				</p>
			</LeonardoDialog>

			<LeonardoDialog
				open={!!removeTemplateId}
				onClose={() => setRemoveTemplateId(null)}
				title="Remove template from collection?"
				footer={
					<>
						<button
							onClick={() => setRemoveTemplateId(null)}
							className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition rounded-lg"
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
				<p className="text-gray-300 text-sm">
					The template will be removed from this collection only.
				</p>
			</LeonardoDialog>

			<LeonardoDialog
				open={isTemplatePickerOpen}
				onClose={() => setIsTemplatePickerOpen(false)}
				title="Select a template"
				footer={
					<>
						<button
							onClick={() => setIsTemplatePickerOpen(false)}
							className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition rounded-lg"
						>
							Cancel
						</button>
						<button
							onClick={handleAddTemplateToCollection}
							disabled={!templateSelection}
							className="px-6 py-2 text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-purple-500/30"
						>
							Add template
						</button>
					</>
				}
			>
				{templateOptions.length === 0 ? (
					<div className="py-8 text-center text-sm text-gray-500">
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
									className={`w-full rounded-lg border p-4 text-left transition ${
										isActive
											? "border-purple-500 bg-purple-50"
											: "border-gray-300 hover:border-gray-400 bg-gray-50"
									}`}
								>
									<div className="font-medium text-gray-900">
										{template.name || template.title || "Untitled template"}
									</div>
									{template.style || template.scenario ? (
										<div className="text-sm text-gray-600 mt-1">
											{template.style || template.scenario}
										</div>
									) : null}
									{template.details ? (
										<div className="mt-2 line-clamp-2 text-xs text-gray-500">
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