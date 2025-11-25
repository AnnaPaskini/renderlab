'use client';

import { Download, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface PreviewImage {
  id: string;
  thumbnail_url: string | null;
  url: string;
  created_at: string;
}

interface WorkspacePreviewStripProps {
  images: PreviewImage[];
  onRemoveFromView: (imageId: string) => void;
}

export function WorkspacePreviewStrip({ images, onRemoveFromView }: WorkspacePreviewStripProps) {
  const router = useRouter();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const handleViewInEdit = (url: string) => {
    // Add download=1 parameter to avoid CORS issues with canvas
    const corsSafeUrl = url.includes('?') ? `${url}&download=1` : `${url}?download=1`;
    router.push(`/inpaint?image=${encodeURIComponent(corsSafeUrl)}`);
  };

  const handleDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = 'renderlab-image.jpg';
    link.click();
    toast.success('Downloaded successfully', {
      style: {
        background: '#10b981',
        color: 'white',
        border: 'none'
      }
    });
  };

  const handleRemoveFromView = (imageId: string) => {
    onRemoveFromView(imageId);
  };

  const handleViewHistory = () => {
    router.push('/history');
  };

  const formatDate = (timestamp: string) => {
    const d = new Date(timestamp);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${mm}-${dd} ${hh}:${mi}`;
  };

  if (images.length === 0) {
    return (
      <div style={{
        position: 'fixed',
        top: '120px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        background: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '12px',
        padding: '16px 24px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <span style={{ color: '#666', fontSize: '14px' }}>
          No images yet. Generate some to see your preview strip.
        </span>
        <button
          onClick={handleViewHistory}
          style={{
            padding: '8px 16px',
            background: '#ff6b35',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#ff8555';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = '#ff6b35';
          }}
        >
          View History
        </button>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: '120px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 50,
      background: '#1a1a1a',
      border: '1px solid #333',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
      maxWidth: '90vw',
      overflow: 'hidden'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        overflowX: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: '#333 #1a1a1a'
      }}>
        {images.map((img, index) => (
          <div
            key={img.id}
            style={{
              position: 'relative',
              flexShrink: 0,
              width: '120px',
              height: '120px',
              borderRadius: '8px',
              overflow: 'hidden',
              background: '#0f0f0f',
              border: '1px solid #333',
              cursor: 'pointer'
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Thumbnail */}
            {(img.thumbnail_url || img.url) ? (
              <img
                src={img.thumbnail_url || img.url}
                alt=""
                loading="lazy"
                decoding="async"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                background: '#2a2a2a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
                fontSize: '12px'
              }}>
                No preview
              </div>
            )}

            {/* Date Badge */}
            <div style={{
              position: 'absolute',
              bottom: '4px',
              left: '4px',
              background: '#000',
              color: '#fff',
              padding: '2px 6px',
              fontSize: '10px',
              fontWeight: '500',
              borderRadius: '4px',
              border: '1px solid #333'
            }}>
              {formatDate(img.created_at)}
            </div>

            {/* View in Edit Button - Small centered button on hover */}
            {hoveredIndex === index && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10
                }}
              >
                <button
                  onClick={() => handleViewInEdit(img.url)}
                  style={{
                    padding: '4px 8px',
                    background: '#ff6b35',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#ff8555';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#ff6b35';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  View in Edit
                </button>
              </div>
            )}

            {/* Three dots menu */}
            <div style={{
              position: 'absolute',
              top: '4px',
              right: '4px'
            }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenId(menuOpenId === img.id ? null : img.id);
                }}
                style={{
                  width: '32px',
                  height: '32px',
                  background: '#000',
                  border: '2px solid #fff',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#fff',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#333';
                  e.currentTarget.style.borderColor = '#ccc';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#000';
                  e.currentTarget.style.borderColor = '#fff';
                }}
              >
                <MoreVertical size={12} />
              </button>

              {/* Context Menu */}
              {menuOpenId === img.id && (
                <div style={{
                  position: 'absolute',
                  top: '32px',
                  right: '0',
                  background: '#1a1a1a',
                  border: '1px solid #555',
                  borderRadius: '6px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)',
                  zIndex: 1000,
                  minWidth: '140px',
                  overflow: 'hidden'
                }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(img.url);
                      setMenuOpenId(null);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'none',
                      border: 'none',
                      color: '#fff',
                      fontSize: '14px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#333';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'none';
                    }}
                  >
                    <Download size={14} />
                    Download
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFromView(img.id);
                      setMenuOpenId(null);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'none',
                      border: 'none',
                      color: '#fff',
                      fontSize: '14px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#333';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'none';
                    }}
                  >
                    Remove from View
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* View History Button */}
        <button
          onClick={handleViewHistory}
          style={{
            flexShrink: 0,
            padding: '12px 20px',
            background: '#2a2a2a',
            color: '#ccc',
            border: '1px solid #333',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#333';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = '#2a2a2a';
            e.currentTarget.style.color = '#ccc';
          }}
        >
          View History →
        </button>
      </div>
    </div>
  );
}
