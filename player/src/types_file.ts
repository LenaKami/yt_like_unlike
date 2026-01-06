import { z } from "zod";

export const documentValidationSchema = z.object({
  filename: z.string().optional(),
  folderId: z.string().min(1, "Wybierz folder"),
  file: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, "Wybierz plik"),
});

export const folderValidationSchema = z.object({
  foldername: z
    .string()
    .min(1, "Wprowadź nazwę folderu")
    .min(3, "Muszą być co najmniej 3 znaki"),
});

export type FileFormData = z.infer<typeof documentValidationSchema>;
export type FolderFormData = z.infer<typeof folderValidationSchema>;
