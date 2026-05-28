declare module "amadeus" {
  interface FlightOffersSearchGetParams {
    originLocationCode: string;
    destinationLocationCode: string;
    departureDate: string;
    returnDate?: string;
    adults: number;
    children?: number;
    max?: number;
  }

  interface HotelsByCity {
    get(params: { cityCode: string; radius?: number; radiusUnit?: string }): Promise<{ data: unknown[] }>;
  }

  interface HotelOffersSearch {
    get(params: {
      hotelIds: string;
      checkInDate: string;
      checkOutDate: string;
      adults?: number;
      roomQuantity?: number;
    }): Promise<{ data: unknown[] }>;
  }

  interface FlightOffersSearch {
    get(params: FlightOffersSearchGetParams): Promise<{ data: unknown[] }>;
  }

  interface Shopping {
    flightOffersSearch: FlightOffersSearch;
    hotelOffersSearch: HotelOffersSearch;
  }

  interface ReferenceData {
    locations: {
      hotels: {
        byCity: HotelsByCity;
      };
    };
  }

  interface AmadeusOptions {
    clientId: string;
    clientSecret: string;
    hostname?: string;
  }

  class Amadeus {
    constructor(options: AmadeusOptions);
    shopping: Shopping;
    referenceData: ReferenceData;
  }

  export default Amadeus;
}
