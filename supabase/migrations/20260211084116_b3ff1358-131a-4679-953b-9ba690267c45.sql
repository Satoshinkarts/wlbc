
-- Drop the problematic policy that lets users update any field on their orders
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;

-- Create a controlled RPC for users to cancel only pending orders
CREATE OR REPLACE FUNCTION public.cancel_own_order(_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_status TEXT;
BEGIN
  SELECT status INTO _current_status
  FROM orders
  WHERE id = _order_id AND user_id = auth.uid();

  IF _current_status = 'pending' THEN
    UPDATE orders
    SET status = 'cancelled', updated_at = now()
    WHERE id = _order_id AND user_id = auth.uid();
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;
