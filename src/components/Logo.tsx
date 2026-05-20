import type React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "h-7",
    md: "h-9",
    lg: "h-11",
  };

  return (
    <img
      src="/logo.svg"
      alt="NeoScape Properties"
      className={`${sizeClasses[size]} w-auto ${className}`}
    />
  );
};

export default Logo;
