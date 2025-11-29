import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AccessibleInput from '../AccessibleInput';

describe('AccessibleInput', () => {
  it('renders with label', () => {
    render(<AccessibleInput label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<AccessibleInput error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows helper text', () => {
    render(<AccessibleInput helperText="Enter your email address" />);
    expect(screen.getByText('Enter your email address')).toBeInTheDocument();
  });

  it('applies correct variant classes', () => {
    render(<AccessibleInput variant="outlined" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('bg-transparent', 'border-2', 'border-white/20');
  });

  it('applies correct size classes', () => {
    render(<AccessibleInput size="lg" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('px-6', 'py-4', 'text-lg');
  });

  it('handles input changes', () => {
    const handleChange = jest.fn();
    render(<AccessibleInput onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('has proper accessibility attributes', () => {
    render(
      <AccessibleInput 
        label="Email"
        error="Invalid email"
        helperText="Enter a valid email"
      />
    );
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-describedby');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('supports keyboard navigation', () => {
    render(<AccessibleInput />);
    const input = screen.getByRole('textbox');
    input.focus();
    expect(input).toHaveFocus();
  });
});
