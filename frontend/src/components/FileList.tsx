import {
  ArrowDownTrayIcon,
  DocumentIcon,
  MagnifyingGlassIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import debounce from "lodash.debounce";
import React, { useEffect, useMemo, useState } from "react";
import { fileService } from "../services/fileService";
import { FileFilterOptions, SortOrder } from "../types/file";

export const FileList: React.FC = () => {
  const queryClient = useQueryClient();
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("");
  const [sizeSort, setSizeSort] = useState<SortOrder | "">("");
  const [minSize, setMinSize] = useState<number | "">("");
  const [maxSize, setMaxSize] = useState<number | "">("");
  const [dateFilter, setFilters] =
    useState<FileFilterOptions["uploaded_date"]>("");

  const handleDateChange = (type: keyof FileFilterOptions, value?: string) => {
    setFilters(value ? format(new Date(value), "yyyy-MM-dd") : undefined);
  };

  // Create the debounced function with useMemo to prevent recreation
  const debouncedSetSearch = useMemo(
    () => debounce(value => setSearchQuery(value), 500),
    []
  );

  // Update search query when input changes
  useEffect(() => {
    debouncedSetSearch(inputValue);

    // Cleanup function to cancel pending debounced calls
    return () => {
      debouncedSetSearch.cancel();
    };
  }, [inputValue, debouncedSetSearch]);

  // Updated query with all filters
  const {
    data: files,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "files",
      searchQuery,
      fileTypeFilter,
      sizeSort,
      dateFilter,
      minSize,
      maxSize,
    ],
    queryFn: () =>
      fileService.getFiles({
        original_filename: searchQuery,
        file_type: fileTypeFilter,
        size_sort: sizeSort || undefined,
        uploaded_date: dateFilter,
        min_size: minSize !== "" ? Number(minSize) * 1024 : undefined,
        max_size: maxSize !== "" ? Number(maxSize) * 1024 : undefined,
      } as FileFilterOptions),
  });

  // Mutation for deleting files
  const deleteMutation = useMutation({
    mutationFn: fileService.deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });

  // Mutation for downloading files
  const downloadMutation = useMutation({
    mutationFn: ({
      fileUrl,
      filename,
    }: {
      fileUrl: string;
      filename: string;
    }) => fileService.downloadFile(fileUrl, filename),
  });
  const clearFilters = () => {
    setInputValue("");
    setSearchQuery("");
    setFileTypeFilter("");
    setSizeSort("");
    setFilters(undefined);
    setMinSize("");
    setMaxSize("");
  };
  //
  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleDownload = async (fileUrl: string, filename: string) => {
    try {
      await downloadMutation.mutateAsync({ fileUrl, filename });
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Failed to load files. Please try again.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative w-48 min-w-[160px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Search files..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
            />
          </div>

          {/* File Type Filter */}
          <select
            className="w-32 py-1.5 pl-2 pr-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            value={fileTypeFilter}
            onChange={e => setFileTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="image">Images</option>
            <option value="application/pdf">PDFs</option>
            <option value="text">Text Files</option>
            <option value="video">Videos</option>
          </select>

          {/* Size Range */}
          <div className="flex items-center space-x-2">
            <select
            className="w-32 py-1.5 pl-2 pr-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              value={minSize}
              onChange={e => setMinSize(Number(e.target.value))}
            >
              <option value="">Min size</option>
              <option value="0">0 KB</option>
              <option value="100">100 KB</option>
              <option value="500">500 KB</option>
              <option value="1024">1 MB</option>
              <option value="2048">2 MB</option>
            </select>

            <select
            className="w-32 py-1.5 pl-2 pr-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              value={maxSize}
              onChange={e => setMaxSize(Number(e.target.value))}
            >
              <option value="">Max size</option>
              <option value="0">0 KB</option>
              <option value="100">100 KB</option>
              <option value="500">500 KB</option>
              <option value="1024">1 MB</option>
              <option value="2048">2 MB</option>
            </select>
            <span className="text-gray-400">-</span>
          </div>

          {/* Date Filter */}
          <input
            type="date"
            className="w-32 py-1.5 px-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            onChange={e => handleDateChange("uploaded_date", e.target.value)}
          />

          {/* Size Sort */}
          <select
            className="w-36 py-1.5 pl-2 pr-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            value={sizeSort}
            onChange={e => setSizeSort(e.target.value as SortOrder | "")}
          >
            <option value="">Sort by</option>
            <option value="asc">Size ▲</option>
            <option value="desc">Size ▼</option>
          </select>

          {/* Clear Filters */}
          <button
            onClick={clearFilters}
            className="py-1.5 px-3 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Uploaded Files</h2>
      </div>

      {!files || files.length === 0 ? (
        <div className="text-center py-12">
          <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No files</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by uploading a file
          </p>
        </div>
      ) : (
        <div className="mt-6 flow-root">
          <ul className="-my-5 divide-y divide-gray-200">
            {files.map(file => (
              <li key={file.id} className="py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <DocumentIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.original_filename}
                    </p>
                    <p className="text-sm text-gray-500">
                      {file.file_type} • {(file.size / 1024).toFixed(2)} KB
                    </p>
                    <p className="text-sm text-gray-500">
                      Uploaded {new Date(file.uploaded_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        handleDownload(file.file, file.original_filename)
                      }
                      disabled={downloadMutation.isPending}
                      className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(file.id)}
                      disabled={deleteMutation.isPending}
                      className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
