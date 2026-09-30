CREATE TABLE IF NOT EXISTS website_content (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), content_type text NOT NULL CHECK(content_type IN ('ABOUT','PRODUCT','ANNOUNCEMENT','CONTACT','HERO')), title text NOT NULL, body text, image_url text, public_price numeric(14,2), status text NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','PUBLISHED','UNPUBLISHED')), sort_order integer NOT NULL DEFAULT 0, published_at timestamptz, created_by uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_by uuid REFERENCES users(id), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_website_content_public ON website_content(status,content_type,sort_order);
