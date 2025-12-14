import {z} from 'zod'

export const validationSchema = z.object({
  playlistName: z.string().min(1, 'Login is required').min(3, 'Wprowadź co najmniej 3 znaki')
});

export type MusicFormData= z.infer<typeof validationSchema>