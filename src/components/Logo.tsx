import type React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "h-8",
    md: "h-10",
    lg: "h-12",
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex items-center space-x-2">
        <img
          src="/logo.svg"
          alt="NeoScape Properties  logo"
          className={`${sizeClasses[size]} w-auto`}
        />
        <span className="text-xl font-bold text-gray-900">NeoScape Properties </span>
      </div>
    </div>
  );
};

export default Logo;
