// AdminApp.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function AdminApp() {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-72 bg-white border-r p-4">
        <div className="mb-6">
          <h1 className="text-xl font-bold">BookGuru Admin</h1>
          <p className="text-sm text-gray-500">Manage users, groups, news & subs</p>
        </div>

        <nav className="space-y-1">
          <NavLink to="/admin" end className={({isActive}) => `block px-3 py-2 rounded ${isActive ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:bg-gray-100'}`}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/users" className={({isActive}) => `block px-3 py-2 rounded ${isActive ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:bg-gray-100'}`}>
            Users
          </NavLink>
          <NavLink to="/admin/groups" className={({isActive}) => `block px-3 py-2 rounded ${isActive ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:bg-gray-100'}`}>
            Groups
          </NavLink>
          <NavLink to="/admin/news" className={({isActive}) => `block px-3 py-2 rounded ${isActive ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:bg-gray-100'}`}>
            News
          </NavLink>
          <NavLink to="/admin/subscriptions" className={({isActive}) => `block px-3 py-2 rounded ${isActive ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:bg-gray-100'}`}>
            Subscriptions
          </NavLink>
<NavLink to="/admin/cbt" className={({ isActive }) => `block px-3 py-2 rounded ${isActive ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:bg-gray-100'}`
  }
>
  CBT
</NavLink>

        </nav>
      </aside>

      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
