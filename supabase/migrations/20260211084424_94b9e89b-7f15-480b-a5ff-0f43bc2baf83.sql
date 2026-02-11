
CREATE OR REPLACE FUNCTION public.validate_and_create_order(_items jsonb, _shipping_address text DEFAULT ''::text, _notes text DEFAULT ''::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  _order_id UUID;
  _calculated_total NUMERIC;
  _total_units INTEGER;
  _discount_pct NUMERIC;
  _user_id UUID;
  _item JSONB;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate _items is a non-empty array with bounded length
  IF _items IS NULL OR jsonb_typeof(_items) != 'array' THEN
    RAISE EXCEPTION 'Items must be a JSON array';
  END IF;
  IF jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'Items array cannot be empty';
  END IF;
  IF jsonb_array_length(_items) > 100 THEN
    RAISE EXCEPTION 'Too many items (max 100)';
  END IF;

  -- Validate text input lengths
  IF LENGTH(_shipping_address) > 500 THEN
    RAISE EXCEPTION 'Shipping address too long';
  END IF;
  IF LENGTH(_notes) > 1000 THEN
    RAISE EXCEPTION 'Notes too long';
  END IF;

  -- Validate each item structure
  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    IF NOT (_item ? 'product_id' AND _item ? 'quantity') THEN
      RAISE EXCEPTION 'Each item must have product_id and quantity';
    END IF;
    IF (_item->>'quantity')::INTEGER <= 0 OR (_item->>'quantity')::INTEGER > 10000 THEN
      RAISE EXCEPTION 'Quantity must be between 1 and 10000';
    END IF;
  END LOOP;

  -- Calculate subtotal using server-side prices
  SELECT COALESCE(SUM(p.price * (item->>'quantity')::INTEGER), 0),
         COALESCE(SUM((item->>'quantity')::INTEGER), 0)
  INTO _calculated_total, _total_units
  FROM jsonb_array_elements(_items) AS item
  JOIN products p ON p.id = (item->>'product_id')::UUID AND p.is_active = true;

  IF _calculated_total <= 0 OR _total_units <= 0 THEN
    RAISE EXCEPTION 'No valid items in order';
  END IF;

  -- Apply volume discount tiers
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

  INSERT INTO orders (user_id, total, shipping_address, notes, status)
  VALUES (_user_id, _calculated_total, _shipping_address, _notes, 'pending')
  RETURNING id INTO _order_id;

  INSERT INTO order_items (order_id, product_id, quantity, price)
  SELECT _order_id, (item->>'product_id')::UUID, (item->>'quantity')::INTEGER, p.price
  FROM jsonb_array_elements(_items) AS item
  JOIN products p ON p.id = (item->>'product_id')::UUID AND p.is_active = true;

  RETURN _order_id;
END;
$$;
