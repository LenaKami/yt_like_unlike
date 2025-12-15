import {z} from 'zod'

export const validationSchema = z.object({
    login: z.string().min(1, 'Wprowadź login').min(7, "Muszą być co najmniej 7 znaki"),
    email: z.string().email({message: 'Nieprawidłowy format email'}).min(1, 'Wprowadź email'),
    password: z.string().min(1, 'Wprowadź hasło').min(7, 'Hasło musi mieć co najmniej 7 znaków'),

})

export type RegistrationFormData= z.infer<typeof validationSchema>