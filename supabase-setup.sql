-- SmartAqua Database Setup for Supabase
-- Run this in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE alert_type AS ENUM ('LEAK_DETECTED', 'OVERFLOW', 'PUMP_FAULT', 'LOW_LEVEL');
CREATE TYPE water_quality AS ENUM ('excellent', 'good', 'fair', 'poor');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Towns table
CREATE TABLE towns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL,
    country VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Homes table (users can only have one home)
CREATE TABLE homes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    town_id UUID NOT NULL REFERENCES towns(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id) -- Ensures users can only have one home
);

-- Alerts table
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    alert_type alert_type NOT NULL,
    message TEXT NOT NULL,
    level_cm DECIMAL(5,2) NOT NULL,
    percent_full DECIMAL(5,2) NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sensor data table
CREATE TABLE sensor_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    water_level DECIMAL(5,2) NOT NULL,
    temperature DECIMAL(4,2) NOT NULL,
    ph_level DECIMAL(3,2) NOT NULL,
    turbidity DECIMAL(5,2) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blockchain data table
CREATE TABLE blockchain_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    transaction_hash VARCHAR(66) NOT NULL,
    block_number BIGINT NOT NULL,
    gas_used BIGINT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Water usage analytics table
CREATE TABLE water_usage_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    daily_usage DECIMAL(8,2) NOT NULL,
    monthly_usage DECIMAL(8,2) NOT NULL,
    yearly_usage DECIMAL(8,2) NOT NULL,
    peak_usage_hour INTEGER NOT NULL,
    average_usage DECIMAL(8,2) NOT NULL,
    recorded_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings table
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    pump_auto_mode BOOLEAN DEFAULT TRUE,
    alert_threshold_low DECIMAL(5,2) DEFAULT 30.0,
    alert_threshold_high DECIMAL(5,2) DEFAULT 90.0,
    maintenance_reminder_days INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_homes_user_id ON homes(user_id);
