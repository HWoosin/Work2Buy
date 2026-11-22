import { Language } from "./constants";

export type CalculationResult = {
  hourlyWage: number;
  requiredHours: number;
  requiredDays: number;
};

export function calculateWorkCost(
  salary: string, workHours: string, workDays: string, price: string,
): CalculationResult | null {
  const monthlySalary = Number(salary);
  const dailyHours = Number(workHours);
  const monthlyDays = Number(workDays);
  const itemPrice = Number(price);

  if (monthlySalary <= 0 || dailyHours <= 0 || monthlyDays <= 0 || itemPrice <= 0) {
    return null;
  }

  const hourlyWage = monthlySalary / (dailyHours * monthlyDays);
  const requiredHours = itemPrice / hourlyWage;
  const requiredDays = requiredHours / dailyHours;
  return { hourlyWage, requiredHours, requiredDays };
}

export const formatWorkDays = (days: number, language: Language) => {
  const totalDays = Math.floor(days);

  const years = Math.floor(totalDays / 365);
  const remainingAfterYears = totalDays % 365;

  const months = Math.floor(remainingAfterYears / 30);
  const daysLeft = remainingAfterYears % 30;

  if (language === "en") {
    const parts: string[] = [];

    if (years > 0) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
    if (months > 0) parts.push(`${months} ${months === 1 ? "month" : "months"}`);
    if (daysLeft > 0 || parts.length === 0) {
      parts.push(`${daysLeft} ${daysLeft === 1 ? "day" : "days"}`);
    }

    return parts.join(", ");
  }

  if (years > 0) {
    return `${years}년 ${months}개월 ${daysLeft}일`;
  }

  if (months > 0) {
    return `${months}개월 ${daysLeft}일`;
  }

  return `${totalDays}일`;
};

