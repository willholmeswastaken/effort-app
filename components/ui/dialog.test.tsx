import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog';

describe('Dialog', () => {
  it('renders trigger', () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByText('Open')).toBeInTheDocument();
  });
});