CREATE INDEX idx_homes_town_id ON homes(town_id);
CREATE INDEX idx_alerts_home_id ON alerts(home_id);
CREATE INDEX idx_alerts_created_at ON alerts(created_at);
CREATE INDEX idx_alerts_resolved ON alerts(resolved);
CREATE INDEX idx_sensor_data_home_id ON sensor_data(home_id);
CREATE INDEX idx_sensor_data_timestamp ON sensor_data(timestamp);
CREATE INDEX idx_blockchain_data_home_id ON blockchain_data(home_id);
CREATE INDEX idx_water_usage_home_id ON water_usage_analytics(home_id);
CREATE INDEX idx_water_usage_date ON water_usage_analytics(recorded_date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_towns_updated_at BEFORE UPDATE ON towns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_homes_updated_at BEFORE UPDATE ON homes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
-- Sample towns
INSERT INTO towns (name, state, country) VALUES
('Springfield', 'Illinois', 'USA'),
('Riverside', 'California', 'USA'),
('Greenville', 'South Carolina', 'USA');

-- Sample admin user
INSERT INTO users (id, email, full_name, role) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@smartaqua.com', 'Admin User', 'admin');

-- Sample regular user
INSERT INTO users (id, email, full_name, role) VALUES
('00000000-0000-0000-0000-000000000002', 'user@smartaqua.com', 'Regular User', 'user');

-- Sample homes
INSERT INTO homes (user_id, name, address, town_id) VALUES
('00000000-0000-0000-0000-000000000001', 'Admin House', '123 Admin Street', (SELECT id FROM towns WHERE name = 'Springfield')),
('00000000-0000-0000-0000-000000000002', 'User House', '456 User Avenue', (SELECT id FROM towns WHERE name = 'Riverside'));

-- Sample alerts
INSERT INTO alerts (home_id, alert_type, message, level_cm, percent_full) VALUES
((SELECT id FROM homes WHERE name = 'User House'), 'LOW_LEVEL', 'Water level below 30% - consider refilling', 55.2, 27.6),
((SELECT id FROM homes WHERE name = 'Admin House'), 'LEAK_DETECTED', 'Potential leak detected - water level dropping faster than normal usage', 145.3, 72.65);

-- Sample sensor data
INSERT INTO sensor_data (home_id, water_level, temperature, ph_level, turbidity) VALUES
((SELECT id FROM homes WHERE name = 'User House'), 55.2, 20.5, 7.2, 1.5),
((SELECT id FROM homes WHERE name = 'Admin House'), 145.3, 19.8, 6.8, 2.1);

-- Sample system settings
INSERT INTO system_settings (home_id, pump_auto_mode, alert_threshold_low, alert_threshold_high) VALUES
((SELECT id FROM homes WHERE name = 'User House'), TRUE, 25.0, 85.0),
((SELECT id FROM homes WHERE name = 'Admin House'), TRUE, 30.0, 90.0);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE homes ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Homes policies
CREATE POLICY "Users can view own homes" ON homes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own homes" ON homes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own homes" ON homes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own homes" ON homes
    FOR DELETE USING (auth.uid() = user_id);

-- Alerts policies
CREATE POLICY "Users can view own home alerts" ON alerts
    FOR SELECT USING (
        home_id IN (SELECT id FROM homes WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert own home alerts" ON alerts
    FOR INSERT WITH CHECK (
        home_id IN (SELECT id FROM homes WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update own home alerts" ON alerts
    FOR UPDATE USING (
        home_id IN (SELECT id FROM homes WHERE user_id = auth.uid())
    );

-- Sensor data policies
CREATE POLICY "Users can view own home sensor data" ON sensor_data
    FOR SELECT USING (
        home_id IN (SELECT id FROM homes WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert own home sensor data" ON sensor_data
    FOR INSERT WITH CHECK (
        home_id IN (SELECT id FROM homes WHERE user_id = auth.uid())
    );

-- Blockchain data policies
CREATE POLICY "Users can view own home blockchain data" ON blockchain_data
    FOR SELECT USING (
        home_id IN (SELECT id FROM homes WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert own home blockchain data" ON blockchain_data
    FOR INSERT WITH CHECK (
        home_id IN (SELECT id FROM homes WHERE user_id = auth.uid())
    );

-- Water usage analytics policies
CREATE POLICY "Users can view own home water usage" ON water_usage_analytics
    FOR SELECT USING (
        home_id IN (SELECT id FROM homes WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert own home water usage" ON water_usage_analytics
    FOR INSERT WITH CHECK (
        home_id IN (SELECT id FROM homes WHERE user_id = auth.uid())
    );

-- System settings policies
CREATE POLICY "Users can view own home settings" ON system_settings
    FOR SELECT USING (
        home_id IN (SELECT id FROM homes WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update own home settings" ON system_settings
    FOR UPDATE USING (
        home_id IN (SELECT id FROM homes WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert own home settings" ON system_settings
    FOR INSERT WITH CHECK (
        home_id IN (SELECT id FROM homes WHERE user_id = auth.uid())
    );

-- Admin policies (admins can see everything)
CREATE POLICY "Admins can view all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can view all homes" ON homes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can view all alerts" ON alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can view all sensor data" ON sensor_data
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can view all blockchain data" ON blockchain_data
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can view all water usage" ON water_usage_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can view all settings" ON system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Towns are public (everyone can read)
CREATE POLICY "Everyone can view towns" ON towns
    FOR SELECT USING (true);

-- Create functions for AI integration
CREATE OR REPLACE FUNCTION get_home_analytics(home_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'home', (SELECT row_to_json(h) FROM homes h WHERE h.id = home_uuid),
        'recent_alerts', (
            SELECT json_agg(row_to_json(a)) 
            FROM alerts a 
            WHERE a.home_id = home_uuid 
            AND a.created_at > NOW() - INTERVAL '7 days'
        ),
        'latest_sensor_data', (
            SELECT row_to_json(s) 
            FROM sensor_data s 
            WHERE s.home_id = home_uuid 
            ORDER BY s.timestamp DESC 
            LIMIT 1
        ),
        'water_usage_stats', (
            SELECT json_agg(row_to_json(w)) 
            FROM water_usage_analytics w 
            WHERE w.home_id = home_uuid 
            AND w.recorded_date > CURRENT_DATE - INTERVAL '30 days'
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's home data for AI
CREATE OR REPLACE FUNCTION get_user_home_data(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'user', (SELECT row_to_json(u) FROM users u WHERE u.id = user_uuid),
        'homes', (
            SELECT json_agg(
                json_build_object(
                    'home', row_to_json(h),
                    'analytics', get_home_analytics(h.id)
                )
            )
            FROM homes h 
            WHERE h.user_id = user_uuid
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;