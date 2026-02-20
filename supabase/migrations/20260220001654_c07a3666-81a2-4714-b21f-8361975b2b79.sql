
CREATE OR REPLACE FUNCTION public.validate_and_create_order(_items jsonb, _shipping_address text DEFAULT ''::text, _notes text DEFAULT ''::text, _promo_code text DEFAULT NULL::text, _payment_proof_path text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _order_id UUID;
  _calculated_total NUMERIC;
  _total_units INTEGER;
  _pva_units INTEGER;
  _pva_subtotal NUMERIC;
  _other_subtotal NUMERIC;
  _discount_pct NUMERIC;
  _user_id UUID;
  _item JSONB;
  _promo RECORD;
  _promo_discount NUMERIC := 0;
  _promo_id UUID := NULL;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _items IS NULL OR jsonb_typeof(_items) != 'array' THEN
    RAISE EXCEPTION 'Items must be a JSON array';
  END IF;
  IF jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'Items array cannot be empty';
  END IF;
  IF jsonb_array_length(_items) > 100 THEN
    RAISE EXCEPTION 'Too many items (max 100)';
  END IF;

  IF LENGTH(_shipping_address) > 500 THEN
    RAISE EXCEPTION 'Shipping address too long';
  END IF;
  IF LENGTH(_notes) > 1000 THEN
    RAISE EXCEPTION 'Notes too long';
  END IF;
  IF _payment_proof_path IS NOT NULL AND LENGTH(_payment_proof_path) > 500 THEN
    RAISE EXCEPTION 'Payment proof path too long';
  END IF;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    IF NOT (_item ? 'product_id' AND _item ? 'quantity') THEN
      RAISE EXCEPTION 'Each item must have product_id and quantity';
    END IF;
    IF (_item->>'quantity')::INTEGER <= 0 OR (_item->>'quantity')::INTEGER > 10000 THEN
      RAISE EXCEPTION 'Quantity must be between 1 and 10000';
    END IF;
  END LOOP;

  SELECT COALESCE(SUM(p.price * (item->>'quantity')::INTEGER), 0),
         COALESCE(SUM((item->>'quantity')::INTEGER), 0)
  INTO _calculated_total, _total_units
  FROM jsonb_array_elements(_items) AS item
  JOIN products p ON p.id = (item->>'product_id')::UUID AND p.is_active = true;

  IF _calculated_total <= 0 OR _total_units <= 0 THEN
    RAISE EXCEPTION 'No valid items in order';
  END IF;

  SELECT COALESCE(SUM((item->>'quantity')::INTEGER), 0),
         COALESCE(SUM(p.price * (item->>'quantity')::INTEGER), 0)
  INTO _pva_units, _pva_subtotal
  FROM jsonb_array_elements(_items) AS item
  JOIN products p ON p.id = (item->>'product_id')::UUID AND p.is_active = true
  WHERE p.name = 'PVA - Gmail';

  _other_subtotal := _calculated_total - _pva_subtotal;

  IF _pva_units >= 300 THEN
    _discount_pct := 0.17;
  ELSIF _pva_units >= 200 THEN
    _discount_pct := 0.15;
  ELSIF _pva_units >= 100 THEN
    _discount_pct := 0.10;
  ELSE
    _discount_pct := 0;
  END IF;

  _calculated_total := _other_subtotal + (_pva_subtotal * (1 - _discount_pct));

  -- Apply promo code if provided
  IF _promo_code IS NOT NULL AND _promo_code != '' THEN
    SELECT * INTO _promo FROM promo_codes
    WHERE UPPER(code) = UPPER(_promo_code)
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
      AND (usage_limit IS NULL OR usage_count < usage_limit);

    IF _promo IS NULL THEN
      RAISE EXCEPTION 'Invalid or expired promo code';
    END IF;

    IF _calculated_total < _promo.min_order_total THEN
      RAISE EXCEPTION 'Order total does not meet minimum for this promo code';
    END IF;

    IF _promo.discount_type = 'percentage' THEN
      _promo_discount := _calculated_total * (_promo.discount_value / 100);
    ELSE
      _promo_discount := LEAST(_promo.discount_value, _calculated_total);
    END IF;

    _calculated_total := _calculated_total - _promo_discount;
    _promo_id := _promo.id;

    UPDATE promo_codes SET usage_count = usage_count + 1 WHERE id = _promo.id;
  END IF;

  INSERT INTO orders (user_id, total, shipping_address, notes, status, promo_code_id, promo_discount, payment_proof_path)
  VALUES (_user_id, _calculated_total, _shipping_address, _notes, 'pending',
          _promo_id, _promo_discount, _payment_proof_path)
  RETURNING id INTO _order_id;

  INSERT INTO order_items (order_id, product_id, quantity, price)
  SELECT _order_id, (item->>'product_id')::UUID, (item->>'quantity')::INTEGER, p.price
  FROM jsonb_array_elements(_items) AS item
  JOIN products p ON p.id = (item->>'product_id')::UUID AND p.is_active = true;

  RETURN _order_id;
END;
$function$;
