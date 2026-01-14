-- Create GIN index for products.attributes JSONB column
CREATE INDEX IF NOT EXISTS idx_products_attributes_gin ON products USING gin (attributes);
