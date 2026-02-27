import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditableTitle from './EditableTitle';

describe('EditableTitle', () => {
  it('renders the title text', () => {
    render(<EditableTitle value="My Recording" onSave={vi.fn()} />);
    expect(screen.getByText('My Recording')).toBeInTheDocument();
  });

  it('enters edit mode on double-click', () => {
    render(<EditableTitle value="My Recording" onSave={vi.fn()} />);
    fireEvent.doubleClick(screen.getByText('My Recording'));
    expect(screen.getByDisplayValue('My Recording')).toBeInTheDocument();
  });

  it('calls onSave with new value on Enter', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<EditableTitle value="Old Title" onSave={onSave} />);

    fireEvent.doubleClick(screen.getByText('Old Title'));
    const input = screen.getByDisplayValue('Old Title');
    fireEvent.change(input, { target: { value: 'New Title' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('New Title');
    });
  });

  it('cancels on Escape', () => {
    const onSave = vi.fn();
    render(<EditableTitle value="Original" onSave={onSave} />);

    fireEvent.doubleClick(screen.getByText('Original'));
    const input = screen.getByDisplayValue('Original');
    fireEvent.change(input, { target: { value: 'Changed' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText('Original')).toBeInTheDocument();
  });

  it('does not save if value unchanged', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<EditableTitle value="Same" onSave={onSave} />);

    fireEvent.doubleClick(screen.getByText('Same'));
    const input = screen.getByDisplayValue('Same');
    fireEvent.keyDown(input, { key: 'Enter' });

    // Should exit edit mode without calling save
    await waitFor(() => {
      expect(onSave).not.toHaveBeenCalled();
    });
  });
});
