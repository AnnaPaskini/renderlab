'use client';

import { useHistory } from '@/lib/hooks/useHistory';
import { useWorkspace } from '@/lib/context/WorkspaceContext';
import { useRouter } from 'next/navigation';
import { ImageIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function HistoryPage() {
  const { groups, loading, hasMore, loadMore } = useHistory();
  const { loadTemporary } = useWorkspace();
  const router = useRouter();

  const handleOpenInBuilder = (image: any) => {
    loadTemporary(image.prompt, image.reference_url);
    router.push('/workspace');
  };

  if (loading && groups.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Generation History</h1>

      {groups.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No generations yet.</p>
          <p className="text-sm text-gray-400 mt-2">
            Create your first one in Workspace!
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {groups.map((group) => (
            <div key={group.date_group}>
              {/* Date Header */}
              <h2 className="text-xl font-semibold mb-4 text-gray-700">
                {format(new Date(group.date_group), 'MMMM d, yyyy')}
              </h2>

              {/* Images Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.images.map((img) => (
                  <div
                    key={img.id}
                    className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white"
                  >
                    {/* Image */}
                    <div className="relative aspect-video bg-gray-100">
                      <img
                        src={img.image_url}
                        alt="Generated"
                        className="w-full h-full object-cover"
                      />

                      {/* Reference indicator */}
                      {img.reference_url && (
                        <div
                          className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md"
                          title="Has reference image"
                        >
                          <ImageIcon size={16} className="text-purple-600" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {img.prompt}
                      </p>

                      <button
                        onClick={() => handleOpenInBuilder(img)}
                        className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                      >
                        Open in Builder
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-8">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}