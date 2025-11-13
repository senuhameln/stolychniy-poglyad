export const DISTRICTS = [
  "Голосіївський",
  "Дарницький",
  "Деснянський",
  "Дніпровський",
  "Оболонський",
  "Печерський",
  "Подільський",
  "Святошинський",
  "Солом'янський",
  "Шевченківський",
];

export const getDistrictLabel = (district: string): string => {
  return DISTRICTS.find((d) => d === district) || district;
};
