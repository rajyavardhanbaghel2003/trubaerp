-- Add detailed fee breakdown columns to fees table
ALTER TABLE public.fees 
ADD COLUMN IF NOT EXISTS tuition_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS library_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS lab_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS other_charges numeric DEFAULT 0;

-- Enable realtime for payments table
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;