
'use client';

import { RenderLabLayout } from "@/components/layout/RenderLabLayout";
import { RenderLabPanel } from "@/components/panels/RenderLabPanel";
import { RenderLabButton } from "@/components/ui/RenderLabButton";
import { RenderLabInput } from "@/components/ui/RenderLabInput";
import { RenderLabSelect } from "@/components/ui/RenderLabSelect";
import { RenderLabModal } from "@/components/ui/RenderLabModal";
import { showToast } from "@/components/ui/RenderLabToast";
import { Folder, Plus, Grid, List, Save, Trash2, Download, AlertCircle, CheckCircle, Info } from "lucide-react";
import { useState } from "react";

export default function CollectionsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);

  return (
    <RenderLabLayout showHeader={false} maxWidth="1400px">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
              <h1 className="text-4xl font-bold text-white mb-2">
              Collections
            </h1>
            <p className="text-[var(--rl-text-secondary)]">
              Organize your prompts into collections
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center gap-1 p-1 bg-[var(--rl-surface)] border border-[var(--rl-border)] rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-[var(--rl-accent)] text-white' 
                    : 'text-[var(--rl-text-secondary)] hover:text-[var(--rl-text)]'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-[var(--rl-accent)] text-white' 
                    : 'text-[var(--rl-text-secondary)] hover:text-[var(--rl-text)]'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
            {/* Create Button */}
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--rl-accent)] hover:bg-[var(--rl-accent-hover)] text-white rounded-lg transition-colors">
              <Plus className="w-4 h-4" />
              New Collection
            </button>
          </div>
        </div>

        {/* Button Showcase */}
        <RenderLabPanel title="Button System Showcase" icon={<Grid />}>
          <div className="space-y-6">
            {/* Variants */}
            <div>
              <h3 className="text-sm font-medium text-[var(--rl-text)] mb-3">Variants</h3>
              <div className="flex gap-3 flex-wrap">
                <RenderLabButton variant="filled">Primary Action</RenderLabButton>
                <RenderLabButton variant="outline">Secondary Action</RenderLabButton>
                <RenderLabButton variant="gradient">Special CTA</RenderLabButton>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <h3 className="text-sm font-medium text-[var(--rl-text)] mb-3">Sizes</h3>
              <div className="flex gap-3 flex-wrap items-center">
                <RenderLabButton size="sm" variant="filled">Small</RenderLabButton>
                <RenderLabButton size="md" variant="filled">Medium</RenderLabButton>
                <RenderLabButton size="lg" variant="filled">Large</RenderLabButton>
              </div>
            </div>

            {/* With Icons */}
            <div>
              <h3 className="text-sm font-medium text-[var(--rl-text)] mb-3">With Icons</h3>
              <div className="flex gap-3 flex-wrap">
                <RenderLabButton variant="filled">
                  <Plus className="w-4 h-4" />
                  Create New
                </RenderLabButton>
                <RenderLabButton variant="outline">
                  <Save className="w-4 h-4" />
                  Save
                </RenderLabButton>
                <RenderLabButton variant="gradient">
                  <Download className="w-4 h-4" />
                  Download
                </RenderLabButton>
              </div>
            </div>

            {/* States */}
            <div>
              <h3 className="text-sm font-medium text-[var(--rl-text)] mb-3">States</h3>
              <div className="flex gap-3 flex-wrap">
                <RenderLabButton variant="filled" isLoading>
                  Loading...
                </RenderLabButton>
                <RenderLabButton variant="outline" disabled>
                  Disabled
                </RenderLabButton>
                <RenderLabButton variant="gradient" isLoading>
                  Processing
                </RenderLabButton>
              </div>
            </div>

            {/* All Variants in All Sizes */}
            <div>
              <h3 className="text-sm font-medium text-[var(--rl-text)] mb-3">Complete Matrix</h3>
              <div className="space-y-3">
                <div className="flex gap-3 items-center">
                  <span className="text-xs text-[var(--rl-text-secondary)] w-16">Small</span>
                  <RenderLabButton size="sm" variant="filled">Filled</RenderLabButton>
                  <RenderLabButton size="sm" variant="outline">Outline</RenderLabButton>
                  <RenderLabButton size="sm" variant="gradient">Gradient</RenderLabButton>
                </div>
                <div className="flex gap-3 items-center">
                  <span className="text-xs text-[var(--rl-text-secondary)] w-16">Medium</span>
                  <RenderLabButton size="md" variant="filled">Filled</RenderLabButton>
                  <RenderLabButton size="md" variant="outline">Outline</RenderLabButton>
                  <RenderLabButton size="md" variant="gradient">Gradient</RenderLabButton>
                </div>
                <div className="flex gap-3 items-center">
                  <span className="text-xs text-[var(--rl-text-secondary)] w-16">Large</span>
                  <RenderLabButton size="lg" variant="filled">Filled</RenderLabButton>
                  <RenderLabButton size="lg" variant="outline">Outline</RenderLabButton>
                  <RenderLabButton size="lg" variant="gradient">Gradient</RenderLabButton>
                </div>
              </div>
            </div>
          </div>
        </RenderLabPanel>

        {/* Test Panels - Different Variants */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Variant */}
          <RenderLabPanel 
            title="My Collections" 
            icon={<Folder />}
            variant="left"
          >
            <p>Your saved prompt collections will appear here.</p>
            <ul className="mt-3 space-y-2">
              <li className="text-sm">• Exteriors Collection</li>
              <li className="text-sm">• Interiors Collection</li>
              <li className="text-sm">• Lighting Setups</li>
            </ul>
          </RenderLabPanel>

          {/* Right Variant */}
          <RenderLabPanel 
            title="Recent Activity" 
            icon={<Grid />}
            variant="right"
          >
            <p>Track your latest collection updates and additions.</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="p-2 bg-[var(--rl-bg)] rounded">
                Added 3 prompts to "Exteriors"
              </div>
              <div className="p-2 bg-[var(--rl-bg)] rounded">
                Created "Modern Architecture"
              </div>
            </div>
          </RenderLabPanel>

          {/* Floating Variant */}
          <RenderLabPanel 
            title="Quick Stats" 
            variant="floating"
          >
            <div className="space-y-3">
              <div>
                <p className="text-2xl font-bold text-[var(--rl-text)]">12</p>
                <p className="text-sm">Total Collections</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--rl-text)]">48</p>
                <p className="text-sm">Total Prompts</p>
              </div>
            </div>
          </RenderLabPanel>
        </div>

        {/* Panel without title/icon */}
        <RenderLabPanel>
          <div className="text-center py-8">
            <Folder className="w-16 h-16 mx-auto mb-4 text-[var(--rl-text-secondary)] opacity-50" />
            <h3 className="text-lg font-medium text-[var(--rl-text)] mb-2">
              No Collections Yet
            </h3>
            <p className="text-[var(--rl-text-secondary)] mb-4">
              Create your first collection to organize your prompts
            </p>
            <button className="px-6 py-2 bg-[var(--rl-accent)] hover:bg-[var(--rl-accent-hover)] text-white rounded-lg transition-colors">
              Create Collection
            </button>
          </div>
        </RenderLabPanel>

        {/* Form Elements Showcase */}
        <RenderLabPanel title="Form Elements System" icon={<Grid />}>
          <div className="space-y-6">
            {/* Basic Inputs */}
            <div>
              <h3 className="text-sm font-medium text-[var(--rl-text)] mb-3">Input Fields</h3>
              <div className="flex flex-col gap-4 max-w-md">
                <RenderLabInput 
                  placeholder="Enter collection name..." 
                  type="text"
                />
                <RenderLabInput 
                  placeholder="Enter description..." 
                  type="text"
                />
                <RenderLabInput 
                  placeholder="Disabled input" 
                  disabled
                />
              </div>
            </div>

            {/* Input with Error */}
            <div>
              <h3 className="text-sm font-medium text-[var(--rl-text)] mb-3">Error States</h3>
              <div className="flex flex-col gap-4 max-w-md">
                <RenderLabInput 
                  placeholder="Required field..." 
                  error="This field is required"
                />
                <RenderLabInput 
                  placeholder="Email validation..." 
                  error="Please enter a valid email address"
                  type="email"
                />
              </div>
            </div>

            {/* Select Dropdowns */}
            <div>
              <h3 className="text-sm font-medium text-[var(--rl-text)] mb-3">Select Dropdowns</h3>
              <div className="flex flex-col gap-4 max-w-md">
                <RenderLabSelect defaultValue="">
                  <option value="" disabled>
                    Choose a category...
                  </option>
                  <option>Architecture</option>
                  <option>Interior Design</option>
                  <option>Product Visualization</option>
                  <option>Lighting Studies</option>
                </RenderLabSelect>
                
                <RenderLabSelect defaultValue="">
                  <option value="" disabled>
                    Select render quality...
                  </option>
                  <option>Draft (512px)</option>
                  <option>Standard (1024px)</option>
                  <option>High (2048px)</option>
                  <option>Ultra (4096px)</option>
                </RenderLabSelect>

                <RenderLabSelect disabled>
                  <option>Disabled select</option>
                </RenderLabSelect>
              </div>
            </div>

            {/* Select with Error */}
            <div>
              <h3 className="text-sm font-medium text-[var(--rl-text)] mb-3">Select Error State</h3>
              <div className="max-w-md">
                <RenderLabSelect 
                  defaultValue=""
                  error="Please select an option"
                >
                  <option value="" disabled>
                    Choose option...
                  </option>
                  <option>Option 1</option>
                  <option>Option 2</option>
                </RenderLabSelect>
              </div>
            </div>

            {/* Complete Form Example */}
            <div>
              <h3 className="text-sm font-medium text-[var(--rl-text)] mb-3">Complete Form</h3>
              <form className="flex flex-col gap-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-[var(--rl-text)] mb-1.5">
                    Collection Name
                  </label>
                  <RenderLabInput 
                    placeholder="e.g., Modern Architecture" 
                    type="text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--rl-text)] mb-1.5">
                    Category
                  </label>
                  <RenderLabSelect defaultValue="">
                    <option value="" disabled>Choose a category...</option>
                    <option>Architecture</option>
                    <option>Interior Design</option>
                    <option>Product Design</option>
                  </RenderLabSelect>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--rl-text)] mb-1.5">
                    Description
                  </label>
                  <RenderLabInput 
                    placeholder="Brief description of this collection" 
                    type="text"
                  />
                </div>

                <div className="flex gap-3 mt-2">
                  <RenderLabButton variant="filled" type="submit">
                    <Save className="w-4 h-4" />
                    Create Collection
                  </RenderLabButton>
                  <RenderLabButton variant="outline" type="button">
                    Cancel
                  </RenderLabButton>
                </div>
              </form>
            </div>

            {/* Different Input Types */}
            <div>
              <h3 className="text-sm font-medium text-[var(--rl-text)] mb-3">Input Types</h3>
              <div className="flex flex-col gap-4 max-w-md">
                <RenderLabInput 
                  type="email" 
                  placeholder="email@example.com"
                />
                <RenderLabInput 
                  type="password" 
                  placeholder="Enter password"
                />
                <RenderLabInput 
                  type="number" 
                  placeholder="Enter number"
                  min="0"
                  max="100"
                />
                <RenderLabInput 
                  type="url" 
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>
        </RenderLabPanel>

        {/* Modal & Toast System Showcase */}
        <RenderLabPanel title="Modal & Toast System" icon={<AlertCircle />}>
          <div className="space-y-6">
            {/* Toast Examples */}
            <div>
              <h3 className="text-sm font-medium text-[var(--rl-text)] mb-3">Toast Notifications</h3>
              <div className="flex gap-3 flex-wrap">
                <RenderLabButton 
                  variant="filled" 
                  size="sm"
                  onClick={() => showToast.success("Operation completed successfully!")}
                >
                  <CheckCircle className="w-4 h-4" />
                  Success Toast
                </RenderLabButton>
                
                <RenderLabButton 
                  variant="outline" 
                  size="sm"
                  onClick={() => showToast.error("Something went wrong!")}
                >
                  <AlertCircle className="w-4 h-4" />
                  Error Toast
                </RenderLabButton>
                
                <RenderLabButton 
                  variant="gradient" 
                  size="sm"
                  onClick={() => showToast.info("This is an informational message")}
                >
                  <Info className="w-4 h-4" />
                  Info Toast
                </RenderLabButton>

                <RenderLabButton 
                  variant="outline" 
                  size="sm"
                  onClick={() => showToast.warning("Please review your input")}
                >
                  <AlertCircle className="w-4 h-4" />
                  Warning Toast
                </RenderLabButton>
              </div>
            </div>

            {/* Modal Examples */}
            <div>
              <h3 className="text-sm font-medium text-[var(--rl-text)] mb-3">Modal Dialogs</h3>
              <div className="flex gap-3 flex-wrap">
                <RenderLabButton 
                  variant="filled"
                  onClick={() => setModalOpen(true)}
                >
                  Basic Modal
                </RenderLabButton>

                <RenderLabButton 
                  variant="outline"
                  onClick={() => setConfirmModalOpen(true)}
                >
                  Confirmation Modal
                </RenderLabButton>

                <RenderLabButton 
                  variant="gradient"
                  onClick={() => setFormModalOpen(true)}
                >
                  Form Modal
                </RenderLabButton>
              </div>
            </div>

            {/* Promise Toast */}
            <div>
              <h3 className="text-sm font-medium text-[var(--rl-text)] mb-3">Async Operation Toast</h3>
              <RenderLabButton
                variant="filled"
                size="sm"
                onClick={() => {
                  const promise = new Promise((resolve) => 
                    setTimeout(() => resolve("Data loaded"), 2000)
                  );
                  showToast.promise(promise, {
                    loading: "Loading data...",
                    success: "Data loaded successfully!",
                    error: "Failed to load data",
                  });
                }}
              >
                <Download className="w-4 h-4" />
                Simulate Async Action
              </RenderLabButton>
            </div>
          </div>
        </RenderLabPanel>

        {/* Modal Components */}
        <RenderLabModal 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)} 
          title="Basic Modal Example"
        >
          <p className="text-[var(--rl-text-secondary)] mb-4">
            This modal adapts to light/dark theme automatically. It includes smooth fade + scale animations,
            backdrop blur, and can be closed by clicking outside or pressing ESC.
          </p>
          <div className="flex justify-end gap-3">
            <RenderLabButton 
              variant="outline" 
              size="sm" 
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </RenderLabButton>
            <RenderLabButton 
              variant="filled" 
              size="sm" 
              onClick={() => {
                setModalOpen(false);
                showToast.success("Modal action completed!");
              }}
            >
              Confirm
            </RenderLabButton>
          </div>
        </RenderLabModal>

        <RenderLabModal 
          isOpen={confirmModalOpen} 
          onClose={() => setConfirmModalOpen(false)} 
          title="Delete Collection?"
        >
          <p className="text-[var(--rl-text-secondary)] mb-4">
            Are you sure you want to delete this collection? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <RenderLabButton 
              variant="outline" 
              size="sm" 
              onClick={() => setConfirmModalOpen(false)}
            >
              Cancel
            </RenderLabButton>
            <RenderLabButton 
              variant="filled" 
              size="sm" 
              onClick={() => {
                setConfirmModalOpen(false);
                showToast.success("Collection deleted");
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </RenderLabButton>
          </div>
        </RenderLabModal>

        <RenderLabModal 
          isOpen={formModalOpen} 
          onClose={() => setFormModalOpen(false)} 
          title="Create New Collection"
        >
          <form 
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setFormModalOpen(false);
              showToast.success("Collection created successfully!");
            }}
          >
            <div>
              <label className="block text-sm font-medium text-[var(--rl-text)] mb-1.5">
                Collection Name
              </label>
              <RenderLabInput 
                placeholder="e.g., Modern Architecture" 
                type="text"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--rl-text)] mb-1.5">
                Category
              </label>
              <RenderLabSelect defaultValue="" required>
                <option value="" disabled>Choose a category...</option>
                <option>Architecture</option>
                <option>Interior Design</option>
                <option>Product Design</option>
              </RenderLabSelect>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--rl-text)] mb-1.5">
                Description
              </label>
              <RenderLabInput 
                placeholder="Brief description" 
                type="text"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <RenderLabButton 
                variant="outline" 
                size="sm" 
                type="button"
                onClick={() => setFormModalOpen(false)}
              >
                Cancel
              </RenderLabButton>
              <RenderLabButton 
                variant="filled" 
                size="sm" 
                type="submit"
              >
                <Plus className="w-4 h-4" />
                Create
              </RenderLabButton>
            </div>
          </form>
        </RenderLabModal>

        {/* Custom styled panel */}
        <RenderLabPanel 
          title="Custom Styled Panel"
            className="bg-[#1a1a1a]"
        >
          <p>This panel has custom styling applied via className prop.</p>
        </RenderLabPanel>
      </div>
    </RenderLabLayout>
  );
}
