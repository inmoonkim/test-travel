import Amadeus from "amadeus";

let instance: Amadeus | null = null;

export function getAmadeusClient(): Amadeus {
  if (!instance) {
    instance = new Amadeus({
      clientId: process.env.AMADEUS_CLIENT_ID ?? "",
      clientSecret: process.env.AMADEUS_CLIENT_SECRET ?? "",
    });
  }
  return instance;
}
