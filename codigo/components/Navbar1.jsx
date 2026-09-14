function Navbar1() {
  return (
    <div className="navbar bg-[#0F2547] shadow-sm">
      <div className="flex-1">
        <a className=" text-xl cursor-pointer hover:opacity-80 transition-opacity duration-200 outline-none focus:outline-none focus:ring-0">
          <span className="text-[#FFFFFF]">Anglo</span>
          <span className="text-[#00D2FF]">Electric</span>
        </a>
      </div>
      <div className="flex gap-2">
        <ul className="menu menu-horizontal px-1">
          <li>
            <a className="text-[#FFFFFF] hover:" href="#home">Inicio</a>
          </li>
        </ul>

        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-circle avatar"
          >
            <div className="w-10 rounded-full">
              <img
                alt="Tailwind CSS Navbar component"
                src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
              />
            </div>
          </div>
          <ul
            tabIndex={-1}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-50 mt-3 w-52 p-2 shadow"
          >
            <li>
              <a className="justify-between">
                Profile
                <span className="badge">New</span>
              </a>
            </li>
            <li>
              <a>Settings</a>
            </li>
            <li>
              <a>Logout</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Navbar1;