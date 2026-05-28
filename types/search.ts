export interface SearchParams {
  origin: string;
  destination: string;
  departFrom: string;
  departTo: string;
  returnFrom: string;
  returnTo: string;
  adults: number;
  children: number;
}

export interface FlightOffer {
  id: string;
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  bookingUrl: string;
}

export interface HotelOffer {
  id: string;
  hotelId: string;
  hotelName: string;
  nightlyRate: number;
  bookingUrl: string;
}

export interface ComboOffer {
  flight: FlightOffer;
  hotel: HotelOffer;
  combinedPrice: number;
}

export interface DayPrice {
  date: string;
  minPrice: number | null;
  combos: ComboOffer[];
}
