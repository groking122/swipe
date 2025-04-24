import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define a type for PostgreSQL errors
interface PostgrestError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

export async function GET(request: NextRequest) {
  try {
    // Get the schema of the memes table
    const { data: tableInfo, error: tableError } = await supabase
      .from('memes')
      .select('*')
      .limit(1);

    // Handle table error
    const tableErrorMessage = tableError 
      ? (tableError as PostgrestError).message || 'Unknown error'
      : null;

    // Get all tables in the database
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables');

    // Handle tables error
    const tablesErrorMessage = tablesError
      ? (tablesError as PostgrestError).message || 'Unknown error'
      : null;

    // Get the column information for the memes table
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_columns', { table_name: 'memes' });

    // Handle columns error
    const columnsErrorMessage = columnsError
      ? (columnsError as PostgrestError).message || 'Unknown error'
      : null;

    return NextResponse.json({
      tableInfo: tableInfo ? Object.keys(tableInfo[0] || {}) : [],
      tables,
      columns,
      tableError: tableErrorMessage,
      tablesError: tablesErrorMessage,
      columnsError: columnsErrorMessage
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Unknown error' 
    }, { status: 500 });
  }
} 