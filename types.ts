
export interface ProcessedFile {
  id: string;
  originalName: string;
  newName: string;
  blob: Blob;
  previewUrl: string;
  status: 'processing' | 'completed' | 'error';
  width: number;
  height: number;
}

export enum Resolution {
  SD = 256,
  HD = 512,
  FHD = 1024,
  UHD = 2048
}

export interface ProcessingStats {
  total: number;
  completed: number;
  errors: number;
}
