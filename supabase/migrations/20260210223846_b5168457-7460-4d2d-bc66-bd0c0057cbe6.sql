
-- Server-side order creation with price validation and volume discounts
CREATE OR REPLACE FUNCTION public.validate_and_create_order(
  _items JSONB,
  _shipping_address TEXT DEFAULT '',
  _notes TEXT DEFAULT ''
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _order_id UUID;
  _calculated_total NUMERIC;
  _total_units INTEGER;
  _discount_pct NUMERIC;
  _user_id UUID;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate items exist and are active, calculate subtotal
  SELECT COALESCE(SUM(p.price * (item->>'quantity')::INTEGER), 0),
         COALESCE(SUM((item->>'quantity')::INTEGER), 0)
  INTO _calculated_total, _total_units
  FROM jsonb_array_elements(_items) AS item
  JOIN products p ON p.id = (item->>'product_id')::UUID AND p.is_active = true;

  IF _calculated_total <= 0 OR _total_units <= 0 THEN
    RAISE EXCEPTION 'No valid items in order';
  END IF;

  -- Apply volume discount tiers (must match client logic in pricing.ts)
  IF _total_units >= 300 THEN
    _discount_pct := 0.17;
  ELSIF _total_units >= 200 THEN
    _discount_pct := 0.15;
  ELSIF _total_units >= 100 THEN
    _discount_pct := 0.10;
  ELSE
    _discount_pct := 0;
  END IF;

  _calculated_total := _calculated_total * (1 - _discount_pct);

  -- Create order
  INSERT INTO orders (user_id, total, shipping_address, notes, status)
  VALUES (_user_id, _calculated_total, _shipping_address, _notes, 'pending')
  RETURNING id INTO _order_id;

  -- Create order items with server-validated prices
  INSERT INTO order_items (order_id, product_id, quantity, price)
  SELECT _order_id, (item->>'product_id')::UUID, (item->>'quantity')::INTEGER, p.price
  FROM jsonb_array_elements(_items) AS item
  JOIN products p ON p.id = (item->>'product_id')::UUID AND p.is_active = true;

  RETURN _order_id;
END;
$$;
