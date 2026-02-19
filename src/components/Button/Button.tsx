import React from 'react';
import './Button.css';

export type ButtonVariant = 'contained' | 'outlined' | 'text';
export type ButtonSize    = 'large' | 'medium' | 'small';
export type ButtonColor   = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';

export interface ButtonProps {
  variant?:   ButtonVariant;
  size?:      ButtonSize;
  color?:     ButtonColor;
  disabled?:  boolean;
  startIcon?: React.ReactNode;
  endIcon?:   React.ReactNode;
  children?:  React.ReactNode;
  onClick?:   React.MouseEventHandler<HTMLButtonElement>;
  type?:      'button' | 'submit' | 'reset';
}

// ─── Design tokens — values extracted directly from Figma ────────────────────
//
// Source: file 0SGlWXx4nQMnLBUyMU7GZt, node 1:1068 (<Button> COMPONENT_SET)
// Each entry:  { main, hover, rgb }
//   main  – enabled background (contained) / text+border (outlined, text)
//   hover – hovered background (contained) / hover tint base (outlined, text)
//   rgb   – R,G,B channels used to build rgba() tints for outlined/text states

const COLOR_TOKENS: Record<ButtonColor, { main: string; hover: string; rgb: string }> = {
  primary:   { main: '#265DA5', hover: '#003476', rgb: '38,93,165'   },
  secondary: { main: '#FFA100', hover: '#C67200', rgb: '255,161,0'   },
  error:     { main: '#FF3B30', hover: '#C30005', rgb: '255,59,48'   },
  warning:   { main: '#FFA100', hover: '#C67200', rgb: '255,161,0'   },
  info:      { main: '#007AFF', hover: '#004FCB', rgb: '0,122,255'   },
  success:   { main: '#34C759', hover: '#00952B', rgb: '52,199,89'   },
};

// ─── CSS variable builder ─────────────────────────────────────────────────────

type CSSVars = Record<string, string>;

function buildVars(
  variant:  ButtonVariant,
  color:    ButtonColor,
  disabled: boolean,
): CSSVars {
  if (disabled) {
    return {
      '--btn-disabled-bg':     variant === 'contained' ? 'rgba(0,0,0,0.12)' : 'transparent',
      '--btn-disabled-border': variant === 'outlined'  ? 'rgba(0,0,0,0.12)' : 'transparent',
      // text color is hardcoded in CSS as rgba(0,0,0,0.38)
    };
  }

  const { main, hover, rgb } = COLOR_TOKENS[color];

  if (variant === 'contained') {
    return {
      '--btn-bg':         main,
      '--btn-hover-bg':   hover,
      '--btn-active-bg':  hover,
      '--btn-color':      '#ffffff',
      '--btn-focus-ring': main,
    };
  }

  // outlined & text share the same tint logic for hover/active
  const hoverBg  = `rgba(${rgb}, 0.04)`;
  const activeBg = `rgba(${rgb}, 0.12)`;

  if (variant === 'outlined') {
    return {
      '--btn-bg':           'transparent',
      '--btn-hover-bg':     hoverBg,
      '--btn-active-bg':    activeBg,
      '--btn-color':        main,
      '--btn-border':       `rgba(${rgb}, 0.5)`,
      '--btn-hover-border': `rgba(${rgb}, 0.5)`,
      '--btn-focus-ring':   main,
    };
  }

  // text
  return {
    '--btn-bg':         'transparent',
    '--btn-hover-bg':   hoverBg,
    '--btn-active-bg':  activeBg,
    '--btn-color':      main,
    '--btn-focus-ring': main,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Button({
  variant  = 'contained',
  size     = 'medium',
  color    = 'primary',
  disabled = false,
  startIcon,
  endIcon,
  children,
  onClick,
  type = 'button',
}: ButtonProps) {
  const cssVars = buildVars(variant, color, disabled);

  const className = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
  ].join(' ');

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={className}
      style={cssVars as React.CSSProperties}
    >
      {startIcon}
      {children}
      {endIcon}
    </button>
  );
}
