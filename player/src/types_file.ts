import { z } from "zod";

export const validationSchema = z.object({
  foldername: z
    .string()
    .min(1, "Wprowadź nazwę folderu")
    .min(5, "Muszą być co najmniej 5 znaków"),
  filename: z
    .string()
    .min(1, "Wprowadź nazwę pliku")
    .min(5, "Musi być co najmniej 5 znaków"),
    folderId: z.string().min(1, "Wybierz folder"),
  file: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, "Wybierz plik"),
});

export type FileFormData = z.infer<typeof validationSchema>;
