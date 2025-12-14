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
            ? "text-white login-box-size"
            : "menulink login-box-size"
        }
      >
        {children}
      </NavLink>
    );
  };