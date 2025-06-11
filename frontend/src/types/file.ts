export interface File {
  id: string;
  original_filename: string;
  file_type: string;
  size: number;
  uploaded_at: string;
  file: string;
}
export type SortOrder = 'asc' | 'desc';
export type FileFilterOptions = {
  original_filename?: string;
  file_type?: string;
  size_sort?: SortOrder;
};
