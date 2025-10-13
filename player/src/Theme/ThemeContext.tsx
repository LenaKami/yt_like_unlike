import { createContext, useContext, useEffect, useRef } from "react"

export enum Theme {
    LIGHT = 'light',
    DARK = "dark"
}

type ThemeContextType = {
    theme: React.MutableRefObject<Theme>
    toggle: () => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)
ThemeContext.displayName = 'ThemeContext'

export const useThemeContext = () => {
    const context = useContext(ThemeContext)
    if (context === null){
        throw new Error("oh no inside theme")
    }
    return context
}
export const getMode = () => {
    if (window.matchMedia){
        const matchesLightMode = window.matchMedia('(prefers-color-scheme: light)').matches
    return matchesLightMode ? Theme.LIGHT : Theme.DARK
    }
    return null
}
const addDarkClass = () => document.body.classList.add("dark")
const removeDarkClass = () => document.body.classList.remove("dark")
const useTheme = () => {
    //const [theme, setTheme] = useState<Theme>(Theme.LIGHT)
    //const theme = useRef<Theme | null>(getMode())
    const theme = useRef<Theme>(getMode() ?? Theme.LIGHT);

    useEffect(() => {
        const themeMode = getMode()
        if(themeMode === Theme.DARK){
            addDarkClass()
        }else{
            removeDarkClass()
        }
        const handleSchemeChange = (event: MediaQueryListEvent)  => {
            if(event.matches){
                removeDarkClass()
            }else{
                addDarkClass()
            }
        }
            let query: MediaQueryList
            if(themeMode !== null){
                query = window.matchMedia('(prefers-color-schema: light')
                query.addEventListener('change',handleSchemeChange)
            }
        return () => {
            query?.removeEventListener('change', handleSchemeChange)
        }
    }, [])
    const toggle = () =>  {
        if (theme.current === Theme.DARK)
            {
                theme.current = Theme.LIGHT
                //setTheme(Theme.LIGHT)
                removeDarkClass()
            }else{
                theme.current = Theme.DARK
                //setTheme(Theme.DARK)
                addDarkClass()

            }
    }
    return{theme, toggle}
}

export const ThemeContextProvider = ({children}: {children: React.ReactNode}) => {

    return(
        <ThemeContext.Provider value={useTheme()}>
            {children}
        </ThemeContext.Provider>
    )
}