import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AccessibleButton from '../AccessibleButton';

describe('AccessibleButton', () => {
  it('renders with correct text', () => {
    render(<AccessibleButton>Click me</AccessibleButton>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('applies correct variant classes', () => {
    render(<AccessibleButton variant="primary">Primary</AccessibleButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gradient-to-r', 'from-blue-600', 'to-cyan-600');
  });

  it('applies correct size classes', () => {
    render(<AccessibleButton size="lg">Large</AccessibleButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
  });

  it('shows loading state', () => {
    render(<AccessibleButton loading>Loading</AccessibleButton>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveTextContent('Loading');
  });

  it('is disabled when disabled prop is true', () => {
    render(<AccessibleButton disabled>Disabled</AccessibleButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<AccessibleButton onClick={handleClick}>Click me</AccessibleButton>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('has proper accessibility attributes', () => {
    render(<AccessibleButton aria-label="Custom label">Button</AccessibleButton>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Custom label');
  });

  it('supports keyboard navigation', () => {
    render(<AccessibleButton>Keyboard accessible</AccessibleButton>);
    const button = screen.getByRole('button');
    button.focus();
    expect(button).toHaveFocus();
  });
});
