import { usStates } from "@/lib/order";

/**
 * Suggestions for the checkout's State and City boxes. Customers can still type any city:
 * these are the larger cities of each state, not a complete list.
 */
export const citiesByState: Record<string, string[]> = {
  AL: ["Auburn", "Birmingham", "Decatur", "Dothan", "Hoover", "Huntsville", "Madison", "Mobile", "Montgomery", "Tuscaloosa"],
  AK: ["Anchorage", "Fairbanks", "Juneau", "Kenai", "Ketchikan", "Kodiak", "Palmer", "Sitka", "Wasilla"],
  AZ: ["Chandler", "Flagstaff", "Gilbert", "Glendale", "Mesa", "Peoria", "Phoenix", "Scottsdale", "Surprise", "Tempe", "Tucson", "Yuma"],
  AR: ["Bentonville", "Conway", "Fayetteville", "Fort Smith", "Jonesboro", "Little Rock", "North Little Rock", "Pine Bluff", "Rogers", "Springdale"],
  CA: [
    "Anaheim", "Bakersfield", "Fontana", "Fremont", "Fresno", "Irvine", "Long Beach", "Los Angeles", "Modesto", "Oakland", "Oxnard",
    "Pasadena", "Riverside", "Sacramento", "San Bernardino", "San Diego", "San Francisco", "San Jose", "Santa Ana", "Santa Clara",
    "Stockton", "Sunnyvale",
  ],
  CO: ["Arvada", "Aurora", "Boulder", "Colorado Springs", "Denver", "Fort Collins", "Greeley", "Lakewood", "Longmont", "Pueblo", "Thornton", "Westminster"],
  CT: ["Bridgeport", "Bristol", "Danbury", "Greenwich", "Hartford", "Meriden", "New Britain", "New Haven", "Norwalk", "Stamford", "Waterbury"],
  DE: ["Dover", "Georgetown", "Lewes", "Middletown", "Milford", "Newark", "Rehoboth Beach", "Seaford", "Smyrna", "Wilmington"],
  DC: ["Washington"],
  FL: [
    "Boca Raton", "Cape Coral", "Clearwater", "Coral Springs", "Fort Lauderdale", "Gainesville", "Hialeah", "Hollywood", "Jacksonville",
    "Lakeland", "Miami", "Orlando", "Pembroke Pines", "Pensacola", "Port St. Lucie", "Sarasota", "St. Petersburg", "Tallahassee", "Tampa",
    "West Palm Beach",
  ],
  GA: ["Albany", "Alpharetta", "Athens", "Atlanta", "Augusta", "Columbus", "Johns Creek", "Macon", "Marietta", "Roswell", "Sandy Springs", "Savannah", "South Fulton"],
  HI: ["Hilo", "Honolulu", "Kahului", "Kailua", "Kaneohe", "Kapolei", "Kihei", "Lihue", "Pearl City", "Waipahu"],
  ID: ["Boise", "Caldwell", "Coeur d'Alene", "Idaho Falls", "Lewiston", "Meridian", "Nampa", "Pocatello", "Post Falls", "Twin Falls"],
  IL: ["Aurora", "Bloomington", "Champaign", "Chicago", "Cicero", "Elgin", "Evanston", "Joliet", "Naperville", "Peoria", "Rockford", "Schaumburg", "Springfield", "Waukegan"],
  IN: ["Bloomington", "Carmel", "Evansville", "Fishers", "Fort Wayne", "Gary", "Hammond", "Indianapolis", "Lafayette", "Muncie", "Noblesville", "South Bend"],
  IA: ["Ames", "Ankeny", "Cedar Rapids", "Council Bluffs", "Davenport", "Des Moines", "Dubuque", "Iowa City", "Sioux City", "Waterloo", "West Des Moines"],
  KS: ["Hutchinson", "Kansas City", "Lawrence", "Lenexa", "Manhattan", "Olathe", "Overland Park", "Salina", "Shawnee", "Topeka", "Wichita"],
  KY: ["Bowling Green", "Covington", "Elizabethtown", "Florence", "Frankfort", "Georgetown", "Hopkinsville", "Lexington", "Louisville", "Owensboro", "Richmond"],
  LA: ["Alexandria", "Baton Rouge", "Bossier City", "Houma", "Kenner", "Lafayette", "Lake Charles", "Metairie", "Monroe", "New Orleans", "Shreveport"],
  ME: ["Auburn", "Augusta", "Bangor", "Biddeford", "Lewiston", "Portland", "Saco", "Sanford", "South Portland", "Westbrook"],
  MD: ["Annapolis", "Baltimore", "Bethesda", "Bowie", "Columbia", "Frederick", "Gaithersburg", "Germantown", "Hagerstown", "Rockville", "Silver Spring", "Towson"],
  MA: ["Boston", "Brockton", "Cambridge", "Fall River", "Framingham", "Lowell", "Lynn", "New Bedford", "Newton", "Quincy", "Somerville", "Springfield", "Worcester"],
  MI: ["Ann Arbor", "Clinton Township", "Dearborn", "Detroit", "Flint", "Grand Rapids", "Kalamazoo", "Lansing", "Livonia", "Southfield", "Sterling Heights", "Troy", "Warren"],
  MN: ["Bloomington", "Brooklyn Park", "Duluth", "Eagan", "Eden Prairie", "Maple Grove", "Minneapolis", "Plymouth", "Rochester", "Saint Paul", "St. Cloud", "Woodbury"],
  MS: ["Biloxi", "Gulfport", "Hattiesburg", "Jackson", "Meridian", "Olive Branch", "Oxford", "Southaven", "Starkville", "Tupelo"],
  MO: ["Columbia", "Independence", "Jefferson City", "Joplin", "Kansas City", "Lee's Summit", "O'Fallon", "Springfield", "St. Charles", "St. Joseph", "St. Louis"],
  MT: ["Anaconda", "Billings", "Bozeman", "Butte", "Great Falls", "Havre", "Helena", "Kalispell", "Miles City", "Missoula"],
  NE: ["Bellevue", "Fremont", "Grand Island", "Hastings", "Kearney", "Lincoln", "Norfolk", "North Platte", "Omaha", "Papillion"],
  NV: ["Carson City", "Elko", "Henderson", "Las Vegas", "Mesquite", "North Las Vegas", "Paradise", "Reno", "Sparks", "Spring Valley"],
  NH: ["Concord", "Derry", "Dover", "Hudson", "Keene", "Londonderry", "Manchester", "Merrimack", "Nashua", "Portsmouth", "Rochester", "Salem"],
  NJ: [
    "Camden", "Cherry Hill", "Clifton", "Edison", "Elizabeth", "Hamilton", "Hoboken", "Jersey City", "Lakewood", "Newark", "Paterson",
    "Princeton", "Toms River", "Trenton", "Woodbridge",
  ],
  NM: ["Alamogordo", "Albuquerque", "Carlsbad", "Clovis", "Farmington", "Hobbs", "Las Cruces", "Rio Rancho", "Roswell", "Santa Fe"],
  NY: [
    "Albany", "Bronx", "Brooklyn", "Buffalo", "Ithaca", "Long Island City", "Mount Vernon", "New Rochelle", "New York", "Queens",
    "Rochester", "Schenectady", "Staten Island", "Syracuse", "Utica", "White Plains", "Yonkers",
  ],
  NC: ["Asheville", "Cary", "Chapel Hill", "Charlotte", "Concord", "Durham", "Fayetteville", "Greensboro", "Greenville", "High Point", "Raleigh", "Wilmington", "Winston-Salem"],
  ND: ["Bismarck", "Dickinson", "Fargo", "Grand Forks", "Jamestown", "Mandan", "Minot", "Wahpeton", "West Fargo", "Williston"],
  OH: ["Akron", "Canton", "Cincinnati", "Cleveland", "Columbus", "Dayton", "Dublin", "Hamilton", "Lorain", "Mason", "Parma", "Springfield", "Toledo", "Youngstown"],
  OK: ["Broken Arrow", "Edmond", "Enid", "Lawton", "Midwest City", "Moore", "Norman", "Oklahoma City", "Owasso", "Stillwater", "Tulsa"],
  OR: ["Albany", "Beaverton", "Bend", "Corvallis", "Eugene", "Gresham", "Hillsboro", "Medford", "Portland", "Salem", "Springfield", "Tigard"],
  PA: [
    "Allentown", "Bethlehem", "Erie", "Harrisburg", "King of Prussia", "Lancaster", "Philadelphia", "Pittsburgh", "Reading", "Scranton",
    "State College", "Wilkes-Barre", "York",
  ],
  RI: ["Coventry", "Cranston", "Cumberland", "East Providence", "Newport", "North Providence", "Pawtucket", "Providence", "Warwick", "Woonsocket"],
  SC: ["Charleston", "Columbia", "Florence", "Goose Creek", "Greenville", "Mount Pleasant", "Myrtle Beach", "North Charleston", "Rock Hill", "Spartanburg", "Summerville", "Sumter"],
  SD: ["Aberdeen", "Brookings", "Huron", "Mitchell", "Pierre", "Rapid City", "Sioux Falls", "Spearfish", "Watertown", "Yankton"],
  TN: ["Brentwood", "Chattanooga", "Clarksville", "Franklin", "Hendersonville", "Jackson", "Johnson City", "Kingsport", "Knoxville", "Memphis", "Murfreesboro", "Nashville"],
  TX: [
    "Amarillo", "Arlington", "Austin", "Brownsville", "Corpus Christi", "Dallas", "El Paso", "Fort Worth", "Frisco", "Garland",
    "Grand Prairie", "Houston", "Irving", "Katy", "Killeen", "Laredo", "Lubbock", "McKinney", "Pasadena", "Plano", "San Antonio",
    "Sugar Land", "The Woodlands",
  ],
  UT: ["Layton", "Lehi", "Logan", "Ogden", "Orem", "Provo", "Salt Lake City", "Sandy", "South Jordan", "St. George", "West Jordan", "West Valley City"],
  VT: ["Barre", "Bennington", "Brattleboro", "Burlington", "Essex Junction", "Montpelier", "Newport", "Rutland", "South Burlington", "St. Albans", "Vergennes", "Winooski"],
  VA: [
    "Alexandria", "Arlington", "Charlottesville", "Chesapeake", "Fairfax", "Hampton", "Lynchburg", "Newport News", "Norfolk", "Portsmouth",
    "Reston", "Richmond", "Roanoke", "Suffolk", "Virginia Beach",
  ],
  WA: ["Bellevue", "Everett", "Federal Way", "Kent", "Kirkland", "Olympia", "Redmond", "Renton", "Seattle", "Spokane", "Spokane Valley", "Tacoma", "Vancouver", "Yakima"],
  WV: ["Beckley", "Charleston", "Clarksburg", "Fairmont", "Huntington", "Martinsburg", "Morgantown", "Parkersburg", "Weirton", "Wheeling"],
  WI: ["Appleton", "Eau Claire", "Green Bay", "Janesville", "Kenosha", "La Crosse", "Madison", "Milwaukee", "Oshkosh", "Racine", "Waukesha", "West Allis"],
  WY: ["Casper", "Cheyenne", "Evanston", "Gillette", "Green River", "Jackson", "Laramie", "Riverton", "Rock Springs", "Sheridan"],
};

/** "Texas", "texas" or "TX" → "TX". Returns null when the text isn't a US state. */
export function stateCodeFor(text: string): string | null {
  const value = text.trim().toLowerCase();
  if (!value) return null;
  const match = usStates.find(([code, name]) => code.toLowerCase() === value || name.toLowerCase() === value);
  return match ? match[0] : null;
}
