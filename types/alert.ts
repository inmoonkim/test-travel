export interface PriceAlert {
  id: string;
  cancel_token: string;
  email: string;
  origin: string;
  destination: string;
  depart_from: string;
  depart_to: string;
  return_from: string;
  return_to: string;
  adults: number;
  children: number;
  flight_target_price: number | null;
  hotel_target_price: number | null;
  is_active: number;
  created_at: string;
  last_notified_at: string | null;
}

export interface CreateAlertInput {
  email: string;
  origin: string;
  destination: string;
  depart_from: string;
  depart_to: string;
  return_from: string;
  return_to: string;
  adults: number;
  children: number;
  flight_target_price?: number | null;
  hotel_target_price?: number | null;
}
