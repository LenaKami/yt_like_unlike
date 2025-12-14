import {z} from 'zod'

export const validationSchema = z.object({
  playlistName: z.string().min(1, 'Wprowadź nazwę playlisty').min(3, 'Muszą być co najmniej 3 znaki'),
  namesong: z.string().min(1, 'Wprowadź nazwę utworu').min(5, 'Musi być co najmniej 5 znaków'),
});

export type MusicFormData= z.infer<typeof validationSchema>