import { NavLink } from "react-router-dom"
type Props = {
    to: string;
    children: string;
  };

export const WaNavLink = ({ to, children }: Props) => {
    return (
      <NavLink
        to={to}
        className={({ isActive}) =>
          isActive
            ? "menulink active"
            : "menulink"
        }
      >
        {children}
      </NavLink>
    );
  };