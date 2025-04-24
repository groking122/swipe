import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    // Get a sample record to check column names
    const { data, error } = await supabase
      .from('memes')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error fetching memes table structure:', error);
      return NextResponse.json({ 
        error: error.message 
      }, { status: 500 });
    }

    // If we have data, extract column names
    const columns = data && data.length > 0 ? Object.keys(data[0]) : [];

    // Create table if it doesn't exist
    if (error && error.message.includes("relation \"memes\" does not exist")) {
      const { error: createError } = await supabase.rpc('create_memes_table');
      
      if (createError) {
        console.error('Error creating memes table:', createError);
        return NextResponse.json({ 
          error: createError.message,
          action: 'tried_to_create_table'
        }, { status: 500 });
      }
      
      return NextResponse.json({
        message: 'Memes table created successfully',
        action: 'created_table'
      });
    }

    return NextResponse.json({
      columns,
      hasImageUrl: columns.includes('image_url'),
      hasImagePath: columns.includes('image_path'),
      recordCount: data ? data.length : 0,
      sampleData: data && data.length > 0 ? data[0] : null
    });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: error.message || 'Unknown error' 
    }, { status: 500 });
  }
} 