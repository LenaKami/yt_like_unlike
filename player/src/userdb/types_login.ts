import {z} from 'zod'

export const validationSchema = z.object({
    login: z.string().min(1, 'Wprowadź login').min(7, "Muszą być co najmniej 7 znaki"),
    password: z.string().min(1, 'Wprowadź hasło').min(7, 'Hasło musi mieć co najmniej 7 znaków'),

})

export type LoginFormData= z.infer<typeof validationSchema>