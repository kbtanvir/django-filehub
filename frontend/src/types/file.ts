export interface File {
  id: string;
  original_filename: string;
  file_type: string;
  size: number;
  uploaded_at: string;
  file: string;
}
export interface FileFilterOptions {
  original_filename?: string;
  file_type?: string;
  min_size?: number;
  max_size?: number;
  uploaded_after?: string; // ISO date string
  uploaded_before?: string; // ISO date string
}
