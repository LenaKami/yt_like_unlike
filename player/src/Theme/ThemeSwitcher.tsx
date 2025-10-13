import { MouseEventHandler, useState } from "react"
import { Theme, getMode, useThemeContext } from "./ThemeContext"
//import { Button } from "../ui"
import {SunIcon, MoonIcon} from '@heroicons/react/24/solid'

export const ThemeSwitcher = () => {
    const context = useThemeContext()
    const [theme, setTheme] = useState<Theme | null>(getMode())
    const handlerClick : MouseEventHandler = () => {
            context.toggle()
            setTheme((theme) => theme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT)
    }
    const icon = theme ===Theme.DARK ? (<SunIcon onClick={handlerClick} className="h-4 w-4 text-blue-100 cursor-pointer"/>) : (<MoonIcon onClick={handlerClick} className="h-4 w-4 text-slate-900 cursor-pointer"/>)
    return(
        <div className="mb-4">
            {icon}
        </div>
    )
}