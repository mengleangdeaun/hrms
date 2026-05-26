import { enUS, km, zhCN } from "date-fns/locale";

export const getDayFnsLocale = (lang: string) => {
  switch (lang) {
    case "kh":
      return km;
    case "zh":
      return zhCN;
    default:
      return enUS;
  }
};
