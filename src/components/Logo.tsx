import type React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  height?: string;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = "md", height, className = "" }) => {
  const sizeClasses = {
    sm: "h-10",
    md: "h-18",
    lg: "h-20",
  };

  const style = height ? { height } : undefined;

  return (
    <img
      src="/logo.svg"
      alt="NeoScape Properties"
      className={`block shrink-0 w-auto object-contain ${sizeClasses[size]} ${className}`}
      style={style}
    />
  );
};

export default Logo;
