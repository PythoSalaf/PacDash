import { BsGlobe } from "react-icons/bs";
import { FaArrowTrendUp, FaAnchor } from "react-icons/fa6";
import { LuShield } from "react-icons/lu";
import { FiDollarSign } from "react-icons/fi";
import { Link, NavLink } from "react-router";
import { TbExternalLink } from "react-icons/tb";

const Sidebar = () => {
  const navItem = [
    { id: "/", label: "Markets", icon: BsGlobe },
    { id: "pnl", label: "PnL", icon: FaArrowTrendUp },
    { id: "risk", label: "Risk", icon: LuShield },
    { id: "whale-feed", label: "Whale Feed", icon: FaAnchor },
    { id: "funding", label: "Funding", icon: FiDollarSign },
  ];

  return (
    <aside className="flex flex-col h-full w-full text-[#14baf1] shrink-0 border-r border-border">
      <nav className="flex-1 px-2 space-y-4">
        {navItem.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.id}
              to={item.id}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm lg:text-[15px] font-body transition-all duration-150
                ${
                  isActive
                    ? "bg-sidebar-accent text-white border-l-2 border-[#14baf1] shadow-[inset_0_0_12px_hsl(190_100%_50%/0.06)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 border-l-2 border-transparent"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 ${
                      isActive
                        ? "text-[#14baf1] drop-shadow-[0_0_6px_hsl(190_100%_50%/0.5)]"
                        : ""
                    }`}
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 mt-auto space-y-2 border-t border-border">
        <Link
          to="#"
          className="flex items-center gap-2 text-xs md:text-sm transition-colors text-muted-foreground hover:text-foreground"
        >
          <TbExternalLink className="w-4 h-4" /> Discord
        </Link>
        <Link
          to="#"
          className="flex items-center gap-2 text-xs md:text-sm transition-colors text-muted-foreground hover:text-foreground"
        >
          <TbExternalLink className="w-4 h-4" /> Docs
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
