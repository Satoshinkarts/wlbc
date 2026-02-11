-- Add remit (cost/production cost) column to orders for profit tracking
ALTER TABLE public.orders ADD COLUMN remit numeric NOT NULL DEFAULT 0;

-- Add payment_proof_path to orders so admin can retrieve receipt
ALTER TABLE public.orders ADD COLUMN payment_proof_path text DEFAULT '';

-- Add delivery_file_path for files uploaded when marking as delivered
ALTER TABLE public.orders ADD COLUMN delivery_file_path text DEFAULT '';

-- Create storage bucket for delivery files
INSERT INTO storage.buckets (id, name, public) VALUES ('delivery-files', 'delivery-files', false)
ON CONFLICT (id) DO NOTHING;

-- Admin can manage delivery files
CREATE POLICY "Admins can manage delivery files"
ON storage.objects
FOR ALL
USING (bucket_id = 'delivery-files' AND (SELECT has_role(auth.uid(), 'admin'::app_role)));

-- Users can view their own delivery files
CREATE POLICY "Users can view own delivery files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'delivery-files' AND auth.uid()::text = (storage.foldername(name))[1]);