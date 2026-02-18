
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error fetching consultation:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No consultations found.');
        return;
    }

    const consultation = data[0];
    console.log('Latest Consultation ID:', consultation.id);
    console.log('Style Recommendations:', JSON.stringify(consultation.style_recommendations, null, 2));
}

main();
