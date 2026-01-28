export function transformStringArray({
  value,
}: {
  value: string | string[];
}): string[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    // Handle JSON array format: ["PENDING","ACCEPTED"]
    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        const parsed: unknown = JSON.parse(value);
        return Array.isArray(parsed) ? (parsed as string[]) : [value];
      } catch {
        return [value];
      }
    }
    // Handle comma-separated values: PENDING,ACCEPTED
    if (value.includes(',')) {
      return value.split(',').map((s) => s.trim());
    }
    // Single value
    return [value];
  }
  return [value];
}
