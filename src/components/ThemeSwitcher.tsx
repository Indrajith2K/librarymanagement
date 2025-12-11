'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <Select value={theme} onValueChange={setTheme}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select theme" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light">Light Mode</SelectItem>
        <SelectItem value="dark">Dark Mode</SelectItem>
        <SelectItem value="system">System Default</SelectItem>
      </SelectContent>
    </Select>
  );
}
