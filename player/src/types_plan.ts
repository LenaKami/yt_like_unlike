import {z} from 'zod'

export const validationSchema = z.object({
  taskname: z.string().min(1, 'Wprowadź nazwę zadania').min(7, 'Muszą być co najmniej 7 znaki'),
  dataaa: z.string().min(1, 'Wybierz datę'),
  startg: z.string().min(1, 'Wprowadź godzinę rozpoczęcia'),
  endg: z.string().min(1, 'Wprowadź godzinę zakończenia'),
  playlist: z.string().min(1, 'Wybierz playlistę')
});

export type StudyFormData= z.infer<typeof validationSchema>