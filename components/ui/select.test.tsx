import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from './select';

describe('Select', () => {
  it('renders trigger with value', () => {
    render(
      <Select defaultValue="val1">
        <SelectTrigger>
          <SelectValue placeholder="Select item" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="val1">Item 1</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });
});
