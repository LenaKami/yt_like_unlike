import { z } from 'zod'

export const validationSchema = z
  .object({
    taskname: z
      .string()
      .min(1, 'Wprowadź nazwę zadania')
      .min(7, 'Muszą być co najmniej 7 znaki'),
    dataaa: z.string().min(1, 'Wybierz datę'),
    startg: z.string().min(1, 'Wprowadź godzinę rozpoczęcia'),
    endg: z.string().min(1, 'Wprowadź godzinę zakończenia'),
    playlist: z.string().min(1, 'Wybierz playlistę')
  })
  .refine((data) => {
    if (!data.startg || !data.endg) return true; // jeśli nie ma godzin, nie walidujemy
    // zakładam format "HH:MM" dla startg i endg
    const [startHour, startMin] = data.startg.split(':').map(Number);
    const [endHour, endMin] = data.endg.split(':').map(Number);
    const startDate = new Date(0, 0, 0, startHour, startMin);
    const endDate = new Date(0, 0, 0, endHour, endMin);
    return endDate >= startDate;
  }, {
    message: 'Godzina zakończenia nie może być przed godziną rozpoczęcia',
    path: ['endg']
  });

export type StudyFormData = z.infer<typeof validationSchema>