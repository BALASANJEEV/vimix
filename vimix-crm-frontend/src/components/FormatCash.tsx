import React from "react";

interface FormatCashProps {
  amount?: number | null;
  className?: string;
  showSymbol?: boolean;
}

const FormatCash: React.FC<FormatCashProps> = ({
  amount,
  className = "",
  showSymbol = true,
}) => {
  const formatShortIndianNumber = (num: number): string => {
    if (num === 0) return "0"; // ✅ show 0 properly

    const crore = Math.floor(num / 10000000);
    num %= 10000000;

    const lakh = Math.floor(num / 100000);
    num %= 100000;

    const thousand = Math.floor(num / 1000);

    const parts: string[] = [];
    if (crore) parts.push(`${crore}Cr`);
    if (lakh) parts.push(`${lakh}L`);
    if (thousand) parts.push(`${thousand}K`);

    // ✅ if less than 1000, show full number (like ₹500)
    if (parts.length === 0) parts.push(num.toString());

    return parts.join(" ");
  };

  if (amount === null || amount === undefined || isNaN(amount)) {
    return <span className={className}>-</span>;
  }

  const formatted = formatShortIndianNumber(amount);
  return (
    <span className={className}>{showSymbol ? `${formatted}` : formatted}</span>
  );
};

export default FormatCash;
