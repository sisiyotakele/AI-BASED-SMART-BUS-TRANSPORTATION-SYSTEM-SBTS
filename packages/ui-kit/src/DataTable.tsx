export type DataTableProps<T> = {
  rows: T[];
};

export function DataTable<T>({ rows }: DataTableProps<T>) {
  return <pre>{JSON.stringify(rows, null, 2)}</pre>;
}