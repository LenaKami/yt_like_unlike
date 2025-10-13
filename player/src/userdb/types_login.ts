import {z} from 'zod'

export const validationSchema = z.object({
    login: z.string().min(1, 'Login is required').min(7, "Login should be min 7 characters"),
    password: z.string().min(1, 'Password is required').min(7, 'Login should be min 7 characters')

})

export type LoginFormData= z.infer<typeof validationSchema>