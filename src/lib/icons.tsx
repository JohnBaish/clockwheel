import { GripVertical, Pin, Plus, MessageSquareText, Trash2, ArrowUpDown, Printer, type LucideProps } from 'lucide-react';

const STROKE_WIDTH = 2.75;

function withStroke(Icon: React.ComponentType<LucideProps>) {
  return function StrokedIcon(props: LucideProps) {
    return <Icon strokeWidth={STROKE_WIDTH} {...props} />;
  };
}

export const IconGrip = withStroke(GripVertical);
export const IconPin = withStroke(Pin);
export const IconPlus = withStroke(Plus);
export const IconNote = withStroke(MessageSquareText);
export const IconTrash = withStroke(Trash2);
export const IconArrowUpDown = withStroke(ArrowUpDown);
export const IconPrint = withStroke(Printer);

// The legend swatch on the Clock screen draws the pin marker exactly as it
// appears on the clock face (spoke + dot), not the Lucide pin glyph.
export function PinMark({ size = 16 }: { size?: number }) {
  const h = size * (18 / 16);
  return (
    <svg width={size} height={h} viewBox="0 0 16 18" style={{ display: 'block', flex: 'none' }}>
      <line x1={8} y1={17} x2={8} y2={8} stroke="#201e1d" strokeWidth={2.6} strokeLinecap="round" />
      <circle cx={8} cy={4.6} r={4.2} fill="#201e1d" />
    </svg>
  );
}
