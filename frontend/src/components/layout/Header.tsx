import { NavLink } from 'react-router-dom';

const Header = () => {

  return (
    <header className='w-full pt-5 pb-10'>
      <div className='mx-auto w-full lg:max-w-[90%] px-4 bg-white shadow-sm flex items-center justify-between'>
        <nav className='flex items-center justify-between gap-0.5 h-18'>
          <NavLink to="/" className='text-[1.75rem] font-bold text-primary pr-4'>MADE</NavLink>

          <NavLink to="/admin" className={
            ({ isActive }) =>
              `navbar-button ${isActive ? "border-accent bg-accent text-white" : ""}`}>Dashboard</NavLink>

          <NavLink to="/catalogue" className={
            ({ isActive }) =>
              `navbar-button ${isActive ? "border-accent bg-accent text-white" : ""}`}>Item Catalogue</NavLink>
          <NavLink to="/" className={
            ({ isActive }) =>
              `navbar-button ${isActive ? "border-accent bg-accent text-white" : ""}`}>Box Management</NavLink> 
          {/* Add box management route */}
          <NavLink to="/volunteer_management" className={
            ({ isActive }) =>
              `navbar-button ${isActive ? "border-accent bg-accent text-white" : ""}`}>Volunteer Management</NavLink>
          {/* <NavLink to="/login" className={
            ({ isActive }) =>
              `navbar-button ${isActive ? "border-accent bg-accent text-white" : ""}`}>Login</NavLink>
          <NavLink to="/logout" className={
            ({ isActive }) =>
              `navbar-button ${isActive ? "border-accent bg-accent text-white" : ""}`}>Logout</NavLink> */}
        </nav>
        <div>User</div>
      </div>
    </header>
  );
};

export default Header;