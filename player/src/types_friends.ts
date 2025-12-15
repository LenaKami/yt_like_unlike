import { z } from "zod";

export const validationSchema = z.object({
  friend: z
    .string()
    .min(1, "Wprowadź nazwę znajomego")
    .min(8, "Muszą być co najmniej 8 znaki"),
});


export type FriendFormData= z.infer<typeof validationSchema>
