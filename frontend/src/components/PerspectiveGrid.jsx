import React, { useEffect, useState, useMemo } from "react";

export function PerspectiveGrid({
    className = "",
    rows = 30,
    cols = 30,
    showOverlay = true,
    fadeRadius = 75,
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Memoize tiles array to prevent unnecessary re-renders
    const tiles = useMemo(() => Array.from({ length: rows * cols }), [rows, cols]);

    return (
        <div
            className={`perspective-grid-container ${className}`}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                overflow: "hidden",
                backgroundColor: "var(--bg-dark)",
                perspective: "1000px",
                transformStyle: "preserve-3d",
                zIndex: 0,
            }}
        >
            <div
                style={{
                    position: "absolute",
                    width: "160vw",
                    height: "160vh",
                    display: "grid",
                    originCenter: "center",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%) rotateX(60deg) rotateZ(10deg) scale(1.5)",
                    transformStyle: "preserve-3d",
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                }}
            >
                {/* Tiles */}
                {mounted &&
                    tiles.map((_, i) => (
                        <div
                            key={i}
                            className="perspective-grid-tile"
                        />
                    ))}
            </div>

            {/* Radial Gradient Mask (Overlay) */}
            {showOverlay && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        pointerEvents: "none",
                        zIndex: 1,
                        background: `radial-gradient(circle at 50% 40%, transparent 20%, var(--bg-dark) ${fadeRadius}%)`,
                    }}
                />
            )}
        </div>
    );
}

export default PerspectiveGrid;
