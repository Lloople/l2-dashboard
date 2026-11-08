import { NavLink, Outlet } from 'react-router-dom'
import { SECTIONS } from './Sections.js'

/**
 * Layout principal: barra lateral + contingut.
 * La barra lateral es genera a partir de SECTIONS, així que afegir
 * una secció nova només requereix tocar Sections.js.
 */
export default function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">⚔️</span>
          <span className="brand-name">L2 C1</span>
        </div>
        <nav className="sidebar-nav">
          {SECTIONS.map((section) => renderSection(section))}
        </nav>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

function renderSection(section) {
  if (section.children) {
    return (
      <div className="nav-group" key={section.label}>
        <div className="nav-group-title">{section.icon} {section.label}</div>
        {section.children.map((child) => (
          <NavLink
            to={child.path}
            key={child.path}
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            {child.label}
          </NavLink>
        ))}
      </div>
    );
  }
  return (
    <NavLink
      to={section.path}
      key={section.path}
      className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
    >
      {section.icon} {section.label}
    </NavLink>
  );
}