const API_KEY = "YOUR_API_KEY";

function isWeekend(date){
  let date = new Date(date);
  let day = date.getDay();

  return (day === 0 || day === 6);
}

async function getUsHolidays(year) {
  const url = `https://holidayapi.com/v1/holidays?country=US&year=${year}&key=${API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();

  // Retorna array de datas no formato "YYYY-MM-DD"
  return data.holidays.map(h => h.date);
}

async function getEuHolidays(year) {
  const euCountries = ['DE', 'FR', 'IT', 'ES', 'PT', 'NL', 'BE'];
  let allHolidays = [];

  for (const country of euCountries) {
    const url = `https://holidayapi.com/v1/holidays?country=${country}&year=${year}&key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    allHolidays = allHolidays.concat(data.holidays.map(h => h.date));
  }

  return allHolidays;
}

async function isHoliday(date, jurisdiction){
  let holidays = [];
  const euJurisdiction = [
    "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
    "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
    "PL", "PT", "RO", "SK", "SI", "ES", "SE"
  ];

  let date = new Date(date);
  const dateString = date.toISOString().substring(0, 10);

  if (jurisdiction.toUpperCase() === 'US'){
    holidays = await getUsHolidays(date.getFullYear());

    return holidays.includes(dateString);
  } else if (euJurisdiction.includes(jurisdiction.toUpperCase())) {
    holidays = await getEuHolidays(date.getFullYear());

    return holidays.includes(dateString);
  } else {
    return false;
  }
}

async function isBusinessDay(date, jurisdiction){
  return !(isWeekend(date) || await isHoliday(date, jurisdiction));
}

async function moveToNextBusinessDate(date, jurisdiction, businessDayConvention){
  const dayInMilliseconds = 1000 * 60 * 60 * 24;
  let newDate = new Date(date);

  if (await isBusinessDay(newDate, jurisdiction)) {
    return newDate;
  } else {
    if (businessDayConvention === 'Following') {
      do {
        newDate = new Date(newDate.getTime() + dayInMilliseconds);
      } while(!(await isBusinessDay(newDate, jurisdiction)));
      
      return newDate;
    }
    else if(businessDayConvention === 'Preceding') {
      do {
        newDate = new Date(newDate.getTime() - dayInMilliseconds);
      } while(!(await isBusinessDay(newDate, jurisdiction)));

      return newDate;
    }
    else {
      throw new Error(`Business day convention ${businessDayConvention} not supported`);
    }
  }
}

function countHolidays(startDate, endDate){
  
}

function countWeekends(startDate, endDate){
  const dayInMilliseconds = 1000 * 60 * 60 * 24;
  let startDay = startDate.getDay(); let endDay = endDate.getDay();
  let daysGap = Math.abs(endDate.getTime() - startDate.getTime()) / dayInMilliseconds;

  return ((daysGap%7)*2) - (startDay>0) - (endDay<6);
}

function moveDateNumberOfBusinessDays(date, jurisdiction, numberOfDaysToMove){
  let currentDate = new Date(date);

  if (numberOfDaysToMove === 0){
    return currentDate;
  } else{
    const dayInMilliseconds = 1000 * 60 * 60 * 24;
    let endDate = new Date(currentDate.getTime() + (dayInMilliseconds*numberOfDaysToMove));
    let daysToJump = countWeekends(currentDate, endDate) + countHolidays(currentDate, endDate);

    return moveDateNumberOfBusinessDays(endDate.toISOString().substring(0, 10), jurisdiction, daysToJump);
  }
}