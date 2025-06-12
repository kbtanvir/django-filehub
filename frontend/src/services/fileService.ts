import axios from "axios";
import { FileFilterOptions, File as FileType } from "../types/file";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

export const fileService = {
  async uploadFile(file: File): Promise<FileType> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(`${API_URL}/files/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async getFiles(filterOptions?: FileFilterOptions): Promise<FileType[]> {
    const params = new URLSearchParams();

    if (filterOptions) {
      Object.entries(filterOptions).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });
    }

    if (filterOptions?.size_sort) {
      params.append("size_sort", filterOptions.size_sort); // Make sure this matches the backend parameter name
    }

    const response = await axios.get(`${API_URL}/files/`, {
      params,
    });
    return response.data;
  },

  async deleteFile(id: string): Promise<void> {
    await axios.delete(`${API_URL}/files/${id}/`);
  },

  async downloadFile(fileUrl: string, filename: string): Promise<void> {
    try {
      const response = await axios.get(fileUrl, {
        responseType: "blob",
      });

      // Create a blob URL and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      throw new Error("Failed to download file");
    }
  },
  async searchFiles(query: string): Promise<FileType[]> {
    // If you implemented the search endpoint as suggested earlier
    const response = await axios.get(`${API_URL}/files/search/`, {
      params: { q: query },
    });
    return response.data;
  },

  async checkForDuplicate(
    file: File
  ): Promise<{ isDuplicate: boolean; existingFile?: FileType }> {
    // Compute file hash in the frontend (note: this is a simplified version)
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    try {
      const response = await axios.get(
        `${API_URL}/files/?file_hash=${hashHex}`
      );
      return {
        isDuplicate: response.data.length > 0,
        existingFile: response.data[0],
      };
    } catch (error) {
      console.error("Duplicate check failed:", error);
      return { isDuplicate: false };
    }
  },
};
