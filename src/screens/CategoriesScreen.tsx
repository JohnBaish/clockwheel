import { useEffect, useRef, useState } from 'react';
import { useApp } from '../state/store';
import { IconGrip, IconPlus, IconTrash } from '../lib/icons';

export function CategoriesScreen() {
  const { categories, categoryOrder, addCategory, renameCategory, recolorCategory, reorderCategory, deleteCategory, categoryUsageCount } = useApp();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nameInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const prevCount = useRef(categoryOrder.length);

  useEffect(() => {
    if (categoryOrder.length > prevCount.current) {
      const lastId = categoryOrder[categoryOrder.length - 1];
      const input = nameInputs.current[lastId];
      if (input) { input.focus(); input.select(); }
    }
    prevCount.current = categoryOrder.length;
  }, [categoryOrder]);

  const handleDrop = (targetIndex: number) => {
    if (dragIndex !== null && dragIndex !== targetIndex) reorderCategory(dragIndex, targetIndex);
    setDragIndex(null);
    setOverIndex(null);
  };

  const handleDelete = (id: string) => {
    const message = deleteCategory(id);
    setError(message);
  };

  return (
    <div style={{ padding: '0 var(--space-6) var(--space-6)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) 0', flexWrap: 'wrap' }}>
        <div style={{ flex: 'none' }}>
          <div className="card-kicker" style={{ margin: 0 }}>User-defined</div>
          <h2 style={{ margin: '1px 0 0', lineHeight: 1.05 }}>Categories</h2>
        </div>
        <span className="tag tag-neutral mono">{categoryOrder.length} categories</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center', flex: 'none' }}>
          <button className="btn btn-primary" onClick={() => addCategory('New category')} style={{ padding: '8px 18px', fontSize: '13.5px', whiteSpace: 'nowrap' }}>
            <IconPlus size={15} />Add category
          </button>
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--color-accent-100)', color: 'var(--color-accent-800)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 'var(--space-3)', fontSize: 13.5 }}>
          <span style={{ flex: 1 }}>{error}</span>
          <button className="btn btn-ghost" onClick={() => setError(null)} style={{ color: 'var(--color-accent-700)', padding: '2px 8px' }}>Dismiss</button>
        </div>
      )}

      <div style={{ background: 'var(--color-surface)', borderRadius: 'calc(var(--radius-lg)*1.1)', padding: 'var(--space-3) var(--space-4)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
        {categoryOrder.map((id, i) => {
          const c = categories[id];
          const usage = categoryUsageCount(id);
          return (
            <div
              key={id}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => { e.preventDefault(); setOverIndex(i); }}
              onDrop={(e) => { e.preventDefault(); handleDrop(i); }}
              onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 6px',
                borderBottom: i < categoryOrder.length - 1 ? '1px solid var(--color-divider)' : 'none',
                opacity: dragIndex === i ? 0.4 : 1,
                background: overIndex === i && dragIndex !== null && dragIndex !== i ? 'var(--color-accent-100)' : undefined,
              }}
            >
              <span style={{ color: 'var(--color-neutral-600)', cursor: 'grab', flex: 'none' }}><IconGrip size={14} /></span>

              <input
                type="color"
                value={c.color}
                onChange={(e) => recolorCategory(id, e.target.value)}
                aria-label={`Colour for ${c.name}`}
                style={{ width: 30, height: 30, flex: 'none', border: 'none', borderRadius: 999, padding: 0, cursor: 'pointer', background: 'none' }}
              />

              <input
                ref={(el) => { nameInputs.current[id] = el; }}
                className="input"
                value={c.name}
                onChange={(e) => renameCategory(id, e.target.value)}
                style={{ flex: 1, minWidth: 120, maxWidth: 280, fontWeight: 600 }}
              />

              <span className="mono" style={{ flex: 1, fontSize: 12.5, color: 'var(--color-neutral-700)' }}>
                {usage ? `used ${usage} time${usage === 1 ? '' : 's'}` : 'not used yet'}
              </span>

              <button
                className="btn btn-ghost"
                onClick={() => handleDelete(id)}
                disabled={usage > 0}
                title={usage > 0 ? "Can't delete — still in use" : 'Delete category'}
                style={{ color: usage > 0 ? 'var(--color-neutral-500)' : 'var(--color-accent-700)', flex: 'none' }}
              >
                <IconTrash size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
