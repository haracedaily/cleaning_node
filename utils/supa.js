const supabase = require('@supabase/supabase-js');
require('dotenv').config();


const supa= supabase.createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const service = supabase.createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
module.exports = {supa,service};