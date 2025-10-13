import { NavLink } from "react-router-dom"
type Props = {
    to: string;
    children: string;
    className: string
  };

export const AddWaNavLink = ({ to, children, className }: Props) => {
    return (
      <NavLink
        to={to}
        className={className}
      >
        {children}
      </NavLink>
    );
  };