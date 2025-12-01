"use client";

import { usePathname } from "next/navigation";
import { AppNavbar } from "./AppNavbar";
import { NavBar } from "./index";

export const NavbarWrapper = () => {
    const pathname = usePathname();

    const showNavbar =
        pathname === "/" ||
        pathname.startsWith("/pricing") ||
        pathname.startsWith("/contact");

    const showAppNavbar =
        pathname.startsWith("/workspace") ||
        pathname.startsWith("/custom") ||
        pathname.startsWith("/prompts") ||
        pathname.startsWith("/history") ||
        pathname.startsWith("/account") ||
        pathname.startsWith("/inpaint") ||
        pathname.startsWith("/templates") ||
        pathname.startsWith("/collections") ||
        pathname.startsWith("/batch");

    return (
        <>
            {showNavbar && <NavBar />}
            {showAppNavbar && <AppNavbar />}
        </>
    );
};