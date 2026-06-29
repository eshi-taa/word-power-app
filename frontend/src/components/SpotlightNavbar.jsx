import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export function SpotlightNavbar({
    items = [
        { label: "Home", href: "/" },
        { label: "How It Works", href: "#how-it-works" },
        { label: "Why Us", href: "#why-us" },
        { label: "Sign In / Sign up", href: "/login" },
    ],
    className = "",
    onItemClick,
    defaultActiveIndex = 0,
    style = {},
}) {
    const navRef = useRef(null);
    const navigate = useNavigate();
    const hoverScrollTimeoutRef = useRef(null);
    
    const [activeIndex, setActiveIndex] = useState(defaultActiveIndex);
    const [hoverX, setHoverX] = useState(null);
    const [isHovered, setIsHovered] = useState(false);
    const [activeStyle, setActiveStyle] = useState({ left: 0, width: 0 });

    useEffect(() => {
        updateActiveIndicator();
    }, [activeIndex]);

    // Handle updating the slide indicator size & placement
    const updateActiveIndicator = () => {
        if (!navRef.current) return;
        const activeItem = navRef.current.querySelector(`[data-index="${activeIndex}"]`);
        if (activeItem) {
            setActiveStyle({
                left: activeItem.offsetLeft,
                width: activeItem.offsetWidth,
            });
        }
    };

    // Listen to screen resizes to maintain indicator alignment
    useEffect(() => {
        window.addEventListener("resize", updateActiveIndicator);
        return () => {
            window.removeEventListener("resize", updateActiveIndicator);
            if (hoverScrollTimeoutRef.current) {
                clearTimeout(hoverScrollTimeoutRef.current);
            }
        };
    }, [activeIndex]);

    const handleMouseMove = (e) => {
        if (!navRef.current) return;
        const rect = navRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        setHoverX(x);
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        setHoverX(null);
    };

    const handleItemClick = (e, item, index) => {
        if (hoverScrollTimeoutRef.current) {
            clearTimeout(hoverScrollTimeoutRef.current);
        }

        if (item.href.startsWith("#")) {
            e.preventDefault();
            const el = document.getElementById(item.href.substring(1));
            if (el) {
                const yOffset = -96; // Offset for sticky navbar height + padding
                const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
                window.scrollTo({ top: y, behavior: "smooth" });
            }
        } else if (item.href.startsWith("/")) {
            e.preventDefault();
            navigate(item.href);
        }
        setActiveIndex(index);
        onItemClick?.(item, index);
    };

    const handleMouseEnterLink = (e, item, idx) => {
        if (activeIndex !== idx) {
            e.target.style.color = "var(--text-primary)";
        }
        
        // Clear any pending scroll triggers
        if (hoverScrollTimeoutRef.current) {
            clearTimeout(hoverScrollTimeoutRef.current);
        }

        // Set a deliberate hover timeout of 250ms to ensure scroll is intentional
        hoverScrollTimeoutRef.current = setTimeout(() => {
            if (item.href.startsWith("#")) {
                const el = document.getElementById(item.href.substring(1));
                if (el) {
                    const yOffset = -96;
                    const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
                    window.scrollTo({ top: y, behavior: "smooth" });
                }
                setActiveIndex(idx);
            } else if (item.href === "/" && window.location.pathname === "/") {
                window.scrollTo({ top: 0, behavior: "smooth" });
                setActiveIndex(idx);
            }
        }, 250);
    };

    const handleMouseLeaveLink = (e, idx) => {
        if (activeIndex !== idx) {
            e.target.style.color = "var(--text-secondary)";
        }
        // Cancel scroll trigger if cursor leaves before delay threshold
        if (hoverScrollTimeoutRef.current) {
            clearTimeout(hoverScrollTimeoutRef.current);
        }
    };

    return (
        <div 
            className={`spotlight-nav-container ${className}`}
            style={{
                display: "flex",
                justifyContent: "center",
                width: "100%",
                paddingTop: "20px",
                paddingBottom: "20px",
                position: "sticky",
                top: 0,
                zIndex: 100,
                pointerEvents: "none",
                background: "linear-gradient(to bottom, var(--bg-dark) 40%, rgba(15, 17, 23, 0) 100%)",
                ...style,
            }}
        >
            <nav
                ref={navRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                    position: "relative",
                    height: "56px",
                    borderRadius: "28px",
                    backgroundColor: "rgba(20, 24, 38, 0.7)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid var(--border-muted)",
                    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.35)",
                    overflow: "hidden",
                    display: "inline-flex",
                    pointerEvents: "auto",
                }}
            >
                {/* Links */}
                <ul
                    style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        height: "100%",
                        padding: "0 12px",
                        margin: 0,
                        gap: 0,
                        listStyle: "none",
                        zIndex: 10,
                    }}
                >
                    {items.map((item, idx) => (
                        <li key={idx} style={{ height: "100%", display: "flex", alignItems: "center" }}>
                            <a
                                href={item.href}
                                data-index={idx}
                                onClick={(e) => handleItemClick(e, item, idx)}
                                style={{
                                    padding: "12px 24px",
                                    fontSize: "15px",
                                    fontWeight: "600",
                                    textDecoration: "none",
                                    borderRadius: "9999px",
                                    transition: "color 0.25s ease",
                                    color: activeIndex === idx ? "var(--text-primary)" : "var(--text-secondary)",
                                    cursor: "pointer",
                                }}
                                onMouseEnter={(e) => handleMouseEnterLink(e, item, idx)}
                                onMouseLeave={(e) => handleMouseLeaveLink(e, idx)}
                            >
                                {item.label}
                            </a>
                        </li>
                    ))}
                </ul>

                {/* 1. Moving Spotlight (Mouse Follow) */}
                <div
                    style={{
                        pointerEvents: "none",
                        absolute: "absolute",
                        top: 0,
                        left: 0,
                        width: "160px",
                        height: "100%",
                        zIndex: 1,
                        background: "radial-gradient(50px circle at center, rgba(255, 255, 255, 0.08) 0%, transparent 100%)",
                        transform: `translate3d(${(hoverX || 0) - 80}px, 0, 0)`,
                        opacity: isHovered ? 1 : 0,
                        transition: "transform 0.12s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease",
                        position: "absolute",
                    }}
                />

                {/* 2. Active Indicator Line (Glowing Bottom border style) */}
                <div
                    style={{
                        pointerEvents: "none",
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        width: `${activeStyle.width}px`,
                        height: "2px",
                        zIndex: 2,
                        background: "linear-gradient(90deg, transparent, var(--color-blue) 20%, var(--color-blue) 80%, transparent)",
                        boxShadow: "0 0 8px var(--color-blue)",
                        transform: `translate3d(${activeStyle.left}px, 0, 0)`,
                        transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), width 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                />
            </nav>
        </div>
    );
}

export default SpotlightNavbar;
