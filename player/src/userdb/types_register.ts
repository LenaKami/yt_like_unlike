import {z} from 'zod'

export const validationSchema = z.object({
    login: z.string().min(1, 'Login is required').min(7, "Login should be min 7 characters"),
    email: z.string().email({message: 'Invalid e-mail'}),
    password: z.string().min(1, 'Password is required').min(7, 'Login should be min 7 characters')

})

export type RegistrationFormData= z.infer<typeof validationSchema>