INSERT INTO locations(name,type) SELECT 'Main Shop','MAIN_SHOP' WHERE NOT EXISTS (SELECT 1 FROM locations WHERE type='MAIN_SHOP');
