import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    // Get the schema of the memes table
    const { data: tableInfo, error: tableError } = await supabase
      .from('memes')
      .select('*')
      .limit(1);

    if (tableError) {
      return NextResponse.json({ 
        error: tableError.message 
      }, { status: 500 });
    }

    // Get all tables in the database
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables');

    // Get the column information for the memes table
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_columns', { table_name: 'memes' });

    return NextResponse.json({
      tableInfo: tableInfo ? Object.keys(tableInfo[0] || {}) : [],
      tables,
      columns,
      tableError,
      tablesError,
      columnsError
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Unknown error' 
    }, { status: 500 });
  }
} 