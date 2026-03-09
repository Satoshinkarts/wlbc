ALTER TABLE orders DROP CONSTRAINT orders_promo_code_id_fkey;
ALTER TABLE orders ADD CONSTRAINT orders_promo_code_id_fkey FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE SET NULL;