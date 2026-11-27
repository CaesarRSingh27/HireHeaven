"use client";

import { CSSProperties, HTMLAttributes, useEffect, useRef, useState } from "react";

type MotionCardProps = HTMLAttributes<HTMLElement> & {
  as?: "article" | "div" | "section";
  delay?: number;
};

export default function MotionCard({
  as: Tag = "article",
  delay = 0,
  className = "",
  onPointerMove,
  onPointerLeave,
  style,
  ...props
}: MotionCardProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) { setVisible(true); return; }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -36px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    event.currentTarget.style.setProperty("--pointer-x", `${x * 100}%`);
    event.currentTarget.style.setProperty("--pointer-y", `${y * 100}%`);
    event.currentTarget.style.setProperty("--tilt-x", `${(0.5 - y) * 2.2}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${(x - 0.5) * 2.2}deg`);
    onPointerMove?.(event);
  }

  function handlePointerLeave(event: React.PointerEvent<HTMLElement>) {
    event.currentTarget.style.setProperty("--tilt-x", "0deg");
    event.currentTarget.style.setProperty("--tilt-y", "0deg");
    onPointerLeave?.(event);
  }

  const Component = Tag;
  return (
    <Component
      {...props}
      ref={ref as never}
      className={`motion-card ${visible ? "motion-card-visible" : ""} ${className}`}
      style={{ ...style, "--motion-delay": `${delay}ms` } as CSSProperties}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    />
  );
}
