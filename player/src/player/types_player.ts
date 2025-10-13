import {z} from 'zod'

export const validationSchema = z.object({
    linkyt: z.string().min(1, 'Link is required'),
    category: z.string().min(1, 'Choose a category')
})

export type RegistrationFormData= z.infer<typeof validationSchema>