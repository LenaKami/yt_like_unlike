type Props ={
    //label?: string
    children: string | string []
}

export const Text = ({children}: Props) => {
    return <p className="text-blue-600 dark:text-slate-300">{children}</p>
}