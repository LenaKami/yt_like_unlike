import {z} from 'zod'

export const songValidationSchema = z.object({
  namesong: z.string().min(1, 'Wprowadź nazwę utworu').min(5, 'Musi być co najmniej 5 znaków'),
  linkyt: z.string().min(1, 'Wprowadź link YouTube').url('Wprowadź prawidłowy URL'),
});

export const playlistValidationSchema = z.object({
  playlistName: z.string().min(1, 'Wprowadź nazwę playlisty').min(3, 'Muszą być co najmniej 3 znaki'),
});

export type SongFormData = z.infer<typeof songValidationSchema>
export type PlaylistFormData = z.infer<typeof playlistValidationSchema>