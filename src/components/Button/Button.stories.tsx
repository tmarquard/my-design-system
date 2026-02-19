import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Button component with design tokens extracted directly from Figma ' +
          '(file: Buttons, node: 1:573). Supports 3 variants × 6 colors × 3 sizes, ' +
          'with correct Enabled / Hover / Focus / Pressed / Disabled states.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant:  { control: 'select', options: ['contained', 'outlined', 'text'] },
    size:     { control: 'select', options: ['small', 'medium', 'large'] },
    color:    { control: 'select', options: ['primary', 'secondary', 'error', 'warning', 'info', 'success'] },
    disabled: { control: 'boolean' },
    children: { control: 'text' },
    startIcon: { control: false },
    endIcon:   { control: false },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Playground ──────────────────────────────────────────────────────────────

export const Playground: Story = {
  args: {
    children: 'Button',
    variant:  'contained',
    size:     'medium',
    color:    'primary',
    disabled: false,
  },
};

// ─── Variants ────────────────────────────────────────────────────────────────

export const Variants: Story = {
  parameters: { docs: { description: { story: 'Contained has elevation. Outlined uses a 50%-opacity border. Text has no border or background.' } } },
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Button variant="contained" color="primary">Contained</Button>
      <Button variant="outlined"  color="primary">Outlined</Button>
      <Button variant="text"      color="primary">Text</Button>
    </div>
  ),
};

// ─── Sizes ───────────────────────────────────────────────────────────────────

export const Sizes: Story = {
  parameters: { docs: { description: { story: 'Large (42px) · Medium (36px) · Small (30px). Font sizes are 15/14/13px respectively.' } } },
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Button size="large"  color="primary" variant="contained">Large</Button>
      <Button size="medium" color="primary" variant="contained">Medium</Button>
      <Button size="small"  color="primary" variant="contained">Small</Button>
    </div>
  ),
};

// ─── Colors × Variants ───────────────────────────────────────────────────────

const COLORS = ['primary', 'secondary', 'error', 'warning', 'info', 'success'] as const;
const VARIANTS = ['contained', 'outlined', 'text'] as const;

export const AllColors: Story = {
  parameters: { docs: { description: { story: 'All 6 colors across all 3 variants.' } } },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {VARIANTS.map(variant => (
        <div key={variant}>
          <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            {variant}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {COLORS.map(color => (
              <Button key={color} variant={variant} color={color} size="medium">
                {color}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};

// ─── States ──────────────────────────────────────────────────────────────────
//
// CSS pseudo-classes handle Hover, Focus, Active natively.
// This story shows the Disabled state (the only one that requires a prop).

export const DisabledState: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Disabled state: contained gets `rgba(0,0,0,0.12)` background, ' +
          'outlined gets `rgba(0,0,0,0.12)` border, all get `rgba(0,0,0,0.38)` text.',
      },
    },
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {VARIANTS.map(variant => (
        <div key={variant}>
          <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            {variant} · disabled
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {COLORS.map(color => (
              <Button key={color} variant={variant} color={color} disabled>
                {color}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};

// ─── Color deep-dives ────────────────────────────────────────────────────────
//
// Individual stories per color so each can be checked in isolation.
// Hover/Focus/Pressed are live — interact with them in the canvas.

export const Primary: Story = {
  render: () => <ButtonRow color="primary" />,
};

export const Secondary: Story = {
  render: () => <ButtonRow color="secondary" />,
};

export const Error: Story = {
  render: () => <ButtonRow color="error" />,
};

export const Warning: Story = {
  render: () => <ButtonRow color="warning" />,
};

export const Info: Story = {
  render: () => <ButtonRow color="info" />,
};

export const Success: Story = {
  render: () => <ButtonRow color="success" />,
};

function ButtonRow({ color }: { color: typeof COLORS[number] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {VARIANTS.map(variant => (
        <div key={variant} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', width: 80 }}>
            {variant}
          </span>
          <Button variant={variant} color={color} size="large">Enabled</Button>
          <Button variant={variant} color={color} size="medium">Medium</Button>
          <Button variant={variant} color={color} size="small">Small</Button>
          <Button variant={variant} color={color} disabled>Disabled</Button>
        </div>
      ))}
    </div>
  );
}

// ─── With Icons ───────────────────────────────────────────────────────────────

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

const DeleteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
  </svg>
);

export const WithIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Button startIcon={<SendIcon />} variant="contained" color="primary">Send</Button>
        <Button startIcon={<SendIcon />} variant="outlined"  color="primary">Send</Button>
        <Button startIcon={<SendIcon />} variant="text"      color="primary">Send</Button>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Button endIcon={<DeleteIcon />} variant="contained" color="error">Delete</Button>
        <Button endIcon={<DeleteIcon />} variant="outlined"  color="error">Delete</Button>
        <Button endIcon={<DeleteIcon />} variant="text"      color="error">Delete</Button>
      </div>
    </div>
  ),
};
