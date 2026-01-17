import {z} from 'zod'

export const validationSchema = z.object({
    login: z.string().min(1, 'Wprowadź login').min(5, "Muszą być co najmniej 5 znaków").max(15, "Maksymalnie 15 znaków"),
    email: z.string().email({message: 'Nieprawidłowy format email'}).min(1, 'Wprowadź email'),
    password: z.string().min(1, 'Wprowadź hasło').min(7, 'Hasło musi mieć co najmniej 7 znaków'),

})

export type RegistrationFormData= z.infer<typeof validationSchema>