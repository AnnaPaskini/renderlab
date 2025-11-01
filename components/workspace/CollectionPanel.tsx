"use client";

import { useState, type DragEvent } from "react";
import { IconDotsVertical } from "@tabler/icons-react";
import { Button } from "../ui/button";
import { ActionsPanel } from "./ActionsPanel";
import { Card } from "../ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useCollections, type Collection } from "../../lib/useCollections";

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

	const handleSaveCollection = () => {};

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

		if (newId) setSelectedCollectionId(newId);
	};

	const handleCreateCollection = () => {
		const trimmed = newCollectionTitle.trim();
		if (!trimmed) return;

		const newId = createCollection(trimmed);
		setIsCreateOpen(false);
		setNewCollectionTitle("");
		setSelectedCollectionId(newId);
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
		} catch (error) {
			console.error("Failed to parse dropped template", error);
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
	};

	const handleDeleteCollection = () => {
		if (!deleteTargetId) return;
		deleteCollection(deleteTargetId);
		if (selectedCollectionId === deleteTargetId) setSelectedCollectionId(null);
		setDeleteTargetId(null);
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
					{/* Top control bar inside collection view */}
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
							className="bg-blue-600 text-white hover:bg-blue-700"
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
											? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
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

			<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create collection</DialogTitle>
					</DialogHeader>
					<Input
						value={newCollectionTitle}
						onChange={(event) => setNewCollectionTitle(event.target.value)}
						placeholder="Collection name"
						autoFocus
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								event.preventDefault();
								handleCreateCollection();
							}
						}}
					/>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsCreateOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleCreateCollection} disabled={!newCollectionTitle.trim()}>
							Create
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={!!duplicateTargetId} onOpenChange={(open) => !open && setDuplicateTargetId(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Duplicate collection</DialogTitle>
					</DialogHeader>
					<Input
						value={duplicateDraft}
						onChange={(event) => setDuplicateDraft(event.target.value)}
						placeholder="New collection name"
						autoFocus
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								event.preventDefault();
								handleDuplicateSubmit();
							}
						}}
					/>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setDuplicateTargetId(null);
								setDuplicateDraft("");
							}}
						>
							Cancel
						</Button>
						<Button onClick={handleDuplicateSubmit} disabled={!duplicateDraft.trim()}>
							Save
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={!!renameTargetId} onOpenChange={(open) => !open && setRenameTargetId(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Rename collection</DialogTitle>
					</DialogHeader>
					<Input
						value={renameDraft}
						onChange={(event) => setRenameDraft(event.target.value)}
						placeholder="New name"
						autoFocus
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								event.preventDefault();
								handleRenameSubmit();
							}
						}}
					/>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setRenameTargetId(null);
								setRenameDraft("");
							}}
						>
							Cancel
						</Button>
						<Button onClick={handleRenameSubmit} disabled={!renameDraft.trim()}>
							Rename
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete this collection?</DialogTitle>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteTargetId(null)}>
							Cancel
						</Button>
						<Button className="bg-red-600 text-white hover:bg-red-700" onClick={handleDeleteCollection}>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={!!removeTemplateId} onOpenChange={(open) => !open && setRemoveTemplateId(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Remove template from collection?</DialogTitle>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setRemoveTemplateId(null)}>
							Cancel
						</Button>
						<Button className="bg-red-600 text-white hover:bg-red-700" onClick={handleRemoveTemplate}>
							Remove
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={isTemplatePickerOpen} onOpenChange={(open) => !open && setIsTemplatePickerOpen(false)}>
				<DialogContent className="max-h-[75vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Select a template</DialogTitle>
					</DialogHeader>
					{templateOptions.length === 0 ? (
						<div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
							No saved templates available.
						</div>
					) : (
						<div className="space-y-3">
							{templateOptions.map((template) => {
								const isActive = templateSelection?.id === template.id;
								return (
									<button
										key={template.id}
										type="button"
										onClick={() => setTemplateSelection(template)}
										className={`w-full rounded-lg border p-4 text-left transition ${
											isActive
												? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
												: "border-gray-200 hover:border-gray-400 dark:border-gray-700"
										}`}
									>
										<div className="font-medium text-gray-900 dark:text-gray-100">
											{template.name || template.title || "Untitled template"}
										</div>
										{template.style || template.scenario ? (
											<div className="text-sm text-gray-500 dark:text-gray-400">
												{template.style || template.scenario}
											</div>
										) : null}
										{template.details ? (
											<div className="mt-2 line-clamp-2 text-xs text-gray-400 dark:text-gray-500">
												{template.details}
											</div>
										) : null}
									</button>
								);
							})}
						</div>
					)}
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsTemplatePickerOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleAddTemplateToCollection} disabled={!templateSelection}>
							Add template
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
